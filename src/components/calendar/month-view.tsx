import * as React from 'react';
import { format, isSameMonth, isToday } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { CALENDAR_TYPE_META } from '@/lib/classification';
import { isoDate } from '@/lib/format';
import { HUE_CLASSES } from '@/lib/status';
import { cn } from '@/lib/utils';
import { daysIn, shortTime, type CalEvent } from './calendar-utils';
import { DayEventsPopover, EventPopover } from './event-details';

const MAX_CHIPS = 3;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const EventChip = React.forwardRef<
  HTMLButtonElement,
  { event: CalEvent; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ event, className, ...props }, ref) => {
  const c = HUE_CLASSES[CALENDAR_TYPE_META[event.raw.type].hue];
  return (
    <button
      ref={ref}
      type="button"
      title={event.raw.title}
      className={cn(
        'focus-ring flex h-5 w-full min-w-0 items-center gap-1.5 rounded-[4px] pr-1 text-left text-2xs transition-colors duration-150',
        event.allDay ? cn(c.bg, 'hover:brightness-110') : 'hover:bg-accent',
        className,
      )}
      {...props}
    >
      {event.allDay ? (
        <span className={cn('h-full w-0.5 shrink-0 rounded-l-[4px]', c.dot)} />
      ) : (
        <span className={cn('ml-1 size-1.5 shrink-0 rounded-full', c.dot)} />
      )}
      {!event.allDay && <span className="tabular shrink-0 text-muted-foreground">{shortTime(event.start)}</span>}
      <span className="min-w-0 flex-1 truncate font-medium text-foreground/90">{event.raw.title}</span>
    </button>
  );
});
EventChip.displayName = 'EventChip';

export function MonthView({
  start,
  end,
  anchor,
  byDay,
  loading,
  onOpenDay,
}: {
  start: Date;
  end: Date;
  anchor: Date;
  byDay: Map<string, CalEvent[]>;
  loading?: boolean;
  onOpenDay: (d: Date) => void;
}) {
  const days = daysIn(start, end);
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="grid grid-cols-7 border-b bg-elevated/40">
        {WEEKDAYS.map((d) => (
          <div key={d} className="label-caps px-1.5 py-2 text-center md:px-2 md:text-left">
            <span className="md:hidden">{d[0]}</span>
            <span className="hidden md:inline">{d}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-border">
        {days.map((day, i) => {
          const key = isoDate(day);
          const events = byDay.get(key) ?? [];
          const inMonth = isSameMonth(day, anchor);
          const today = isToday(day);
          const visible = events.slice(0, MAX_CHIPS);
          const hidden = events.length - visible.length;
          return (
            <div
              key={key}
              className={cn(
                'relative flex min-h-[64px] min-w-0 flex-col md:min-h-[112px]',
                inMonth ? 'bg-card' : 'bg-background',
              )}
            >
              <div className="flex items-center justify-between px-1 pt-1 md:px-1.5">
                <button
                  type="button"
                  onClick={() => onOpenDay(day)}
                  title={format(day, 'EEEE, MMMM d')}
                  className={cn(
                    'focus-ring tabular inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] px-1 text-2xs font-medium transition-colors hover:bg-accent',
                    today
                      ? 'bg-primary/15 text-primary hover:bg-primary/20'
                      : inMonth
                        ? 'text-foreground/80'
                        : 'text-subtle',
                  )}
                >
                  {day.getDate() === 1 && !today ? format(day, 'MMM d') : day.getDate()}
                </button>
              </div>

              {/* Desktop: chips */}
              <div className={cn('hidden min-w-0 flex-col gap-0.5 px-1 pb-1 pt-0.5 md:flex', !inMonth && 'opacity-70')}>
                {loading && i % 3 === 0 ? (
                  <>
                    <Skeleton className="h-4 w-4/5 rounded-[4px]" />
                    {i % 2 === 0 && <Skeleton className="h-4 w-3/5 rounded-[4px]" />}
                  </>
                ) : (
                  <>
                    {visible.map((e) => (
                      <EventPopover key={e.raw.id} event={e}>
                        <EventChip event={e} />
                      </EventPopover>
                    ))}
                    {hidden > 0 && (
                      <DayEventsPopover day={day} events={events}>
                        <button
                          type="button"
                          className="focus-ring h-5 rounded-[4px] px-1.5 text-left text-2xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          +{hidden} more
                        </button>
                      </DayEventsPopover>
                    )}
                  </>
                )}
              </div>

              {/* Mobile: dots, tap opens the day's list */}
              {events.length > 0 && (
                <DayEventsPopover day={day} events={events}>
                  <button
                    type="button"
                    aria-label={`${events.length} events on ${format(day, 'MMMM d')}`}
                    className="focus-ring absolute inset-0 top-6 flex flex-wrap content-start gap-1 px-1.5 pt-1 md:hidden"
                  >
                    {events.slice(0, 6).map((e) => (
                      <span
                        key={e.raw.id}
                        className={cn('size-1.5 rounded-full', HUE_CLASSES[CALENDAR_TYPE_META[e.raw.type].hue].dot)}
                      />
                    ))}
                    {events.length > 6 && (
                      <span className="tabular text-[9px] leading-[6px] text-muted-foreground">+{events.length - 6}</span>
                    )}
                  </button>
                </DayEventsPopover>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
