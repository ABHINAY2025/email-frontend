import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { FormField } from '@/components/common/form-field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { SYNC_WINDOW_OPTIONS } from '@/lib/classification';
import { cn } from '@/lib/utils';
import type { EmailProvider } from '@/types/api';

const port = z
  .string()
  .trim()
  .refine((v) => !v || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 65535), 'Port must be a number between 1 and 65535');

const base = {
  email: z.string().trim(),
  appPassword: z.string().max(512, 'Password is too long'),
  provider: z.custom<EmailProvider>(),
  initialSyncDays: z.number(),
  host: z.string().trim().max(255, 'Host is too long'),
  port,
  ssl: z.boolean(),
  username: z.string().trim().max(320, 'Username is too long'),
  folder: z.string().trim().max(255, 'Folder is too long'),
  enabled: z.boolean(),
};

export const editAccountSchema = z.object(base);

export const connectAccountSchema = z.object({
  ...base,
  email: z.string().trim().min(1, 'Email address is required').max(320).email('Enter a valid email address'),
  appPassword: z.string().min(1, 'App password is required').max(512, 'Password is too long'),
});

/** Shared shape for the connect and edit forms (different schemas, same fields). */
export type AccountFormValues = z.infer<typeof editAccountSchema>;
export const ACCOUNT_FORM_FIELDS = Object.keys(base);

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <Input ref={ref} type={visible ? 'text' : 'password'} spellCheck={false} className={cn('pr-9 font-mono', className)} {...props} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-8 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-ring"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';

export function SyncWindowField({ form, id }: { form: UseFormReturn<AccountFormValues>; id: string }) {
  return (
    <FormField label="Initial sync window" htmlFor={id} hint="How far back to import mail on the first sync.">
      <Controller
        control={form.control}
        name="initialSyncDays"
        render={({ field }) => (
          <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
            <SelectTrigger id={id}>
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
    </FormField>
  );
}

/** IMAP host / port / SSL / username / folder. */
export function ImapFields({
  form,
  idPrefix,
  hostPlaceholder,
  usernamePlaceholder,
}: {
  form: UseFormReturn<AccountFormValues>;
  idPrefix: string;
  hostPlaceholder?: string;
  usernamePlaceholder?: string;
}) {
  const { register, control, formState } = form;
  const err = formState.errors;
  return (
    <div className="grid grid-cols-1 gap-x-3 gap-y-3.5 sm:grid-cols-[1fr_96px]">
      <FormField label="IMAP host" htmlFor={`${idPrefix}-host`} error={err.host?.message}>
        <Input
          id={`${idPrefix}-host`}
          placeholder={hostPlaceholder || 'imap.example.com'}
          autoComplete="off"
          spellCheck={false}
          className="font-mono text-xs"
          aria-invalid={!!err.host}
          {...register('host')}
        />
      </FormField>
      <FormField label="Port" htmlFor={`${idPrefix}-port`} error={err.port?.message}>
        <Input
          id={`${idPrefix}-port`}
          inputMode="numeric"
          placeholder="993"
          autoComplete="off"
          className="tabular font-mono text-xs"
          aria-invalid={!!err.port}
          {...register('port')}
        />
      </FormField>
      <FormField label="Username" htmlFor={`${idPrefix}-username`} error={err.username?.message}>
        <Input
          id={`${idPrefix}-username`}
          placeholder={usernamePlaceholder || 'Same as email address'}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={!!err.username}
          {...register('username')}
        />
      </FormField>
      <FormField label="Folder" htmlFor={`${idPrefix}-folder`} error={err.folder?.message}>
        <Input
          id={`${idPrefix}-folder`}
          placeholder="INBOX"
          autoComplete="off"
          spellCheck={false}
          className="font-mono text-xs"
          aria-invalid={!!err.folder}
          {...register('folder')}
        />
      </FormField>
      <div className="flex items-center justify-between gap-4 rounded-md border bg-elevated/50 px-3 py-2 sm:col-span-2">
        <div>
          <label htmlFor={`${idPrefix}-ssl`} className="text-xs font-medium">
            Use SSL/TLS
          </label>
          <p className="text-2xs text-muted-foreground">Recommended. Port 993 expects SSL.</p>
        </div>
        <Controller
          control={control}
          name="ssl"
          render={({ field }) => <Switch id={`${idPrefix}-ssl`} checked={field.value} onCheckedChange={field.onChange} />}
        />
      </div>
    </div>
  );
}
