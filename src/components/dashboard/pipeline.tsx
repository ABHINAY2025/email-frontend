import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { HUE_CLASSES, PIPELINE_STATUSES, STATUS_META } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { ApplicationStatus, DashboardSummary } from '@/types/api';

/**
 * Horizontal pipeline: Applied → … → Offer as connected segments with counts and a
 * proportional bar under each; terminal outcomes shown as separate chips.
 */
export function PipelineBar({ summary, loading }: { summary: DashboardSummary | undefined; loading?: boolean }) {
  const counts = new Map<ApplicationStatus, number>(summary?.pipeline.map((p) => [p.status, p.count]) ?? []);
  const max = Math.max(1, ...PIPELINE_STATUSES.map((s) => counts.get(s) ?? 0));
  const total = summary?.total ?? 0;

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <h3 className="text-[13px] font-semibold">Pipeline</h3>
        <div className="flex items-center gap-1.5">
          {(['REJECTED', 'WITHDRAWN'] as ApplicationStatus[]).map((s) => (
            <TerminalChip key={s} status={s} count={counts.get(s) ?? 0} loading={loading} />
          ))}
          {(counts.get('CLOSED') ?? 0) > 0 && <TerminalChip status="CLOSED" count={counts.get('CLOSED') ?? 0} />}
        </div>
      </div>
      <ol className="grid grid-cols-2 gap-px overflow-hidden rounded-b-xl bg-border sm:grid-cols-3 lg:grid-cols-6">
        {PIPELINE_STATUSES.map((s, i) => {
          const m = STATUS_META[s];
          const c = counts.get(s) ?? 0;
          const share = total ? Math.round((c / total) * 100) : 0;
          return (
            <li key={s} className="relative bg-card">
              <Link
                to={`/applications?status=${s}`}
                className="group flex h-full flex-col gap-2 px-4 py-3 transition-colors hover:bg-accent/40 focus-visible:bg-accent/40 focus-visible:outline-none"
              >
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-foreground">
                  <span className={cn('size-1.5 rounded-full', HUE_CLASSES[m.hue].dot)} />
                  {m.label}
                </span>
                {loading ? (
                  <Skeleton className="h-6 w-10" />
                ) : (
                  <span className="flex items-baseline gap-1.5">
                    <span className="tabular text-xl font-semibold leading-none">{c}</span>
                    <span className="tabular text-2xs text-subtle">{share}%</span>
                  </span>
                )}
                <span className="h-1 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
                  <span
                    className={cn('block h-full rounded-full transition-[width] duration-300', HUE_CLASSES[m.hue].dot)}
                    style={{ width: loading ? 0 : `${Math.max(c ? 4 : 0, (c / max) * 100)}%` }}
                  />
                </span>
              </Link>
              {i < PIPELINE_STATUSES.length - 1 && (
                <ChevronRight
                  className="pointer-events-none absolute -right-[7px] top-1/2 z-10 hidden size-3.5 -translate-y-1/2 rounded-full bg-card text-subtle lg:block"
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function TerminalChip({ status, count, loading }: { status: ApplicationStatus; count: number; loading?: boolean }) {
  const m = STATUS_META[status];
  return (
    <Link
      to={`/applications?status=${status}`}
      className="inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-xs transition-colors hover:bg-accent/60 focus-ring"
    >
      <span className={cn('size-1.5 rounded-full', HUE_CLASSES[m.hue].dot)} />
      <span className="text-muted-foreground">{m.label}</span>
      <span className="tabular font-medium">{loading ? '–' : count}</span>
    </Link>
  );
}
