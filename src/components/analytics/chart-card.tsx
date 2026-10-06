import type * as React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/states';
import { cn } from '@/lib/utils';

/**
 * Chart panel: small header (title + optional right control) and a body that handles
 * its own loading / error state so each query degrades independently.
 */
export function ChartCard({
  title,
  description,
  actions,
  loading,
  error,
  onRetry,
  skeleton,
  className,
  bodyClassName,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  skeleton?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className={cn('flex min-w-0 flex-col', className)}>
      <CardHeader title={title} description={description} actions={actions} />
      <div className={cn('min-w-0 flex-1 px-4 py-3', bodyClassName)}>
        {error ? (
          <ErrorState compact error={error} onRetry={onRetry} />
        ) : loading ? (
          (skeleton ?? <Skeleton className="h-[220px] w-full" />)
        ) : (
          children
        )}
      </div>
    </Card>
  );
}

/** Skeleton for list-style charts (one bar per row). */
export function RowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2.5 py-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2 flex-1" style={{ maxWidth: `${90 - i * 11}%` }} />
          <Skeleton className="h-3 w-8" />
        </div>
      ))}
    </div>
  );
}

/** Tooltip panel used by Recharts `content` renderers. Values lead, labels follow. */
export function ChartTooltipPanel({
  title,
  rows,
}: {
  title: React.ReactNode;
  rows: { color?: string; value: React.ReactNode; label: React.ReactNode }[];
}) {
  return (
    <div className="min-w-[140px] rounded-md border bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-popover">
      <div className="mb-1 text-2xs text-muted-foreground">{title}</div>
      <div className="space-y-0.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            {r.color && <span className="h-0.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />}
            <span className="tabular font-semibold text-foreground">{r.value}</span>
            <span className="text-muted-foreground">{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
