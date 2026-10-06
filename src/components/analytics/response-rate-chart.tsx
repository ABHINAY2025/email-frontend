import { format } from 'date-fns';
import { CartesianGrid, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { chartTheme } from '@/lib/chart-colors';
import { percent, toDate } from '@/lib/format';
import { useTheme } from '@/lib/theme';
import type { ResponseRateAnalytics } from '@/types/api';
import { ChartCard, ChartTooltipPanel } from './chart-card';

interface Point {
  label: string;
  periodStart: string;
  pct: number;
  rate: number;
  total: number;
}

export function ResponseRateCard({
  data,
  loading,
  error,
  onRetry,
  className,
}: {
  data: ResponseRateAnalytics | undefined;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  className?: string;
}) {
  const t = chartTheme(useTheme().resolved);
  const points: Point[] = (data?.weekly ?? []).map((w) => ({ ...w, pct: Math.round(w.rate * 1000) / 10 }));
  const last = points[points.length - 1];

  return (
    <ChartCard
      title="Response rate over time"
      description={data ? `Overall ${percent(data.overall)} · weekly cohorts by application date` : undefined}
      loading={loading}
      error={error}
      onRetry={onRetry}
      className={className}
    >
      <div className="h-[232px] w-full" role="img" aria-label="Weekly response rate">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
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
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickLine={false}
              axisLine={false}
              tick={{ fill: t.textMuted, fontSize: 11 }}
              tickFormatter={(v: number) => `${v}%`}
              width={44}
            />
            <Tooltip
              cursor={{ stroke: t.axis, strokeWidth: 1 }}
              isAnimationActive={false}
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as Point | undefined;
                if (!active || !p) return null;
                const d = toDate(p.periodStart);
                return (
                  <ChartTooltipPanel
                    title={d ? `Week of ${format(d, 'MMM d, yyyy')}` : p.label}
                    rows={[
                      { color: t.accent, value: percent(p.rate, 1), label: 'response rate' },
                      { value: p.total.toLocaleString(), label: p.total === 1 ? 'application' : 'applications' },
                    ]}
                  />
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="pct"
              stroke={t.accent}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={false}
              activeDot={{ r: 4, fill: t.accent, stroke: t.surface, strokeWidth: 2 }}
              isAnimationActive={false}
            />
            {last && (
              <ReferenceDot
                x={last.label}
                y={last.pct}
                r={4}
                fill={t.accent}
                stroke={t.surface}
                strokeWidth={2}
                label={{ value: `${Math.round(last.pct)}%`, position: 'top', fill: t.text, fontSize: 11, offset: 8 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
