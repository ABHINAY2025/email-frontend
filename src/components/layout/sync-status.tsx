import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/kbd';
import { Skeleton } from '@/components/ui/skeleton';
import { SyncStatusBadge } from '@/components/common/badges';
import { RelativeTime } from '@/components/common/data-display';
import { ErrorNote, ErrorState } from '@/components/common/states';
import { useAppUI } from '@/hooks/use-app-ui';
import { useEmailAccounts, useHealth, useStartSync, useSyncStatus } from '@/hooks/use-queries';
import { SYNC_STATUS_META } from '@/lib/classification';
import { relativeLong } from '@/lib/format';
import { HUE_CLASSES } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { SyncJob } from '@/types/api';

/** Small status line used in the sidebar footer. */
export function SidebarStatus() {
  const sync = useSyncStatus();
  const accounts = useEmailAccounts();
  const health = useHealth();
  const { setSyncDetailsOpen } = useAppUI();

  const state = sync.data?.state;
  const connected = accounts.data?.filter((a) => a.enabled) ?? [];

  return (
    <div className="shrink-0 space-y-3 border-t border-sidebar-border px-3 py-3 text-xs">
      {/* Sync status */}
      <button
        type="button"
        onClick={() => setSyncDetailsOpen(true)}
        className="group flex w-full items-center gap-2 rounded-md px-1 py-1 text-left transition-colors hover:bg-sidebar-accent/60 focus-ring"
        aria-label="Sync details"
      >
        {sync.isLoading ? (
          <Skeleton className="h-4 w-32" />
        ) : state === 'SYNCING' ? (
          <>
            <RefreshCw className="size-3.5 animate-spin text-hue-blue" />
            <span className="text-foreground/90">Syncing…</span>
          </>
        ) : state === 'ERROR' ? (
          <>
            <AlertTriangle className="size-3.5 text-hue-red" />
            <span className="text-hue-red">Sync failed</span>
          </>
        ) : sync.isError ? (
          <>
            <AlertTriangle className="size-3.5 text-muted-foreground" />
            <span>Sync status unavailable</span>
          </>
        ) : (
          <>
            <span className="relative flex size-3.5 items-center justify-center">
              <span className="size-1.5 rounded-full bg-hue-green" />
            </span>
            <span className="truncate">
              {sync.data?.lastSyncAt ? `Synced ${relativeLong(sync.data.lastSyncAt)}` : 'Not synced yet'}
            </span>
          </>
        )}
        <ChevronRight className="ml-auto size-3 text-subtle opacity-0 transition-opacity group-hover:opacity-100" />
      </button>

      {/* Connected accounts */}
      <div className="px-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="label-caps">Accounts</span>
          <Link to="/settings/email-accounts" className="tabular text-2xs text-muted-foreground hover:text-foreground">
            {accounts.isLoading ? '…' : `${connected.length} connected`}
          </Link>
        </div>
        <ul className="space-y-0.5">
          {accounts.data?.slice(0, 3).map((a) => (
            <li key={a.id} className="flex items-center gap-2 truncate text-[12px]">
              <span className={cn('size-1.5 shrink-0 rounded-full', HUE_CLASSES[SYNC_STATUS_META[a.syncStatus].hue].dot)} />
              <span className="truncate">{a.email}</span>
            </li>
          ))}
          {accounts.data && accounts.data.length === 0 && (
            <li>
              <Link to="/settings/email-accounts" className="text-[12px] text-primary hover:underline">
                Connect an account
              </Link>
            </li>
          )}
          {accounts.data && accounts.data.length > 3 && (
            <li className="text-2xs text-subtle">+{accounts.data.length - 3} more</li>
          )}
        </ul>
      </div>

      {/* System status */}
      <div className="flex items-center gap-3 px-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={cn(
              'size-1.5 rounded-full',
              health.isLoading ? 'bg-subtle' : health.data?.status === 'UP' ? 'bg-hue-green' : 'bg-hue-red',
            )}
          />
          API {health.isLoading ? '…' : health.data?.status === 'UP' ? 'Operational' : 'Down'}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className={cn(
              'size-1.5 rounded-full',
              health.isLoading ? 'bg-subtle' : health.data?.database === 'UP' ? 'bg-hue-green' : 'bg-hue-red',
            )}
          />
          DB
        </span>
        {health.data?.version && <span className="ml-auto font-mono text-[10px] text-subtle">v{health.data.version}</span>}
      </div>
    </div>
  );
}

