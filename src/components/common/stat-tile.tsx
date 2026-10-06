import type * as React from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { HUE_CLASSES, type HueName } from '@/lib/status';
import { cn } from '@/lib/utils';

/**
 * Compact KPI tile: label (sentence case) · value (tabular, semibold) · optional sub-line.
 * Becomes a link when `to` is provided.
 */
export function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  hue,
  to,
  loading,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  hue?: HueName;
  to?: string;
  loading?: boolean;
  className?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
        {Icon && <Icon className={cn('size-3.5 shrink-0', hue ? HUE_CLASSES[hue].text : 'text-subtle')} />}
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-6 w-14" />
      ) : (
        <div className="tabular mt-1.5 text-[22px] font-semibold leading-none tracking-tight">{value}</div>
      )}
      {sub !== undefined && (
        <div className="mt-1.5 truncate text-2xs text-subtle">{loading ? <Skeleton className="h-3 w-20" /> : sub}</div>
      )}
    </>
  );
  const cls = cn('block rounded-lg border bg-card px-3.5 py-3 transition-colors duration-150', className);
  return to ? (
    <Link to={to} className={cn(cls, 'hover:border-input hover:bg-accent/30 focus-ring')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
