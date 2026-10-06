import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Numbered circle used by the setup stepper: done → check, current → filled primary. */
export function StepMarker({
  index,
  done,
  current,
  size = 'md',
}: {
  index: number;
  done: boolean;
  current?: boolean;
  size?: 'sm' | 'md';
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border font-semibold tabular-nums transition-colors',
        size === 'md' ? 'size-6 text-[11px]' : 'size-[18px] text-[10px]',
        done
          ? 'border-hue-green/30 bg-hue-green/10 text-hue-green'
          : current
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-card text-muted-foreground',
      )}
    >
      {done ? <Check className={size === 'md' ? 'size-3.5' : 'size-3'} strokeWidth={2.75} /> : index}
    </span>
  );
}

/** Thin horizontal progress bar. */
export function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div
      className={cn('h-1 w-full overflow-hidden rounded-full bg-muted', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}
