import { useState } from 'react';
import { format } from 'date-fns';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Segmented } from '@/components/ui/tabs';
import { chartTheme } from '@/lib/chart-colors';
import { toDate } from '@/lib/format';
import { useTheme } from '@/lib/theme';
import { pluralize } from '@/lib/utils';
import type { ApplicationsAnalytics, TimeSeriesPoint } from '@/types/api';
import { ChartCard, ChartTooltipPanel } from './chart-card';

type Granularity = 'weekly' | 'monthly';

function periodTitle(p: TimeSeriesPoint, g: Granularity) {
  const d = toDate(p.periodStart);
  if (!d) return p.label;
  return g === 'weekly' ? `Week of ${format(d, 'MMM d, yyyy')}` : format(d, 'MMMM yyyy');
}

export function ApplicationsOverTimeCard({
  data,
  loading,
  error,
  onRetry,
  className,
}: {
  data: ApplicationsAnalytics | undefined;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  className?: string;
}) {
  const [granularity, setGranularity] = useState<Granularity>('weekly');
  const t = chartTheme(useTheme().resolved);
  const points = data ? data[granularity] : [];
  const total = points.reduce((s, p) => s + p.count, 0);

  return (
    <ChartCard
      title="Applications over time"
      description={data ? `${pluralize(total, 'application')} in the last 12 ${granularity === 'weekly' ? 'weeks' : 'months'}` : undefined}
      actions={
        <Segmented<Granularity>
          size="sm"
          value={granularity}
          onValueChange={setGranularity}
          options={[
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
          ]}
        />
      }
      loading={loading}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      <div className="h-[232px] w-full" role="img" aria-label={`Applications per ${granularity === 'weekly' ? 'week' : 'month'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: -12 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke={t.grid} strokeWidth={1} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: t.axis }}
              tick={{ fill: t.textMuted, fontSize: 11 }}
              interval="preserveStartEnd"
              minTickGap={8}
              tickMargin={6}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: t.textMuted, fontSize: 11 }}
              tickFormatter={(v: number) => v.toLocaleString()}
              width={40}
            />
            <Tooltip
              cursor={{ fill: t.accentSoft }}
              isAnimationActive={false}
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as TimeSeriesPoint | undefined;
                if (!active || !p) return null;
                return (
                  <ChartTooltipPanel
                    title={periodTitle(p, granularity)}
                    rows={[{ color: t.accent, value: p.count.toLocaleString(), label: p.count === 1 ? 'application' : 'applications' }]}
                  />
                );
              }}
            />
            <Bar dataKey="count" fill={t.accent} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
