import { Link } from 'react-router-dom';
import {
  Briefcase,
  CircleDot,
  Hourglass,
  Mail,
  MessagesSquare,
  Plus,
  RefreshCw,
  Trophy,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { ApplicationsTable } from '@/components/applications/applications-table';
import { StatTile } from '@/components/common/stat-tile';
import { EmptyState, ErrorState } from '@/components/common/states';
import { ActivityStream } from '@/components/dashboard/activity-stream';
import { AttentionList } from '@/components/dashboard/attention-list';
import { PipelineBar } from '@/components/dashboard/pipeline';
import { Page } from '@/components/layout/page';
import { useAppUI } from '@/hooks/use-app-ui';
import { useApplications } from '@/hooks/use-applications';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardSummary, useSettings, useStartSync, useSyncStatus } from '@/hooks/use-queries';
import { firstName, greeting, percent, relativeLong } from '@/lib/format';

export default function DashboardPage() {
  const { user } = useAuth();
  const settings = useSettings();
  const summary = useDashboardSummary();
  const recent = useApplications({ sort: 'lastActivityAt', dir: 'desc', size: 10, page: 0 });
  const sync = useSyncStatus();
  const startSync = useStartSync();
  const { openAddApplication } = useAppUI();

  const name = firstName(settings.data?.displayName || user?.displayName || user?.username);
  const s = summary.data;
  const syncing = startSync.isPending || sync.data?.state === 'SYNCING';
  const isEmpty = s && s.total === 0;

  return (
    <Page>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            {greeting()}
            {name ? `, ${name}` : ''}
          </h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Here's what's happening with your job applications.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-subtle md:inline">
            {sync.data?.lastSyncAt ? `Last synced ${relativeLong(sync.data.lastSyncAt)}` : ''}
          </span>
          <Button variant="outline" onClick={() => openAddApplication()}>
            <Plus /> Add
          </Button>
          <Button onClick={() => startSync.mutate()} loading={syncing}>
            {!syncing && <RefreshCw />}
            {syncing ? 'Syncing…' : 'Sync Now'}
          </Button>
        </div>
      </div>

      {summary.isError ? (
        <Card className="mb-4">
          <ErrorState compact error={summary.error} onRetry={() => summary.refetch()} title="Could not load your summary" />
        </Card>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <StatTile label="Total" icon={Briefcase} value={s?.total ?? 0} loading={summary.isLoading} to="/applications" sub={s ? `${s.appliedThisWeek} this week` : undefined} />
            <StatTile label="Active" icon={CircleDot} hue="blue" value={s?.active ?? 0} loading={summary.isLoading} to="/applications?bucket=active" sub={s ? `${percent(s.responseRate)} response rate` : undefined} />
            <StatTile label="Interviews" icon={MessagesSquare} hue="amber" value={s?.interviews ?? 0} loading={summary.isLoading} to="/applications?bucket=interviews" />
            <StatTile label="Offers" icon={Trophy} hue="green" value={s?.offers ?? 0} loading={summary.isLoading} to="/applications?bucket=offers" />
            <StatTile label="Rejected" icon={XCircle} hue="red" value={s?.rejected ?? 0} loading={summary.isLoading} to="/applications?bucket=rejected" />
            <StatTile label="Waiting for response" icon={Hourglass} hue="slate" value={s?.waiting ?? 0} loading={summary.isLoading} to="/applications?bucket=waiting" />
          </div>
          <div className="mb-4">
            <PipelineBar summary={s} loading={summary.isLoading} />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="min-w-0 self-start overflow-hidden">
          <CardHeader
            title="Recent applications"
            icon={Briefcase}
            actions={
              <Button variant="ghost" size="xs" asChild>
                <Link to="/applications">View all</Link>
              </Button>
            }
          />
          {recent.isError ? (
            <ErrorState compact error={recent.error} onRetry={() => recent.refetch()} />
          ) : isEmpty || (recent.data && recent.data.content.length === 0) ? (
            <EmptyState
              icon={Mail}
              title="No applications yet."
              description="Connect an email account and we'll automatically detect your job applications."
              actions={
                <>
                  <Button size="sm" asChild>
                    <Link to="/settings/email-accounts">Connect Email</Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openAddApplication()}>
                    Add manually
                  </Button>
                </>
              }
            />
          ) : (
            <ApplicationsTable apps={recent.data?.content} loading={recent.isLoading} skeletonRows={10} />
          )}
        </Card>
        <div className="flex min-w-0 flex-col gap-4">
          <AttentionList />
          <ActivityStream />
        </div>
      </div>
    </Page>
  );
}
