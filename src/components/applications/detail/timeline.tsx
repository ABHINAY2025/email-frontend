import { format, isToday, isYesterday } from 'date-fns';
import { Bot, CalendarClock, CircleDot, Mail, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge, StatusTransition } from '@/components/common/badges';
import { Confidence, RelativeTime } from '@/components/common/data-display';
import { EmptyState, ErrorState } from '@/components/common/states';
import { useApplicationTimeline } from '@/hooks/use-applications';
import { EVENT_META } from '@/lib/classification';
import { dateTime, timeOnly, toDate } from '@/lib/format';
import { HUE_CLASSES, STATUS_META } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { ApplicationDetail, TimelineEvent } from '@/types/api';

function dayLabel(d: Date) {
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, d.getFullYear() === new Date().getFullYear() ? 'EEE, MMM d' : 'EEE, MMM d, yyyy');
}

function groupByDay(events: TimelineEvent[]) {
  const groups: { key: string; date: Date; items: TimelineEvent[] }[] = [];
  for (const e of events) {
    const d = toDate(e.eventDate);
    if (!d) continue;
    const key = format(d, 'yyyy-MM-dd');
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(e);
    else groups.push({ key, date: d, items: [e] });
  }
  return groups;
}

export function ApplicationTimeline({ app, onOpenEmail }: { app: ApplicationDetail; onOpenEmail: (emailId: number) => void }) {
  const q = useApplicationTimeline(app.id);

  if (q.isLoading)
    return (
      <div className="space-y-5 py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="size-6 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-56" />
              <Skeleton className="h-3 w-80 max-w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  if (q.isError) return <ErrorState compact error={q.error} onRetry={() => q.refetch()} />;

  const events = q.data ?? [];
  if (events.length === 0)
    return <EmptyState compact icon={CircleDot} title="No timeline events yet" description="Emails and status changes for this application will appear here." />;

  const groups = groupByDay(events);
  const current = STATUS_META[app.status];

  return (
    <div className="relative">
      {groups.map((g) => (
        <section key={g.key} className="relative">
          <h4 className="sticky top-0 z-[2] -mx-1 mb-1 bg-card/95 px-1 py-1.5 text-2xs font-medium uppercase tracking-[0.06em] text-muted-foreground backdrop-blur-[2px]">
            {dayLabel(g.date)}
          </h4>
          <ol>
            {g.items.map((e) => (
              <TimelineItem key={e.id} event={e} onOpenEmail={onOpenEmail} />
            ))}
          </ol>
        </section>
      ))}

      {/* Current state node */}
      <div className="relative flex gap-3 pt-1">
        <span
          className={cn(
            'relative z-[1] flex size-6 shrink-0 items-center justify-center rounded-full border-2',
            HUE_CLASSES[current.hue].border,
            HUE_CLASSES[current.hue].bg,
          )}
        >
          <span className={cn('size-2 rounded-full', HUE_CLASSES[current.hue].dot)} />
        </span>
        <div className="min-w-0 flex-1 rounded-lg border bg-elevated/60 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="label-caps">Current</span>
            <StatusBadge status={app.status} />
            {app.currentStage && <span className="text-[13px] text-foreground/90">{app.currentStage}</span>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Last activity <RelativeTime value={app.lastActivityAt} />
            {app.confidence !== null && (
              <>
                {' · '}last automatic update at <Confidence value={app.confidence} className="align-middle" />
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ event: e, onOpenEmail }: { event: TimelineEvent; onOpenEmail: (id: number) => void }) {
  const m = EVENT_META[e.eventType];
  const Icon = m.icon;
  const isStatusChange = !!e.newStatus && e.previousStatus !== e.newStatus;
  const clickable = e.emailId !== null;

  const body = (
    <>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-[13px] font-medium">{e.title}</span>
        <span className="tabular text-2xs text-subtle" title={dateTime(e.eventDate)}>
          {timeOnly(e.eventDate)}
        </span>
        <span className="inline-flex items-center gap-1 text-2xs text-subtle">
          {e.actor === 'USER' ? <User className="size-3" /> : <Bot className="size-3" />}
          {e.actor === 'USER' ? 'You' : 'System'}
        </span>
        {e.confidence !== null && <Confidence value={e.confidence} className="ml-auto" />}
      </div>
      {e.emailSubject && (
        <p className={cn('mt-1 flex items-center gap-1.5 text-xs text-muted-foreground', clickable && 'group-hover:text-foreground')}>
          <Mail className="size-3 shrink-0" />
          <span className="truncate">{e.emailSubject}</span>
        </p>
      )}
      {e.description && (
        <blockquote className="mt-1.5 border-l-2 border-border pl-2.5 text-xs leading-relaxed text-muted-foreground">{e.description}</blockquote>
      )}
      {isStatusChange && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span>Status changed:</span>
          <StatusTransition from={e.previousStatus} to={e.newStatus} />
        </div>
      )}
      {e.scheduledAt && (
        <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-hue-amber/25 bg-hue-amber/10 px-2 py-0.5 text-xs">
          <CalendarClock className="size-3 text-hue-amber" />
          <span className="text-muted-foreground">Scheduled:</span>
          <span className="tabular font-medium">{dateTime(e.scheduledAt)}</span>
        </p>
      )}
    </>
  );

  return (
    <li className="group/item relative flex gap-3 pb-4">
      <span className="absolute bottom-0 left-[11px] top-6 w-px bg-border" aria-hidden />
      <span
        className={cn(
          'relative z-[1] flex size-6 shrink-0 items-center justify-center rounded-full border bg-card',
          HUE_CLASSES[m.hue].text,
          HUE_CLASSES[m.hue].border,
        )}
        title={m.label}
      >
        <Icon className="size-3" />
      </span>
      {clickable ? (
        <button
          type="button"
          onClick={() => onOpenEmail(e.emailId!)}
          className="group -mx-2 -my-1 min-w-0 flex-1 rounded-md px-2 py-1 text-left transition-colors hover:bg-accent/40 focus-ring"
          title="Show email"
        >
          {body}
        </button>
      ) : (
        <div className="min-w-0 flex-1">{body}</div>
      )}
    </li>
  );
}
