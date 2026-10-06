import * as React from 'react';
import { format, isToday } from 'date-fns';
import { CALENDAR_TYPE_META } from '@/lib/classification';
import { isoDate } from '@/lib/format';
import { HUE_CLASSES } from '@/lib/status';
import { cn } from '@/lib/utils';
import {
  GRID_END_HOUR,
  GRID_HEIGHT,
  GRID_MINUTES,
  GRID_START_HOUR,
  HOUR_PX,
  layoutDay,
  shortTime,
  type CalEvent,
  type PositionedEvent,
} from './calendar-utils';
import { EventPopover } from './event-details';
import { EventChip } from './month-view';

const HOURS = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR + 1 }, (_, i) => GRID_START_HOUR + i);

function useNow(intervalMs = 60_000) {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}

function TimedBlock({ p }: { p: PositionedEvent }) {
  const e = p.event;
  const c = HUE_CLASSES[CALENDAR_TYPE_META[e.raw.type].hue];
  const roomy = p.height >= 34;
  return (
    <EventPopover event={e} side="right">
      <button
        type="button"
        title={`${e.raw.title} · ${shortTime(e.start)}`}
        className="focus-ring absolute overflow-hidden rounded-[5px] bg-card text-left transition-[filter] duration-150 hover:brightness-110"
        style={{
          top: p.top + 1,
          height: Math.max(p.height - 2, 16),
          left: `calc(${p.left * 100}% + 2px)`,
          width: `calc(${p.width * 100}% - 4px)`,
        }}
      >
        <span className={cn('absolute inset-0 border', c.bg, c.border, 'rounded-[5px]')} />
        <span className={cn('absolute inset-y-0 left-0 w-0.5', c.dot)} />
        <span className="relative flex h-full min-w-0 flex-col pl-1.5 pr-1 pt-0.5">
          <span className="truncate text-2xs font-medium leading-[14px] text-foreground/90">{e.raw.title}</span>
          {roomy && (
            <span className="tabular truncate text-2xs leading-[14px] text-muted-foreground">
              {shortTime(e.start)}
              {!e.openEnded && ` – ${shortTime(e.end)}`}
            </span>
          )}
        </span>
      </button>
    </EventPopover>
  );
}

export function TimeGridView({
  days,
  byDay,
  onOpenDay,
}: {
  days: Date[];
  byDay: Map<string, CalEvent[]>;
  onOpenDay?: (d: Date) => void;
}) {
  const now = useNow();
  const cols = `var(--gutter) repeat(${days.length}, minmax(0, 1fr))`;
  const nowMinutes = (now.getHours() - GRID_START_HOUR) * 60 + now.getMinutes();
  const showNow = nowMinutes >= 0 && nowMinutes <= GRID_MINUTES;
  const single = days.length === 1;

  return (
    <div className="overflow-hidden rounded-xl border bg-card [--gutter:40px] md:[--gutter:56px]">
      {/* Day headers */}
      <div className="grid border-b bg-elevated/40" style={{ gridTemplateColumns: cols }}>
        <div />
        {days.map((d) => {
          const today = isToday(d);
          return (
            <button
              key={isoDate(d)}
              type="button"
              disabled={!onOpenDay}
              onClick={() => onOpenDay?.(d)}
              className={cn(
                'focus-ring flex min-w-0 flex-col items-center gap-0.5 border-l py-1.5 transition-colors enabled:hover:bg-accent/60 md:flex-row md:justify-center md:gap-1.5',
                single && 'md:justify-start md:px-3',
              )}
            >
              <span className="label-caps">{format(d, single ? 'EEEE' : 'EEE')}</span>
              <span
                className={cn(
                  'tabular inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] px-1 text-xs font-semibold',
                  today ? 'bg-primary/15 text-primary' : 'text-foreground/85',
                )}
              >
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* All-day row */}
      <div className="grid border-b" style={{ gridTemplateColumns: cols }}>
        <div className="flex items-start justify-end px-1.5 py-1.5 text-right text-[10px] leading-3 text-subtle md:text-2xs">
          All day
        </div>
        {days.map((d) => {
          const allDay = (byDay.get(isoDate(d)) ?? []).filter((e) => e.allDay);
          return (
            <div key={isoDate(d)} className="flex min-h-[30px] min-w-0 flex-col gap-0.5 border-l p-1">
              {allDay.map((e) => (
                <EventPopover key={e.raw.id} event={e}>
                  <EventChip event={e} />
                </EventPopover>
              ))}
            </div>
          );
        })}
      </div>

      {/* Hourly grid */}
      <div className="grid py-2" style={{ gridTemplateColumns: cols }}>
        <div className="relative" style={{ height: GRID_HEIGHT }}>
          {HOURS.map((h, i) => (
            <span
              key={h}
              className="tabular absolute right-1.5 -translate-y-1/2 text-[10px] text-subtle md:right-2 md:text-2xs"
              style={{ top: i * HOUR_PX }}
            >
              {String(h).padStart(2, '0')}:00
            </span>
          ))}
        </div>
        {days.map((d) => {
          const positioned = layoutDay(d, byDay.get(isoDate(d)) ?? []);
          const today = isToday(d);
          return (
            <div
              key={isoDate(d)}
              className={cn('relative min-w-0 border-l', today && 'bg-primary/[0.025]')}
              style={{ height: GRID_HEIGHT }}
            >
              {HOURS.map((h, i) => (
                <div key={h} className="pointer-events-none absolute inset-x-0 border-t border-border/70" style={{ top: i * HOUR_PX }} />
              ))}
              {positioned.map((p) => (
                <TimedBlock key={p.event.raw.id} p={p} />
              ))}
              {today && showNow && (
                <div
                  className="pointer-events-none absolute inset-x-0 z-10 h-px bg-hue-red"
                  style={{ top: (nowMinutes / 60) * HOUR_PX }}
                  aria-hidden
                >
                  <span className="absolute -left-1 -top-1 size-2 rounded-full bg-hue-red" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
