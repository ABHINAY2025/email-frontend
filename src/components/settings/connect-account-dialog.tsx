import { useEffect, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight, ExternalLink, Info } from 'lucide-react';
import { ProviderMark } from '@/components/common/badges';
import { FormField } from '@/components/common/form-field';
import { ErrorNote } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateEmailAccount, useSettings } from '@/hooks/use-queries';
import { ApiClientError } from '@/lib/api';
import { ALL_PROVIDERS, PROVIDER_META, detectProvider } from '@/lib/classification';
import { cn } from '@/lib/utils';
import type { CreateEmailAccountRequest, EmailProvider } from '@/types/api';
import {
  ACCOUNT_FORM_FIELDS,
  type AccountFormValues,
  ImapFields,
  PasswordInput,
  SyncWindowField,
  connectAccountSchema,
} from './account-form';
import { applyFieldErrors, imapErrorMessage, type FriendlyError } from './form-errors';

const CONNECTABLE_PROVIDERS = ALL_PROVIDERS.filter((p) => p !== 'DEMO');
const ADVANCED_FIELDS = ['host', 'port', 'ssl', 'username', 'folder'] as const;

const blank = (initialSyncDays: number): AccountFormValues => ({
  email: '',
  appPassword: '',
  provider: 'IMAP',
  initialSyncDays,
  host: '',
  port: '993',
  ssl: true,
  username: '',
  folder: 'INBOX',
  enabled: true,
});

export function ConnectAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const create = useCreateEmailAccount();
  const settings = useSettings();
  const defaultWindow = settings.data?.defaultInitialSyncDays ?? 90;

  const form = useForm<AccountFormValues>({ resolver: zodResolver(connectAccountSchema), defaultValues: blank(defaultWindow) });
  const { register, control, handleSubmit, reset, setValue, setError, formState } = form;
  const err = formState.errors;

  const [submitError, setSubmitError] = useState<FriendlyError | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const providerTouched = useRef(false);

  useEffect(() => {
    if (open) {
      reset(blank(defaultWindow));
      providerTouched.current = false;
      setSubmitError(null);
      setAdvancedOpen(false);
      create.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Settings may arrive after the dialog opened — adopt the default window if untouched.
  useEffect(() => {
    if (open && !formState.dirtyFields.initialSyncDays) setValue('initialSyncDays', defaultWindow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultWindow]);

  const email = useWatch({ control, name: 'email' });
  const provider = useWatch({ control, name: 'provider' });

  useEffect(() => {
    if (!providerTouched.current) setValue('provider', detectProvider(email ?? ''));
  }, [email, setValue]);

  const onSubmit = handleSubmit(async (v) => {
    setSubmitError(null);
    const body: CreateEmailAccountRequest = {
      email: v.email.trim(),
      appPassword: v.appPassword,
      provider: v.provider,
      initialSyncDays: v.initialSyncDays,
    };
    // Only send advanced fields the user actually changed — otherwise backend provider defaults apply.
    const dirty = formState.dirtyFields;
    if (dirty.host && v.host) body.host = v.host;
    if (dirty.port && v.port) body.port = Number(v.port);
    if (dirty.ssl) body.ssl = v.ssl;
    if (dirty.username && v.username) body.username = v.username;
    if (dirty.folder && v.folder) body.folder = v.folder;

    try {
      await create.mutateAsync(body);
      onOpenChange(false);
    } catch (e) {
      applyFieldErrors(e, ACCOUNT_FORM_FIELDS, setError);
      if (e instanceof ApiClientError && ADVANCED_FIELDS.some((f) => e.fieldErrors?.[f])) setAdvancedOpen(true);
      setSubmitError(imapErrorMessage(e));
    } finally {
      // Never keep the password in form state longer than needed.
      setValue('appPassword', '', { shouldDirty: false, shouldValidate: false });
    }
  });

  const pending = create.isPending;
  const meta = PROVIDER_META[provider ?? 'IMAP'];

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect email account</DialogTitle>
          <DialogDescription>ApplyFlow connects over IMAP (read-only) and only keeps job-related emails.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="space-y-3.5">
            {submitError && (
              <ErrorNote>
                <p className="font-medium text-foreground">{submitError.title}</p>
                {submitError.detail && <p className="mt-0.5 text-muted-foreground">{submitError.detail}</p>}
              </ErrorNote>
            )}

            <FormField label="Email address" htmlFor="ca-email" error={err.email?.message} required>
              <Input
                id="ca-email"
                type="email"
                autoComplete="email"
                autoFocus
                spellCheck={false}
                placeholder="you@gmail.com"
                aria-invalid={!!err.email}
                {...register('email')}
              />
            </FormField>

            <FormField
              label="App password"
              htmlFor="ca-password"
              error={err.appPassword?.message}
              required
              hint={
                <>
                  Use an app password, not your regular password. For Gmail, create one at{' '}
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-0.5 text-primary underline-offset-2 hover:underline"
                  >
                    myaccount.google.com/apppasswords
                    <ExternalLink className="size-3" />
                  </a>{' '}
                  — 2-Step Verification must be enabled.
                </>
              }
            >
              <PasswordInput
                id="ca-password"
                autoComplete="new-password"
                placeholder="xxxx xxxx xxxx xxxx"
                aria-invalid={!!err.appPassword}
                {...register('appPassword')}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-x-3 gap-y-3.5 sm:grid-cols-2">
              <FormField
                label="Provider"
                htmlFor="ca-provider"
                error={err.provider?.message}
                hint={providerTouched.current ? undefined : 'Detected from the email domain'}
              >
                <Controller
                  control={control}
                  name="provider"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        providerTouched.current = true;
                        field.onChange(v as EmailProvider);
                      }}
                    >
                      <SelectTrigger id="ca-provider">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONNECTABLE_PROVIDERS.map((p) => (
                          <SelectItem key={p} value={p}>
                            <ProviderMark provider={p} className="size-4 text-[9px]" />
                            {p === 'IMAP' ? 'Other (IMAP)' : PROVIDER_META[p].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <SyncWindowField form={form} id="ca-window" />
            </div>

            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="rounded-md border">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center gap-1.5 rounded-md px-3 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-ring"
                >
                  <ChevronRight className={cn('size-3.5 transition-transform duration-150', advancedOpen && 'rotate-90')} />
                  Advanced IMAP settings
                  <span className="ml-auto font-normal text-subtle">
                    {meta.imapHost ? `Defaults: ${meta.imapHost}:993 · SSL` : 'Host required for custom IMAP'}
                  </span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t px-3 py-3">
                  <ImapFields form={form} idPrefix="ca" hostPlaceholder={meta.imapHost} usernamePlaceholder={email || 'Same as email address'} />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </DialogBody>
          <DialogFooter className="sm:items-center sm:justify-between">
            <p className={cn('flex items-center gap-1.5 text-2xs text-muted-foreground', !pending && 'invisible max-sm:hidden')}>
              <Info className="size-3 shrink-0" />
              We test the IMAP connection before saving.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={pending}>
                {pending ? 'Testing connection…' : 'Connect account'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
