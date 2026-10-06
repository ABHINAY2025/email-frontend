import { useState, type ReactNode } from 'react';
import { Eraser, MoreHorizontal, PlugZap, RefreshCw, Settings2, Unplug } from 'lucide-react';
import { ProviderMark, SyncStatusBadge } from '@/components/common/badges';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { RelativeTime } from '@/components/common/data-display';
import { ErrorNote } from '@/components/common/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useClearEmailAccount,
  useDeleteEmailAccount,
  useSyncEmailAccount,
  useTestEmailAccount,
} from '@/hooks/use-queries';
import { PROVIDER_META, syncWindowLabel } from '@/lib/classification';
import { cn } from '@/lib/utils';
import type { EmailAccount } from '@/types/api';
import { EditAccountDialog } from './edit-account-dialog';

type DialogKind = 'edit' | 'clear' | 'disconnect' | null;

export function AccountRow({ account }: { account: EmailAccount }) {
  const sync = useSyncEmailAccount();
  const test = useTestEmailAccount();
  const clear = useClearEmailAccount();
  const remove = useDeleteEmailAccount();
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [purge, setPurge] = useState(false);

  const isDemo = account.provider === 'DEMO';
  const syncing = account.syncStatus === 'SYNCING';
  const provider = PROVIDER_META[account.provider];

  return (
    <div className={cn('px-4 py-3.5', !account.enabled && 'bg-muted/20')}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        {/* identity */}
        <div className="flex min-w-0 items-start gap-2.5">
          <ProviderMark provider={account.provider} className="mt-0.5 size-6 text-[11px]" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="truncate text-[13px] font-medium">{account.email}</span>
              <SyncStatusBadge value={account.syncStatus} />
              {!account.enabled && (
                <Badge variant="outline" className="text-subtle">
                  Disabled
                </Badge>
              )}
              {isDemo && <Badge variant="default">Demo</Badge>}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {isDemo ? 'Sample data account — no real mailbox' : provider.label}
              {!isDemo && (
                <span className="font-mono text-2xs text-subtle">
                  {' · '}
                  {account.host}:{account.port}
                  {account.ssl ? ' · SSL' : ''} · {account.folder}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* actions */}
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 pl-[34px] md:pl-0">
          <Button
            variant="outline"
            size="sm"
            loading={sync.isPending}
            disabled={syncing || !account.enabled}
            title={!account.enabled ? 'Enable the account to sync' : undefined}
            onClick={() => sync.mutate(account.id)}
          >
            {!sync.isPending && <RefreshCw className={cn(syncing && 'animate-spin')} />}
            {syncing ? 'Syncing…' : 'Sync now'}
          </Button>
          {!isDemo && (
            <Button variant="outline" size="sm" loading={test.isPending} onClick={() => test.mutate(account.id)}>
              {!test.isPending && <PlugZap />}
              {test.isPending ? 'Testing…' : 'Test connection'}
            </Button>
          )}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${account.email}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={() => setDialog('edit')}>
                <Settings2 /> Edit settings…
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialog('clear')}>
                <Eraser /> Clear imported mail…
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                destructive
                onSelect={() => {
                  setPurge(false);
                  setDialog('disconnect');
                }}
              >
                <Unplug /> Disconnect…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* meta */}
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5 pl-[34px] sm:grid-cols-4">
        <Meta label="Last sync">
          <RelativeTime value={account.lastSyncAt} />
        </Meta>
        <Meta label="Emails processed">
          <span className="tabular">{account.emailsProcessed.toLocaleString()}</span>
        </Meta>
        <Meta label="Job emails">
          <span className="tabular">{account.jobEmails.toLocaleString()}</span>
        </Meta>
        <Meta label="Initial window">{syncWindowLabel(account.initialSyncDays)}</Meta>
      </dl>

      {account.syncStatus === 'ERROR' && account.lastError && <ErrorNote className="ml-[34px] mt-3">{account.lastError}</ErrorNote>}

      <EditAccountDialog account={account} open={dialog === 'edit'} onOpenChange={(o) => setDialog(o ? 'edit' : null)} />

      <ConfirmDialog
        open={dialog === 'clear'}
        onOpenChange={(o) => !clear.isPending && setDialog(o ? 'clear' : null)}
        title="Clear imported mail?"
        description={
          <>
            All emails imported from <span className="font-medium text-foreground">{account.email}</span> will be deleted and the
            sync cursor reset. Applications are kept. The next sync re-imports mail within the initial window.
          </>
        }
        confirmLabel="Clear mail"
        destructive
        loading={clear.isPending}
        onConfirm={async () => {
          try {
            await clear.mutateAsync(account.id);
            setDialog(null);
          } catch {
            /* toast handled by hook */
          }
        }}
      />

      <ConfirmDialog
        open={dialog === 'disconnect'}
        onOpenChange={(o) => !remove.isPending && setDialog(o ? 'disconnect' : null)}
        title="Disconnect account?"
        description={
          <>
            ApplyFlow will stop syncing <span className="font-medium text-foreground">{account.email}</span> and delete its stored
            credentials. Applications are kept.
          </>
        }
        confirmLabel="Disconnect"
        destructive
        loading={remove.isPending}
        onConfirm={async () => {
          try {
            await remove.mutateAsync({ id: account.id, purge });
            setDialog(null);
          } catch {
            /* toast handled by hook */
          }
        }}
      >
        <label htmlFor={`purge-${account.id}`} className="flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2.5">
          <Checkbox id={`purge-${account.id}`} checked={purge} onCheckedChange={(c) => setPurge(c === true)} className="mt-px" />
          <span>
            <span className="block text-[13px] font-medium">Also delete emails imported from this account</span>
            <span className="block text-xs text-muted-foreground">
              {account.emailsProcessed > 0
                ? `Removes ${account.jobEmails.toLocaleString()} job email${account.jobEmails === 1 ? '' : 's'} and their events.`
                : 'Removes imported emails and their events.'}
            </span>
          </span>
        </label>
      </ConfirmDialog>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="label-caps">{label}</dt>
      <dd className="mt-0.5 truncate text-[13px]">{children}</dd>
    </div>
  );
}

export function AccountRowSkeleton() {
  return (
    <div className="px-4 py-3.5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <Skeleton className="size-6 rounded-[5px]" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <Skeleton className="hidden h-7 w-56 md:block" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5 pl-[34px] sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
