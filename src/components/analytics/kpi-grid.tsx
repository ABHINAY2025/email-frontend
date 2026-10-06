import { StatTile } from '@/components/common/stat-tile';
import { ErrorState } from '@/components/common/states';
import { Card } from '@/components/ui/card';
import { days, number, percent } from '@/lib/format';
import type { AnalyticsOverview } from '@/types/api';

const KPI_COUNT = 10;

export function KpiGrid({
  data,
  loading,
  error,
  onRetry,
}: {
  data: AnalyticsOverview | undefined;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  if (error && !data) {
    return (
      <Card>
        <ErrorState compact error={error} onRetry={onRetry} title="Could not load key metrics" />
      </Card>
    );
  }

  const o = data;
  const f = o?.funnel;
  const tiles: { label: string; value: string; sub?: string }[] = o
    ? [
        { label: 'Total applications', value: number(o.totalApplications), sub: 'All time' },
        { label: 'This week', value: number(o.applicationsThisWeek), sub: 'Applied this week' },
        { label: 'This month', value: number(o.applicationsThisMonth), sub: 'Applied this month' },
        { label: 'Response rate', value: percent(o.responseRate), sub: f ? `${number(f.responses)} of ${number(f.applied)} responded` : undefined },
        { label: 'Interview rate', value: percent(o.interviewRate), sub: f ? `${number(f.interviews)} reached interview` : undefined },
        { label: 'Offer rate', value: percent(o.offerRate), sub: f ? `${number(f.offers)} ${f.offers === 1 ? 'offer' : 'offers'}` : undefined },
        { label: 'Rejection rate', value: percent(o.rejectionRate), sub: 'Of all applications' },
        { label: 'Avg response time', value: days(o.avgResponseDays), sub: 'Applied → first response' },
        { label: 'Avg time to interview', value: days(o.avgDaysToInterview), sub: 'Applied → interview' },
        { label: 'Avg time to rejection', value: days(o.avgDaysToRejection), sub: 'Applied → rejection' },
      ]
    : [];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {loading || !o
        ? Array.from({ length: KPI_COUNT }).map((_, i) => <StatTile key={i} label="" value="" sub="" loading />)
        : tiles.map((tile) => <StatTile key={tile.label} label={tile.label} value={tile.value} sub={tile.sub} />)}
    </div>
  );
}
