import type * as React from 'react';
import { Tooltip } from '@/components/ui/tooltip';
import { fullTimestamp, relativeTime, shortDate } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Relative time with the full timestamp in a tooltip. */
export function RelativeTime({
  value,
  className,
  mode = 'relative',
}: {
  value: string | null | undefined;
  className?: string;
  mode?: 'relative' | 'date';
}) {
  if (!value) return <span className={cn('text-subtle', className)}>—</span>;
  return (
    <Tooltip content={fullTimestamp(value)}>
      <time dateTime={value} className={cn('tabular whitespace-nowrap', className)}>
        {mode === 'date' ? shortDate(value) : relativeTime(value)}
      </time>
    </Tooltip>
  );
}

/** "96%" with a tiny meter. Color reflects confidence band. */
export function Confidence({
  value,
  className,
  showMeter = true,
  threshold = 0.75,
}: {
  value: number | null | undefined;
  className?: string;
  showMeter?: boolean;
  threshold?: number;
}) {
  if (value === null || value === undefined) return <span className="text-xs text-subtle">—</span>;
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const tone = value >= Math.max(threshold, 0.85) ? 'bg-hue-green' : value >= threshold ? 'bg-hue-blue' : 'bg-hue-amber';
  return (
    <Tooltip content={`Classification confidence ${pct}%${value < threshold ? ' — below the auto-update threshold' : ''}`}>
      <span className={cn('inline-flex items-center gap-1.5 text-xs', className)}>
        {showMeter && (
          <span className="relative h-1 w-8 overflow-hidden rounded-full bg-muted" aria-hidden>
            <span className={cn('absolute inset-y-0 left-0 rounded-full', tone)} style={{ width: `${pct}%` }} />
          </span>
        )}
        <span className="tabular font-medium text-foreground/90">{pct}%</span>
      </span>
    </Tooltip>
  );
}

/** Muted italic placeholder for unknown values — we never invent data. */
export function NotDetected({ label = 'Not detected', className }: { label?: string; className?: string }) {
  return <span className={cn('text-xs italic text-subtle', className)}>{label}</span>;
}

/** Display a value or the "Not detected" placeholder. */
export function ValueOr({ value, children }: { value: unknown; children?: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return <NotDetected />;
  return <>{children ?? String(value)}</>;
}

export function DisplayId({ id, className }: { id: string; className?: string }) {
  return <span className={cn('font-mono text-[11px] text-subtle', className)}>{id}</span>;
}

/** Key-value row for detail sidebars. */
export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-[112px_minmax(0,1fr)] items-baseline gap-3 py-1.5', className)}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-[13px]">{children}</dd>
    </div>
  );
}
