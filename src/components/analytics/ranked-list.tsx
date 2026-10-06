import { Tooltip } from '@/components/ui/tooltip';
import { chartTheme } from '@/lib/chart-colors';
import { percent } from '@/lib/format';
import { useTheme } from '@/lib/theme';
import type { BreakdownItem } from '@/types/api';
import { ChartCard, RowsSkeleton } from './chart-card';

export interface RankedExtra {
  /** Column header for the extra value. */
  label: string;
  /** Lookup by item key → formatted value + tooltip detail. */
  get: (key: string) => { value: string; detail?: string } | null;
}

/** Top-N ranked bar list: key · thin proportional bar · count (single series, accent). */
export function RankedListCard({
  title,
  items,
  loading,
  error,
  onRetry,
  extra,
  emptyLabel = 'No data yet.',
  className,
}: {
  title: string;
  items: BreakdownItem[] | undefined;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  extra?: RankedExtra;
  emptyLabel?: string;
  className?: string;
}) {
  const t = chartTheme(useTheme().resolved);
  const top = (items ?? []).slice(0, 10);
  const max = Math.max(1, ...top.map((i) => i.count));
  const sum = top.reduce((s, i) => s + i.count, 0);

  return (
    <ChartCard
      title={title}
      actions={
        top.length > 0 ? (
          <span className="label-caps flex gap-3">
            {extra && <span className="w-11 text-right">{extra.label}</span>}
            <span className="w-8 text-right">Apps</span>
          </span>
        ) : undefined
      }
      loading={loading}
      error={error}
      onRetry={onRetry}
      skeleton={<RowsSkeleton rows={6} />}
      className={className}
      bodyClassName="px-3 py-2"
    >
      {top.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ol className="space-y-0.5">
          {top.map((item) => {
            const x = extra?.get(item.key) ?? null;
            return (
              <Tooltip
                key={item.key}
                side="top"
                content={`${item.key}: ${item.count.toLocaleString()} applications${sum ? ` (${percent(item.count / sum)} of top ${top.length})` : ''}${x?.detail ? ` · ${x.detail}` : ''}`}
              >
                <li
                  tabIndex={0}
                  className="focus-ring rounded-md px-1 py-1 transition-colors duration-150 hover:bg-accent/40"
                >
                  <div className="flex items-baseline gap-3 text-xs">
                    <span className="min-w-0 flex-1 truncate text-foreground/90">{item.key}</span>
                    {extra && (
                      <span className="tabular w-11 shrink-0 text-right text-muted-foreground">{x?.value ?? '—'}</span>
                    )}
                    <span className="tabular w-8 shrink-0 text-right font-medium">{item.count.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 h-1">
                    <div
                      className="h-full rounded-r-full"
                      style={{ width: `${Math.max(1.5, (item.count / max) * 100)}%`, backgroundColor: t.accent }}
                    />
                  </div>
                </li>
              </Tooltip>
            );
          })}
        </ol>
      )}
    </ChartCard>
  );
}
