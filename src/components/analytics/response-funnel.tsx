import { Fragment } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip } from '@/components/ui/tooltip';
import { chartTheme } from '@/lib/chart-colors';
import { percent } from '@/lib/format';
import { useTheme } from '@/lib/theme';
import type { AnalyticsOverview } from '@/types/api';
import { ChartCard } from './chart-card';

const STEPS = [
  { key: 'applied', label: 'Applied' },
  { key: 'responses', label: 'Responses' },
  { key: 'interviews', label: 'Interviews' },
  { key: 'offers', label: 'Offers' },
] as const;

/** Applied → Responses → Interviews → Offers, widths proportional to Applied (ordinal ramp). */
export function ResponseFunnelCard({
  data,
  loading,
  error,
  onRetry,
  className,
}: {
  data: AnalyticsOverview | undefined;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  className?: string;
}) {
  const t = chartTheme(useTheme().resolved);
  const f = data?.funnel;
  const applied = f?.applied ?? 0;

  return (
    <ChartCard
      title="Response funnel"
      description="Share of applications reaching each stage"
      loading={loading}
      error={error}
      onRetry={onRetry}
      className={className}
      skeleton={
        <div className="space-y-4 py-1">
          {[100, 60, 34, 12].map((w) => (
            <div key={w} className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      }
    >
      {f && (
        <div className="py-0.5">
          {STEPS.map((s, i) => {
            const value = f[s.key];
            const prev = i > 0 ? f[STEPS[i - 1].key] : null;
            const ofApplied = applied ? value / applied : 0;
            return (
              <Fragment key={s.key}>
                {prev !== null && (
                  <div className="tabular flex h-5 items-center gap-1 pl-0.5 text-2xs text-muted-foreground">
                    <span aria-hidden>↓</span>
                    <span>{prev ? percent(value / prev) : '—'}</span>
                    <span className="text-subtle">of {STEPS[i - 1].label.toLowerCase()}</span>
                  </div>
                )}
                <div>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                    <span className="text-foreground/90">{s.label}</span>
                    <span className="tabular flex items-baseline gap-1.5">
                      <span className="font-medium">{value.toLocaleString()}</span>
                      <span className="w-9 text-right text-2xs text-muted-foreground">{percent(ofApplied)}</span>
                    </span>
                  </div>
                  <Tooltip content={`${s.label}: ${value.toLocaleString()} · ${percent(ofApplied, 1)} of applied`}>
                    <div tabIndex={0} className="focus-ring h-5 rounded-[4px]" aria-label={`${s.label} ${value}`}>
                      <div
                        className="h-full rounded-r-[4px] transition-[width] duration-150"
                        style={{ width: `${applied ? Math.max(value ? 1.5 : 0, ofApplied * 100) : 0}%`, backgroundColor: t.funnel[i] }}
                      />
                    </div>
                  </Tooltip>
                </div>
              </Fragment>
            );
          })}
        </div>
      )}
    </ChartCard>
  );
}