export function SyncDetailsDialog() {
  const { syncDetailsOpen, setSyncDetailsOpen } = useAppUI();
  const sync = useSyncStatus();
  const start = useStartSync();
  const data = sync.data;

  return (
    <Dialog open={syncDetailsOpen} onOpenChange={setSyncDetailsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mail sync</DialogTitle>
          <DialogDescription>
            {data
              ? `Runs every ${data.intervalMinutes} min · Last sync ${relativeLong(data.lastSyncAt)}`
              : 'Status of your connected mailboxes'}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-5">
          {sync.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : sync.isError ? (
            <ErrorState compact error={sync.error} onRetry={() => sync.refetch()} />
          ) : data ? (
            <>
              {data.lastError && <ErrorNote>{data.lastError}</ErrorNote>}
              <section>
                <h4 className="label-caps mb-2">Accounts</h4>
                {data.accounts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No accounts connected.</p>
                ) : (
                  <ul className="divide-y rounded-lg border">
                    {data.accounts.map((a) => (
                      <li key={a.accountId} className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{a.email}</span>
                          <SyncStatusBadge value={a.syncStatus} />
                          <span className="w-20 text-right text-xs text-muted-foreground">
                            <RelativeTime value={a.lastSyncAt} />
                          </span>
                        </div>
                        {a.lastError && <ErrorNote className="mt-2">{a.lastError}</ErrorNote>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section>
                <h4 className="label-caps mb-2">Recent sync jobs</h4>
                <SyncJobsTable jobs={data.recentJobs} />
              </section>
            </>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" asChild>
            <Link to="/settings/email-accounts" onClick={() => setSyncDetailsOpen(false)}>
              Manage accounts
            </Link>
          </Button>
          <Button onClick={() => start.mutate()} loading={start.isPending || data?.state === 'SYNCING'}>
            {!start.isPending && data?.state !== 'SYNCING' && <RefreshCw />}
            {data?.state === 'SYNCING' ? 'Syncing…' : 'Sync now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SyncJobsTable({ jobs, className }: { jobs: SyncJob[]; className?: string }) {
  if (jobs.length === 0) return <p className="text-xs text-muted-foreground">No sync jobs yet.</p>;
  return (
    <div className={cn('overflow-x-auto rounded-lg border', className)}>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b text-left">
            <th className="label-caps px-3 py-2 font-medium">Account</th>
            <th className="label-caps px-3 py-2 font-medium">Status</th>
            <th className="label-caps px-3 py-2 font-medium">Started</th>
            <th className="label-caps px-3 py-2 text-right font-medium">Fetched</th>
            <th className="label-caps px-3 py-2 text-right font-medium">Job emails</th>
            <th className="label-caps px-3 py-2 text-right font-medium">Apps new / upd.</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id} className="border-b last:border-0 align-top">
              <td className="max-w-[200px] truncate px-3 py-2">{j.emailAccountEmail}</td>
              <td className="px-3 py-2">
                <span className="inline-flex items-center gap-1.5">
                  {j.status === 'RUNNING' ? (
                    <Spinner className="size-3 text-hue-blue" />
                  ) : j.status === 'COMPLETED' ? (
                    <CheckCircle2 className="size-3 text-hue-green" />
                  ) : (
                    <AlertTriangle className="size-3 text-hue-red" />
                  )}
                  {j.status === 'RUNNING' ? 'Running' : j.status === 'COMPLETED' ? 'Completed' : 'Failed'}
                </span>
                {j.error && <p className="mt-1 max-w-[220px] text-[11px] leading-snug text-hue-red">{j.error}</p>}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                <RelativeTime value={j.startedAt} />
              </td>
              <td className="tabular px-3 py-2 text-right">{j.messagesFetched.toLocaleString()}</td>
              <td className="tabular px-3 py-2 text-right">{j.jobEmailsFound.toLocaleString()}</td>
              <td className="tabular px-3 py-2 text-right">
                {j.applicationsCreated} / {j.applicationsUpdated}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
