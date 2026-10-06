import { useEffect, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Monitor, Moon, Sun } from 'lucide-react';
import { ErrorState } from '@/components/common/states';
import { PrivacyPanel } from '@/components/settings/privacy-panel';
import { applyFieldErrors } from '@/components/settings/form-errors';
import { SettingsRow, SettingsRowSkeleton, SettingsSection } from '@/components/settings/settings-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Segmented } from '@/components/ui/tabs';
import { useSettings, useUpdateSettings } from '@/hooks/use-queries';
import { SYNC_WINDOW_OPTIONS } from '@/lib/classification';
import { useTheme, type ThemePreference } from '@/lib/theme';
import type { AppSettings } from '@/types/api';

const int = (label: string, min: number, max: number) =>
  z
    .number({ invalid_type_error: `${label} is required` })
    .int('Use a whole number')
    .min(min, `Must be at least ${min}`)
    .max(max, `Must be at most ${max}`);

const schema = z.object({
  displayName: z.string().trim().min(1, 'Display name is required').max(80, 'Use 80 characters or fewer'),
  syncIntervalMinutes: int('Sync interval', 1, 1440),
  defaultInitialSyncDays: z.number(),
  confidencePct: z.number().min(50).max(99),
  autoUpdateStatus: z.boolean(),
  followUpDays: int('Follow-up days', 1, 90),
});

type FormValues = z.infer<typeof schema>;
const FIELDS = Object.keys(schema.shape);

const toForm = (s: AppSettings): FormValues => ({
  displayName: s.displayName,
  syncIntervalMinutes: s.syncIntervalMinutes,
  defaultInitialSyncDays: s.defaultInitialSyncDays,
  confidencePct: Math.round(s.confidenceThreshold * 100),
  autoUpdateStatus: s.autoUpdateStatus,
  followUpDays: s.followUpDays,
});

const toApi = (v: FormValues): AppSettings => ({
  displayName: v.displayName.trim(),
  syncIntervalMinutes: v.syncIntervalMinutes,
  defaultInitialSyncDays: v.defaultInitialSyncDays,
  confidenceThreshold: Math.round(v.confidencePct) / 100,
  autoUpdateStatus: v.autoUpdateStatus,
  followUpDays: v.followUpDays,
});

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Moon }[] = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
];

export default function GeneralSettingsPage() {
  const settings = useSettings();

  return (
    <div className="space-y-8 pb-6">
      {settings.isPending ? (
        <GeneralSkeleton />
      ) : settings.isError ? (
        <div className="rounded-[10px] border bg-card">
          <ErrorState error={settings.error} title="Could not load settings" onRetry={() => void settings.refetch()} />
        </div>
      ) : (
        <GeneralForm settings={settings.data} />
      )}
      <AppearanceSection />
      <PrivacyPanel />
    </div>
  );
}

