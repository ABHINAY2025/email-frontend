import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowUpRight, ChevronLeft, Clock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HueBadge } from '@/components/ui/badge';
import { CompanyAvatar } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CALENDAR_TYPE_META } from '@/lib/classification';
import { HUE_CLASSES } from '@/lib/status';
import { cn } from '@/lib/utils';
import { fullRange, shortTime, type CalEvent } from './calendar-utils';

export function TypeBadge({ event, className }: { event: CalEvent; className?: string }) {
  const m = CALENDAR_TYPE_META[event.raw.type];
  return (
    <HueBadge hue={m.hue} icon={m.icon} className={className}>
      {m.label}
    </HueBadge>
  );
}

/** Body of the event popover: type, title, company, timing and actions. */
export function EventDetails({ event, onBack }: { event: CalEvent; onBack?: () => void }) {
  const navigate = useNavigate();
  const e = event.raw;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {onBack && (
          <Button variant="ghost" size="icon-xs" onClick={onBack} aria-label="Back to day">
            <ChevronLeft />
          </Button>
        )}
        <TypeBadge event={event} />
      </div>
      <p className="text-sm font-semibold leading-snug">{e.title}</p>
      <div className="flex items-start gap-2.5">
        <CompanyAvatar name={e.companyName} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{e.companyName}</p>
          <p className="truncate text-xs text-muted-foreground">{e.jobTitle}</p>
        </div>
      </div>
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Clock className="mt-px size-3.5 shrink-0" />
        <span className="tabular">{fullRange(event)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
        <Button size="sm" onClick={() => navigate(`/applications/${e.applicationId}`)}>
          Open application <ArrowUpRight />
        </Button>
        {e.emailId !== null && (
          <Button size="sm" variant="outline" onClick={() => navigate(`/inbox?email=${e.emailId}`)}>
            <Mail /> View email
          </Button>
        )}
      </div>
    </div>
  );
}

/** Wrap any trigger element; clicking it opens the event's details. */
export function EventPopover({
  event,
  children,
  side,
  align = 'start',
}: {
  event: CalEvent;
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent side={side} align={align} collisionPadding={12} className="w-[300px] max-w-[calc(100vw-24px)]">
        <EventDetails event={event} />
      </PopoverContent>
    </Popover>
  );
}

/** Compact row used in day lists (popover "+N more", mobile day tap). */
export function EventListRow({ event, onClick }: { event: CalEvent; onClick: () => void }) {
  const c = HUE_CLASSES[CALENDAR_TYPE_META[event.raw.type].hue];
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-accent"
    >
      <span className={cn('h-4 w-0.5 shrink-0 rounded-full', c.dot)} />
      <span className="tabular w-[52px] shrink-0 text-2xs text-muted-foreground">
        {event.allDay ? 'All day' : shortTime(event.start)}
      </span>
      <span className="min-w-0 flex-1 truncate text-xs">{event.raw.title}</span>
    </button>
  );
}

/** Popover listing every event of a day; selecting one shows its details in place. */
export function DayEventsPopover({
  day,
  events,
  children,
}: {
  day: Date;
  events: CalEvent[];
  children: React.ReactElement;
}) {
  const [selected, setSelected] = React.useState<CalEvent | null>(null);
  return (
    <Popover onOpenChange={(o) => !o && setSelected(null)}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" collisionPadding={12} className="w-[300px] max-w-[calc(100vw-24px)] p-2">
        {selected ? (
          <div className="p-1">
            <EventDetails event={selected} onBack={() => setSelected(null)} />
          </div>
        ) : (
          <div>
            <div className="flex items-baseline justify-between px-1.5 pb-1.5 pt-0.5">
              <p className="text-xs font-semibold">{format(day, 'EEEE, MMM d')}</p>
              <span className="tabular text-2xs text-muted-foreground">
                {events.length} {events.length === 1 ? 'event' : 'events'}
              </span>
            </div>
            <div className="max-h-[280px] overflow-y-auto">
              {events.map((e) => (
                <EventListRow key={e.raw.id} event={e} onClick={() => setSelected(e)} />
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
