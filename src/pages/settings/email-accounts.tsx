import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { History, Inbox, Lock, Plus } from 'lucide-react';
import { RelativeTime } from '@/components/common/data-display';
import { EmptyState, ErrorState } from '@/components/common/states';
import { SyncJobsTable } from '@/components/layout/sync-status';
import { AccountRow, AccountRowSkeleton } from '@/components/settings/account-row';
import { ConnectAccountDialog } from '@/components/settings/connect-account-dialog';
import { SettingsPanel } from '@/components/settings/settings-section';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmailAccounts, useSyncStatus } from '@/hooks/use-queries';

export default function EmailAccountsPage() {
  const [params, setParams] = useSearchParams();
  const [connectOpen, setConnectOpen] = useState(false);
  const accounts = useEmailAccounts();

  // Deep link: /settings/email-accounts?connect=1 opens the connect dialog once.
  useEffect(() => {
    if (params.get('connect') === '1') {
      setConnectOpen(true);
      const next = new URLSearchParams(params);
      next.delete('connect');
      setParams(next, { replace: true });
    }
  }, [params, setParams]);

  const connectButton = (
    <Button onClick={() => setConnectOpen(true)}>
      <Plus /> Connect account
    </Button>
  );

  return (
    <div className="space-y-8 pb-6">
      <section className="space-y-2.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold">Email accounts</h2>
            <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              ApplyFlow reads your mailboxes over IMAP to detect job-application emails. Passwords are encrypted and never shown
              again.
            </p>
          </div>
          <div className="shrink-0">{connectButton}</div>
        </div>

        {accounts.isPending ? (
          <SettingsPanel>
            <AccountRowSkeleton />
            <AccountRowSkeleton />
          </SettingsPanel>
        ) : accounts.isError ? (
          <SettingsPanel>
            <ErrorState error={accounts.error} title="Could not load email accounts" onRetry={() => void accounts.refetch()} />
          </SettingsPanel>
        ) : accounts.data.length === 0 ? (
          <SettingsPanel>
            <EmptyState
              icon={Inbox}
              title="No email accounts connected"
              description="Connect a mailbox with an app password. ApplyFlow imports only job-related emails and turns them into a tracked pipeline."
              actions={connectButton}
            />
          </SettingsPanel>
        ) : (
          <SettingsPanel>
            {accounts.data.map((a) => (
              <AccountRow key={a.id} account={a} />
            ))}
          </SettingsPanel>
        )}

        <p className="flex items-center gap-1.5 text-2xs text-subtle">
          <Lock className="size-3" />
          Read-only IMAP access. ApplyFlow never sends, moves or deletes mail in your mailbox.
        </p>
      </section>

      <RecentSyncJobs />

      <ConnectAccountDialog open={connectOpen} onOpenChange={setConnectOpen} />
    </div>
  );
}

function RecentSyncJobs() {
  const sync = useSyncStatus();
  const data = sync.data;

  const description = data ? (
    <>
      Automatic sync every {data.intervalMinutes} minute{data.intervalMinutes === 1 ? '' : 's'} · last sync{' '}
      {data.lastSyncAt ? <RelativeTime value={data.lastSyncAt} /> : 'never'}
    </>
  ) : sync.isPending ? (
    <span className="inline-block h-3 w-56 animate-pulse rounded bg-muted align-middle" />
  ) : undefined;

  return (
    <Card className="overflow-hidden rounded-[10px]">
      <CardHeader icon={History} title="Recent sync jobs" description={description} />
      {sync.isPending ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      ) : sync.isError ? (
        <ErrorState compact error={sync.error} title="Could not load sync status" onRetry={() => void sync.refetch()} />
      ) : sync.data.recentJobs.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-muted-foreground">No sync jobs yet. Jobs appear here after the first sync.</p>
      ) : (
        <SyncJobsTable jobs={sync.data.recentJobs} className="rounded-none border-0" />
      )}
    </Card>
  );
}
