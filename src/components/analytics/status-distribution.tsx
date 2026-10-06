import { Tooltip } from '@/components/ui/tooltip';
import { chartTheme } from '@/lib/chart-colors';
import { percent } from '@/lib/format';
import { ALL_STATUSES, STATUS_META } from '@/lib/status';
import { useTheme } from '@/lib/theme';
import type { StatusAnalytics } from '@/types/api';
import { ChartCard, RowsSkeleton } from './chart-card';

/**
 * Horizontal bars, one row per status in pipeline order. Status hues sit close to each
 * other, so the row label + count + share carry identity; color is the secondary channel.
 */
export function StatusDistributionCard({
  data,
  loading,
  error,
  onRetry,
  className,
}: {
  data: StatusAnalytics | undefined;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  className?: string;
}) {
  const t = chartTheme(useTheme().resolved);
  const counts = new Map((data?.distribution ?? []).map((d) => [d.status, d.count]));
  const rows = ALL_STATUSES.map((s) => ({ status: s, count: counts.get(s) ?? 0 })).filter((r) => r.count > 0);
  const total = rows.reduce((s, r) => s + r.count, 0);
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <ChartCard
      title="Status distribution"
      description={data ? `Current status of ${total.toLocaleString()} applications` : undefined}
      loading={loading}
      error={error}
      onRetry={onRetry}
      skeleton={<RowsSkeleton rows={7} />}
      className={className}
    >
      {rows.length === 0 ? (
        <p className="py-10 text-center text-xs text-muted-foreground">No applications yet.</p>
      ) : (
        <ul className="space-y-1">
          {rows.map((r) => {
            const m = STATUS_META[r.status];
            const share = total ? r.count / total : 0;
            return (
              <Tooltip
                key={r.status}
                side="top"
                content={`${m.label}: ${r.count.toLocaleString()} (${percent(share, 1)})`}
              >
                <li
                  tabIndex={0}
                  className="focus-ring grid grid-cols-[96px_1fr_auto] items-center gap-3 rounded-md px-1 py-1 transition-colors duration-150 hover:bg-accent/40"
                >
                  <span className="truncate text-xs text-foreground/90">{m.label}</span>
                  <span className="relative h-2.5 min-w-0">
                    <span
                      className="absolute inset-y-0 left-0 rounded-r-[4px]"
                      style={{ width: `${Math.max(2, (r.count / max) * 100)}%`, backgroundColor: t.status[r.status] }}
                    />
                  </span>
                  <span className="tabular flex w-[72px] items-baseline justify-end gap-1.5 text-xs">
                    <span className="font-medium">{r.count.toLocaleString()}</span>
                    <span className="w-9 text-right text-2xs text-muted-foreground">{percent(share)}</span>
                  </span>
                </li>
              </Tooltip>
            );
          })}
        </ul>
      )}
    </ChartCard>
  );
}
