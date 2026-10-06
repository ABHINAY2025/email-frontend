import { useNavigate } from 'react-router-dom';
import { BellRing, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RelativeTime } from '@/components/common/data-display';
import { EmptyState, ErrorState } from '@/components/common/states';
import { useDashboardAttention } from '@/hooks/use-queries';
import { ATTENTION_META } from '@/lib/classification';
import { dateTime } from '@/lib/format';
import { HUE_CLASSES } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { AttentionItem } from '@/types/api';

export function AttentionList() {
  const q = useDashboardAttention();
  const navigate = useNavigate();

  const act = (item: AttentionItem) => {
    if ((item.kind === 'POSSIBLE_MATCH' || item.kind === 'NEEDS_REVIEW') && item.emailId)
      navigate(`/inbox?tab=review&email=${item.emailId}`);
    else if (item.applicationId) navigate(`/applications/${item.applicationId}`);
    else if (item.emailId) navigate(`/inbox?email=${item.emailId}`);
  };

  const items = q.data ?? [];

  return (
    <Card>
      <CardHeader
        title="Requires attention"
        icon={BellRing}
        actions={
          items.length > 0 ? (
            <span className="tabular rounded-[4px] bg-hue-orange/12 px-1.5 py-px text-[11px] font-semibold text-hue-orange">{items.length}</span>
          ) : undefined
        }
      />
      {q.isLoading ? (
        <div className="space-y-px p-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-2">
              <Skeleton className="size-6" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-3 w-52" />
              </div>
            </div>
          ))}
        </div>
      ) : q.isError ? (
        <ErrorState compact error={q.error} onRetry={() => q.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState compact icon={BellRing} title="Nothing needs your attention" description="Interview invites, assessments, and follow-ups will appear here." />
      ) : (
        <ul className="max-h-[420px] divide-y overflow-y-auto">
          {items.map((item) => {
            const m = ATTENTION_META[item.kind];
            const Icon = m.icon;
            return (
              <li key={item.id} className="group flex gap-3 px-4 py-2.5 transition-colors hover:bg-accent/30">
                <span
                  className={cn(
                    'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border',
                    HUE_CLASSES[m.hue].bg,
                    HUE_CLASSES[m.hue].border,
                    HUE_CLASSES[m.hue].text,
                  )}
                  title={m.label}
                >
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[13px] font-medium">
                      {item.companyName}
                      {item.jobTitle && <span className="font-normal text-muted-foreground"> · {item.jobTitle}</span>}
                    </p>
                    <span className="shrink-0 text-2xs text-subtle">
                      <RelativeTime value={item.timestamp} />
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.reason}</p>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    {item.dueAt ? (
                      <span className="inline-flex items-center gap-1 text-2xs text-hue-amber">
                        <CalendarClock className="size-3" />
                        <span className="tabular">{dateTime(item.dueAt)}</span>
                      </span>
                    ) : (
                      <span />
                    )}
                    <Button variant="outline" size="xs" onClick={() => act(item)}>
                      {item.actionLabel || 'Open'}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
