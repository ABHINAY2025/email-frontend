import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProviderMark } from '@/components/common/badges';
import { FormField } from '@/components/common/form-field';
import { ErrorNote } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useUpdateEmailAccount } from '@/hooks/use-queries';
import { PROVIDER_META } from '@/lib/classification';
import type { EmailAccount, UpdateEmailAccountRequest } from '@/types/api';
import {
  ACCOUNT_FORM_FIELDS,
  type AccountFormValues,
  ImapFields,
  PasswordInput,
  SyncWindowField,
  editAccountSchema,
} from './account-form';
import { applyFieldErrors, imapErrorMessage, type FriendlyError } from './form-errors';

const fromAccount = (a: EmailAccount): AccountFormValues => ({
  email: a.email,
  appPassword: '',
  provider: a.provider,
  initialSyncDays: a.initialSyncDays,
  host: a.host ?? '',
  port: a.port ? String(a.port) : '',
  ssl: a.ssl,
  username: a.username ?? '',
  folder: a.folder ?? 'INBOX',
  enabled: a.enabled,
});

export function EditAccountDialog({
  account,
  open,
  onOpenChange,
}: {
  account: EmailAccount;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateEmailAccount();
  const form = useForm<AccountFormValues>({ resolver: zodResolver(editAccountSchema), defaultValues: fromAccount(account) });
  const { register, control, handleSubmit, reset, setValue, setError, formState } = form;
  const err = formState.errors;
  const [submitError, setSubmitError] = useState<FriendlyError | null>(null);
  const isDemo = account.provider === 'DEMO';

  useEffect(() => {
    if (open) {
      reset(fromAccount(account));
      setSubmitError(null);
      update.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = handleSubmit(async (v) => {
    setSubmitError(null);
    const d = formState.dirtyFields;
    const body: UpdateEmailAccountRequest = {};
    if (v.appPassword) body.appPassword = v.appPassword;
    if (d.host && v.host) body.host = v.host;
    if (d.port && v.port) body.port = Number(v.port);
    if (d.ssl) body.ssl = v.ssl;
    if (d.username && v.username) body.username = v.username;
    if (d.folder && v.folder) body.folder = v.folder;
    if (d.initialSyncDays) body.initialSyncDays = v.initialSyncDays;
    if (d.enabled) body.enabled = v.enabled;

    if (Object.keys(body).length === 0) {
      onOpenChange(false);
      return;
    }
    try {
      await update.mutateAsync({ id: account.id, body });
      onOpenChange(false);
    } catch (e) {
      applyFieldErrors(e, ACCOUNT_FORM_FIELDS, setError);
      setSubmitError(imapErrorMessage(e));
    } finally {
      setValue('appPassword', '', { shouldDirty: false, shouldValidate: false });
    }
  });

  const pending = update.isPending;
  const meta = PROVIDER_META[account.provider];

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit account</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <ProviderMark provider={account.provider} className="size-4 text-[9px]" />
            <span className="truncate">{account.email}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="space-y-4">
            {submitError && (
              <ErrorNote>
                <p className="font-medium text-foreground">{submitError.title}</p>
                {submitError.detail && <p className="mt-0.5 text-muted-foreground">{submitError.detail}</p>}
              </ErrorNote>
            )}

            <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2.5">
              <div>
                <label htmlFor="ea-enabled" className="text-[13px] font-medium">
                  Sync enabled
                </label>
                <p className="text-xs text-muted-foreground">When off, this account is skipped by automatic and manual syncs.</p>
              </div>
              <Controller
                control={control}
                name="enabled"
                render={({ field }) => <Switch id="ea-enabled" checked={field.value} onCheckedChange={field.onChange} />}
              />
            </div>

            {!isDemo && (
              <FormField
                label="App password"
                htmlFor="ea-password"
                error={err.appPassword?.message}
                hint={account.hasPassword ? 'Leave blank to keep the current password.' : 'No password stored — enter an app password.'}
              >
                <PasswordInput
                  id="ea-password"
                  autoComplete="new-password"
                  placeholder={account.hasPassword ? '••••••••••••' : 'xxxx xxxx xxxx xxxx'}
                  aria-invalid={!!err.appPassword}
                  {...register('appPassword')}
                />
              </FormField>
            )}

            <SyncWindowField form={form} id="ea-window" />

            {!isDemo && (
              <div className="space-y-2.5 border-t pt-4">
                <p className="label-caps">IMAP connection</p>
                <ImapFields form={form} idPrefix="ea" hostPlaceholder={meta.imapHost} usernamePlaceholder={account.email} />
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending} disabled={!formState.isDirty}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
