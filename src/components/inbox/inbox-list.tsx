import { forwardRef } from 'react';
import { CompanyAvatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/common/badges';
import { relativeTime, fullTimestamp } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { InboxItem } from '@/types/api';

export function InboxListSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <ul className="divide-y">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex gap-2.5 px-3 py-3">
          <Skeleton className="size-6" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3.5 w-56" />
            <Skeleton className="h-3 w-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export const InboxRow = forwardRef<HTMLButtonElement, { item: InboxItem; selected: boolean; onSelect: () => void }>(function InboxRow(
  { item: e, selected, onSelect },
  ref,
) {
  const unread = !e.isRead;
  return (
    <button
      ref={ref}
      type="button"
      onClick={onSelect}
      aria-current={selected || undefined}
      className={cn(
        'relative flex w-full gap-2.5 px-3 py-2.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50',
        selected ? 'bg-accent' : 'hover:bg-accent/40',
      )}
    >
      {selected && <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" aria-hidden />}
      <span className="flex w-1.5 shrink-0 justify-center pt-2.5">
        {unread && <span className="size-1.5 rounded-full bg-primary" aria-label="Unread" />}
      </span>
      <CompanyAvatar name={e.companyName ?? e.senderName ?? e.senderEmail} size="sm" className="mt-0.5" />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className={cn('truncate text-xs', unread ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
            {e.companyName ?? e.senderName ?? e.senderEmail}
          </span>
          {e.needsReview && <span className="size-1.5 shrink-0 rounded-full bg-hue-orange" title="Needs review" />}
          {e.actionRequired && !e.needsReview && <span className="size-1.5 shrink-0 rounded-full bg-hue-amber" title="Action required" />}
          <time className="tabular ml-auto shrink-0 text-2xs text-subtle" dateTime={e.receivedAt} title={fullTimestamp(e.receivedAt)}>
            {relativeTime(e.receivedAt)}
          </time>
        </span>
        <span className={cn('mt-0.5 block truncate text-[13px]', unread ? 'font-semibold' : 'font-medium text-foreground/85')}>{e.subject}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{e.summary || e.snippet || ' '}</span>
        {(e.applicationJobTitle || e.detectedStatus) && (
          <span className="mt-1.5 flex min-w-0 items-center gap-1.5">
            {e.applicationJobTitle && (
              <span className="inline-flex h-5 min-w-0 items-center truncate rounded-[5px] border bg-card px-1.5 text-2xs text-muted-foreground">
                <span className="truncate">{e.applicationJobTitle}</span>
              </span>
            )}
            {e.detectedStatus && <StatusBadge status={e.detectedStatus} />}
          </span>
        )}
      </span>
    </button>
  );
});
