import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusTransition } from '@/components/common/badges';
import { RelativeTime } from '@/components/common/data-display';
import { EmptyState, ErrorState } from '@/components/common/states';
import { useDashboardActivity } from '@/hooks/use-queries';
import { EVENT_META } from '@/lib/classification';
import { HUE_CLASSES } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { ActivityItem } from '@/types/api';

export function ActivityStream({ limit = 15 }: { limit?: number }) {
  const q = useDashboardActivity(limit);
  return (
    <Card>
      <CardHeader title="Activity" icon={Activity} />
      {q.isLoading ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-5 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : q.isError ? (
        <ErrorState compact error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState compact icon={Activity} title="No activity yet" description="Status changes and new emails will stream in here." />
      ) : (
        <ActivityList items={q.data} />
      )}
    </Card>
  );
}

export function ActivityList({ items, className }: { items: ActivityItem[]; className?: string }) {
  return (
    <ol className={cn('max-h-[480px] overflow-y-auto py-1', className)}>
      {items.map((a, i) => {
        const m = EVENT_META[a.eventType];
        const Icon = m.icon;
        return (
          <li key={a.id} className="relative">
            {i < items.length - 1 && <span className="absolute bottom-0 left-[26px] top-7 w-px bg-border" aria-hidden />}
            <Link
              to={`/applications/${a.applicationId}`}
              className="flex gap-3 px-4 py-2 transition-colors hover:bg-accent/30 focus-visible:bg-accent/40 focus-visible:outline-none"
            >
              <span
                className={cn(
                  'relative z-[1] mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border bg-card',
                  HUE_CLASSES[m.hue].text,
                )}
              >
                <Icon className="size-3" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-[13px]">
                    <span className="font-medium">{a.companyName}</span>
                    <span className="text-muted-foreground"> · {a.title}</span>
                  </p>
                  <span className="shrink-0 text-2xs text-subtle">
                    <RelativeTime value={a.occurredAt} />
                  </span>
                </div>
                <p className="truncate text-xs text-subtle">
                  {a.jobTitle}
                  {a.actor === 'USER' ? ' · by you' : ''}
                </p>
                {a.newStatus && a.previousStatus !== a.newStatus && (
                  <StatusTransition from={a.previousStatus} to={a.newStatus} className="mt-1.5" />
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