function GeneralForm({ settings }: { settings: AppSettings }) {
  const update = useUpdateSettings();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toForm(settings) });
  const { register, control, handleSubmit, reset, setError, formState } = form;
  const err = formState.errors;

  // Re-sync with the server copy (after save, or when another tab updates it) — unless the user is editing.
  useEffect(() => {
    if (!form.formState.isDirty) reset(toForm(settings));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const onSubmit = handleSubmit(async (v) => {
    try {
      const saved = await update.mutateAsync(toApi(v));
      reset(toForm(saved));
    } catch (e) {
      applyFieldErrors(e, FIELDS, setError, { confidenceThreshold: 'confidencePct' });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      <SettingsSection title="Profile" description="How ApplyFlow addresses you.">
        <SettingsRow label="Display name" htmlFor="gs-name" description="Shown in the sidebar and greetings." error={err.displayName?.message}>
          <Input id="gs-name" className="sm:w-64" maxLength={80} autoComplete="name" aria-invalid={!!err.displayName} {...register('displayName')} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Sync" description="How often mailboxes are checked and how far back new accounts import.">
        <SettingsRow
          label="Sync interval"
          htmlFor="gs-interval"
          description="Minutes between automatic syncs of all enabled accounts (1–1440)."
          error={err.syncIntervalMinutes?.message}
        >
          <NumberWithSuffix suffix="min">
            <Input
              id="gs-interval"
              type="number"
              inputMode="numeric"
              min={1}
              max={1440}
              className="tabular w-24 text-right"
              aria-invalid={!!err.syncIntervalMinutes}
              {...register('syncIntervalMinutes', { valueAsNumber: true })}
            />
          </NumberWithSuffix>
        </SettingsRow>
        <SettingsRow
          label="Default initial sync window"
          htmlFor="gs-window"
          description="How much history to import when you connect a new account. Can be changed per account."
        >
          <Controller
            control={control}
            name="defaultInitialSyncDays"
            render={({ field }) => (
              <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                <SelectTrigger id="gs-window" className="sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SYNC_WINDOW_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Detection" description="How confidently an email must be classified before ApplyFlow acts on it.">
        <SettingsRow
          label="Confidence threshold"
          description="Status changes below this confidence are never applied automatically."
          error={err.confidencePct?.message}
        >
          <Controller
            control={control}
            name="confidencePct"
            render={({ field }) => (
              <div className="flex w-full items-center gap-3 sm:w-64">
                <span className="tabular text-2xs text-subtle">50%</span>
                <Slider
                  aria-label="Confidence threshold"
                  min={50}
                  max={99}
                  step={1}
                  value={[field.value]}
                  onValueChange={([n]) => field.onChange(n)}
                  onBlur={field.onBlur}
                />
                <span className="tabular w-10 shrink-0 rounded-md border bg-elevated px-1.5 py-0.5 text-center text-xs font-medium">
                  {field.value}%
                </span>
              </div>
            )}
          />
        </SettingsRow>
        <SettingsRow
          label="Auto-update status"
          htmlFor="gs-auto"
          description="Automatically move applications when a confident status-changing email arrives. Lower-confidence changes go to Needs Review."
        >
          <Controller
            control={control}
            name="autoUpdateStatus"
            render={({ field }) => <Switch id="gs-auto" checked={field.value} onCheckedChange={field.onChange} />}
          />
        </SettingsRow>
        <SettingsRow
          label="Follow-up reminder"
          htmlFor="gs-followup"
          description="Suggest a follow-up when an application has had no response for this many days (1–90)."
          error={err.followUpDays?.message}
        >
          <NumberWithSuffix suffix="days">
            <Input
              id="gs-followup"
              type="number"
              inputMode="numeric"
              min={1}
              max={90}
              className="tabular w-24 text-right"
              aria-invalid={!!err.followUpDays}
              {...register('followUpDays', { valueAsNumber: true })}
            />
          </NumberWithSuffix>
        </SettingsRow>
      </SettingsSection>

      <div className="sticky bottom-0 z-10 -mx-1 flex flex-col gap-2 border-t bg-background/95 px-1 py-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">{formState.isDirty ? 'You have unsaved changes.' : 'All changes saved.'}</p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" disabled={!formState.isDirty || update.isPending} onClick={() => reset(toForm(settings))}>
            Reset
          </Button>
          <Button type="submit" disabled={!formState.isDirty} loading={update.isPending}>
            Save changes
          </Button>
        </div>
      </div>
    </form>
  );
}

function NumberWithSuffix({ suffix, children }: { suffix: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {children}
      <span className="w-8 text-xs text-muted-foreground">{suffix}</span>
    </div>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  return (
    <SettingsSection title="Appearance" description="Stored on this device only.">
      <SettingsRow label="Theme" description="Applies immediately. System follows your OS setting.">
        <Segmented value={theme} onValueChange={setTheme} options={THEME_OPTIONS} />
      </SettingsRow>
    </SettingsSection>
  );
}

function GeneralSkeleton() {
  return (
    <div className="space-y-8" aria-busy>
      {[1, 2, 3].map((n) => (
        <div key={n} className="space-y-2.5">
          <Skeleton className="h-4 w-24" />
          <SettingsRowSkeleton rows={n} />
        </div>
      ))}
    </div>
  );
}
