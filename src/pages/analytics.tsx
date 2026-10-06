import { ChartColumn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApplicationsOverTimeCard } from '@/components/analytics/applications-over-time';
import { KpiGrid } from '@/components/analytics/kpi-grid';
import { RankedListCard, type RankedExtra } from '@/components/analytics/ranked-list';
import { ResponseFunnelCard } from '@/components/analytics/response-funnel';
import { ResponseRateCard } from '@/components/analytics/response-rate-chart';
import { StatusDistributionCard } from '@/components/analytics/status-distribution';
import { EmptyState } from '@/components/common/states';
import { Page, PageHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  useAnalyticsApplications,
  useAnalyticsOverview,
  useAnalyticsResponseRate,
  useAnalyticsStatus,
} from '@/hooks/use-queries';
import { percent } from '@/lib/format';

export default function AnalyticsPage() {
  const overview = useAnalyticsOverview();
  const apps = useAnalyticsApplications();
  const status = useAnalyticsStatus();
  const rr = useAnalyticsResponseRate();

  const isEmpty = overview.data?.totalApplications === 0;

  const bySource = new Map((rr.data?.bySource ?? []).map((s) => [s.key, s]));
  const sourceExtra: RankedExtra | undefined = rr.data
    ? {
        label: 'Resp.',
        get: (key) => {
          const s = bySource.get(key);
          return s ? { value: percent(s.rate), detail: `${s.responded} of ${s.total} responded` } : null;
        },
      }
    : undefined;

  const appsProps = { loading: apps.isPending, error: apps.error, onRetry: () => void apps.refetch() };

  return (
    <Page>
      <PageHeader title="Analytics" description="Application volume, outcomes and response trends across your job search." />

      <KpiGrid
        data={overview.data}
        loading={overview.isPending}
        error={overview.error}
        onRetry={() => void overview.refetch()}
      />

      {isEmpty ? (
        <Card className="mt-3">
          <EmptyState
            icon={ChartColumn}
            title="No analytics yet"
            description="Charts appear once applications exist. Connect a mailbox to detect applications automatically, or add one manually."
            actions={
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/settings/email-accounts">Connect mailbox</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/applications">Go to applications</Link>
                </Button>
              </>
            }
          />
        </Card>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
          <ApplicationsOverTimeCard data={apps.data} {...appsProps} className="lg:col-span-8" />
          <StatusDistributionCard
            data={status.data}
            loading={status.isPending}
            error={status.error}
            onRetry={() => void status.refetch()}
            className="lg:col-span-4"
          />
          <ResponseRateCard
            data={rr.data}
            loading={rr.isPending}
            error={rr.error}
            onRetry={() => void rr.refetch()}
            className="lg:col-span-8"
          />
          <ResponseFunnelCard
            data={overview.data}
            loading={overview.isPending}
            error={overview.error}
            onRetry={() => void overview.refetch()}
            className="lg:col-span-4"
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:col-span-12 xl:grid-cols-4">
            <RankedListCard
              title="By source"
              items={apps.data?.bySource}
              extra={sourceExtra}
              emptyLabel="No sources detected."
              {...appsProps}
            />
            <RankedListCard title="By company" items={apps.data?.byCompany} {...appsProps} />
            <RankedListCard title="By job title" items={apps.data?.byJobTitle} {...appsProps} />
            <RankedListCard
              title="By location"
              items={apps.data?.byLocation}
              emptyLabel="No locations detected."
              {...appsProps}
            />
          </div>
        </div>
      )}
    </Page>
  );
}
