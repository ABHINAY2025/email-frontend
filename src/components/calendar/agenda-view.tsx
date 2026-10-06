import * as React from 'react';
import { format, isBefore, isToday, isTomorrow, isYesterday, parseISO, startOfDay } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/states';
import { cn } from '@/lib/utils';
import { shortTime, type CalEvent } from './calendar-utils';
import { EventPopover, TypeBadge } from './event-details';

function relativeDay(d: Date): string | null {
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  return null;
}

export function AgendaSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {Array.from({ length: 3 }).map((_, g) => (
        <div key={g}>
          <div className="border-b bg-elevated/60 px-4 py-2">
            <Skeleton className="h-3.5 w-24" />
          </div>
          {Array.from({ length: 3 - (g % 2) }).map((__, r) => (
            <div key={r} className="flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0">
              <Skeleton className="h-3.5 w-14" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3.5 w-48" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function AgendaView({ byDay }: { byDay: Map<string, CalEvent[]> }) {
  const keys = React.useMemo(() => [...byDay.keys()].sort(), [byDay]);
  const todayStart = startOfDay(new Date());
  const firstUpcomingKey = keys.find((k) => !isBefore(parseISO(k), todayStart));
  const upcomingRef = React.useRef<HTMLDivElement>(null);
  const scrolledFor = React.useRef<string | null>(null);

  // Jump to today / the next upcoming day once per month (useful on mobile where Agenda is the default).
  React.useEffect(() => {
    const sig = keys[0]?.slice(0, 7) ?? '';
    if (!upcomingRef.current || scrolledFor.current === sig) return;
    scrolledFor.current = sig;
    if (keys[0] !== firstUpcomingKey) upcomingRef.current.scrollIntoView({ block: 'start' });
  }, [keys, firstUpcomingKey]);

  if (keys.length === 0) {
    return (
      <div className="rounded-xl border bg-card">
        <EmptyState icon={CalendarDays} title="No events in this period" description="Interviews, assessments, deadlines and follow-ups detected from your emails show up here." compact />
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      {keys.map((key, gi) => {
        const day = parseISO(key);
        const rel = relativeDay(day);
        const past = isBefore(day, todayStart);
        const events = byDay.get(key) ?? [];
        return (
          <section
            key={key}
            ref={key === firstUpcomingKey ? upcomingRef : undefined}
            className="scroll-mt-2"
            aria-label={format(day, 'EEEE, MMMM d')}
          >
            <header
              className={cn(
                'sticky top-0 z-10 flex items-baseline gap-2 border-b bg-elevated px-4 py-1.5',
                gi === 0 ? 'rounded-t-xl' : 'border-t',
              )}
            >
              <h3 className={cn('text-xs font-semibold', past && 'text-muted-foreground', rel === 'Today' && 'text-primary')}>
                {format(day, 'EEE, MMM d')}
              </h3>
              {rel && <span className="text-2xs text-muted-foreground">{rel}</span>}
              <span className="tabular ml-auto text-2xs text-subtle">{events.length}</span>
            </header>
            <ul>
              {events.map((e) => (
                <li key={e.raw.id} className="border-b last:border-b-0">
                  <EventPopover event={e}>
                    <button
                      type="button"
                      className={cn(
                        'focus-ring flex w-full flex-col gap-1 px-4 py-2 text-left transition-colors hover:bg-accent/60 sm:flex-row sm:items-center sm:gap-3',
                        past && 'opacity-75',
                      )}
                    >
                      <span className="flex shrink-0 items-center gap-2 sm:contents">
                        <span className="tabular w-[64px] shrink-0 text-xs text-muted-foreground">
                          {e.allDay ? 'All day' : shortTime(e.start)}
                        </span>
                        <span className="shrink-0 sm:w-[124px]">
                          <TypeBadge event={e} />
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{e.raw.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {e.raw.companyName} · {e.raw.jobTitle}
                        </span>
                      </span>
                    </button>
                  </EventPopover>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
