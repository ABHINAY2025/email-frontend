import { Tooltip } from '@/components/ui/tooltip';
import { chartTheme } from '@/lib/chart-colors';
import { percent } from '@/lib/format';
import { ALL_STATUSES, STATUS_META } from '@/lib/status';
import { useTheme } from '@/lib/theme';
import type { ApplicationStatus } from '@/types/api';

/**
 * Thin stacked bar (2px surface gaps between segments) + mandatory legend list.
 * Status hues are close, so the legend (label + count + share) carries identity.
 */
export function StatusStack({ distribution }: { distribution: { status: ApplicationStatus; count: number }[] }) {
  const t = chartTheme(useTheme().resolved);
  const counts = new Map(distribution.map((d) => [d.status, d.count]));
  const rows = ALL_STATUSES.map((s) => ({ status: s, count: counts.get(s) ?? 0 })).filter((r) => r.count > 0);
  const total = rows.reduce((s, r) => s + r.count, 0);

  if (total === 0) return <p className="py-4 text-center text-xs text-muted-foreground">No applications yet.</p>;

  return (
    <div>
      <div className="flex h-2 w-full gap-[2px] overflow-hidden rounded-full" role="img" aria-label="Status distribution">
        {rows.map((r) => (
          <Tooltip key={r.status} content={`${STATUS_META[r.status].label}: ${r.count} (${percent(r.count / total)})`}>
            <span
              className="h-full min-w-[3px] transition-opacity duration-150 hover:opacity-80"
              style={{ flexGrow: r.count, flexBasis: 0, backgroundColor: t.status[r.status] }}
            />
          </Tooltip>
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
        {rows.map((r) => (
          <li key={r.status} className="flex items-center gap-2 text-xs">
            <span className="size-2 shrink-0 rounded-[2px]" style={{ backgroundColor: t.status[r.status] }} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-foreground/90">{STATUS_META[r.status].label}</span>
            <span className="tabular font-medium">{r.count}</span>
            <span className="tabular w-8 text-right text-2xs text-muted-foreground">{percent(r.count / total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
