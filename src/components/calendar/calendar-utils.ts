import {
  addDays,
  addMinutes,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { isoDate } from '@/lib/format';
import type { CalendarEvent } from '@/types/api';

export type CalendarView = 'month' | 'week' | 'day' | 'agenda';
export const CALENDAR_VIEWS: CalendarView[] = ['month', 'week', 'day', 'agenda'];
export const isCalendarView = (v: string | null): v is CalendarView => !!v && (CALENDAR_VIEWS as string[]).includes(v);

export const WEEK_OPTS = { weekStartsOn: 1 as const };

/** Visible hour range of the week / day time grid. */
export const GRID_START_HOUR = 7;
export const GRID_END_HOUR = 21;
export const HOUR_PX = 48;
export const GRID_MINUTES = (GRID_END_HOUR - GRID_START_HOUR) * 60;
export const GRID_HEIGHT = (GRID_END_HOUR - GRID_START_HOUR) * HOUR_PX;
/** Minimum rendered duration (minutes) so short / clamped events stay clickable. */
const MIN_RENDER_MINUTES = 20;
const DEFAULT_DURATION_MINUTES = 60;

/** Parse "YYYY-MM-DD" from the URL; fall back to today. */
export function parseAnchor(value: string | null): Date {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = parseISO(value);
    if (isValid(d)) return startOfDay(d);
  }
  return startOfDay(new Date());
}

/**
 * Visible (fetch) range per view. `to` is inclusive.
 * - month: full grid weeks (Mon–Sun) covering the anchor's month
 * - week: Mon–Sun of the anchor's week
 * - day: the anchor day
 * - agenda: the anchor's calendar month (navigation steps by month, same as Month view)
 */
export function visibleRange(view: CalendarView, anchor: Date): { start: Date; end: Date } {
  switch (view) {
    case 'month':
      return {
        start: startOfWeek(startOfMonth(anchor), WEEK_OPTS),
        end: startOfDay(endOfWeek(endOfMonth(anchor), WEEK_OPTS)),
      };
    case 'week':
      return { start: startOfWeek(anchor, WEEK_OPTS), end: startOfDay(endOfWeek(anchor, WEEK_OPTS)) };
    case 'day':
      return { start: startOfDay(anchor), end: startOfDay(anchor) };
    case 'agenda':
      return { start: startOfMonth(anchor), end: startOfDay(endOfMonth(anchor)) };
  }
}

export function stepAnchor(view: CalendarView, anchor: Date, dir: 1 | -1): Date {
  switch (view) {
    case 'month':
    case 'agenda':
      return startOfMonth(addMonths(anchor, dir));
    case 'week':
      return addWeeks(anchor, dir);
    case 'day':
      return addDays(anchor, dir);
  }
}

export function rangeTitle(view: CalendarView, anchor: Date): string {
  switch (view) {
    case 'month':
    case 'agenda':
      return format(anchor, 'MMMM yyyy');
    case 'day':
      return format(anchor, 'EEEE, MMMM d, yyyy');
    case 'week': {
      const s = startOfWeek(anchor, WEEK_OPTS);
      const e = endOfWeek(anchor, WEEK_OPTS);
      if (s.getFullYear() !== e.getFullYear()) return `${format(s, 'MMM d, yyyy')} – ${format(e, 'MMM d, yyyy')}`;
      if (isSameMonth(s, e)) return `${format(s, 'MMM d')} – ${format(e, 'd, yyyy')}`;
      return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`;
    }
  }
}

export function daysIn(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end });
}

/** An event with parsed local dates. */
export interface CalEvent {
  raw: CalendarEvent;
  start: Date;
  end: Date;
  /** Local YYYY-MM-DD the event is filed under. */
  dayKey: string;
  allDay: boolean;
  /** True when the API provided no end (we assume DEFAULT_DURATION_MINUTES). */
  openEnded: boolean;
}

/**
 * All-day events are filed under the calendar date written in the `start` string (its first 10 chars),
 * so a UTC-midnight instant doesn't slide to the previous day for users west of UTC.
 * Timed events are converted to the local timezone.
 */
export function toCalEvent(e: CalendarEvent): CalEvent | null {
  if (e.allDay) {
    const d = parseISO(e.start.slice(0, 10));
    if (!isValid(d)) return null;
    return { raw: e, start: d, end: d, dayKey: isoDate(d), allDay: true, openEnded: false };
  }
  const start = new Date(e.start);
  if (!isValid(start)) return null;
  const parsedEnd = e.end ? new Date(e.end) : null;
  const end = parsedEnd && isValid(parsedEnd) && parsedEnd > start ? parsedEnd : addMinutes(start, DEFAULT_DURATION_MINUTES);
  return { raw: e, start, end, dayKey: isoDate(start), allDay: false, openEnded: !e.end };
}

/** All-day first, then by start time, then title. */
export function compareEvents(a: CalEvent, b: CalEvent): number {
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
  const t = a.start.getTime() - b.start.getTime();
  if (t !== 0) return t;
  return a.raw.title.localeCompare(b.raw.title);
}

export function groupByDay(events: CalEvent[]): Map<string, CalEvent[]> {
  const map = new Map<string, CalEvent[]>();
  for (const e of events) {
    const list = map.get(e.dayKey);
    if (list) list.push(e);
    else map.set(e.dayKey, [e]);
  }
  for (const list of map.values()) list.sort(compareEvents);
  return map;
}

export function shortTime(d: Date): string {
  return format(d, d.getMinutes() === 0 ? 'h a' : 'h:mm a');
}

/** Full human range, e.g. "Mon, Oct 5, 2026 · 9:30 AM – 10:30 AM" or "Monday, October 5, 2026 · All day". */
export function fullRange(e: CalEvent): string {
  if (e.allDay) return `${format(e.start, 'EEEE, MMMM d, yyyy')} · All day`;
  const day = format(e.start, 'EEE, MMM d, yyyy');
  if (e.openEnded) return `${day} · ${format(e.start, 'h:mm a')}`;
  const sameDay = isoDate(e.start) === isoDate(e.end);
  return sameDay
    ? `${day} · ${format(e.start, 'h:mm a')} – ${format(e.end, 'h:mm a')}`
    : `${day}, ${format(e.start, 'h:mm a')} – ${format(e.end, 'EEE, MMM d, h:mm a')}`;
}

export interface PositionedEvent {
  event: CalEvent;
  top: number;
  height: number;
  /** 0..1 */
  left: number;
  /** 0..1 */
  width: number;
}

/**
 * Lay out one day's timed events on the time grid: clamp to the visible hour range,
 * then place overlapping events side by side (greedy column assignment per overlap cluster).
 */
export function layoutDay(day: Date, events: CalEvent[]): PositionedEvent[] {
  const dayStart = startOfDay(day).getTime();
  const items = events
    .filter((e) => !e.allDay)
    .map((e) => {
      let s = (e.start.getTime() - dayStart) / 60000 - GRID_START_HOUR * 60;
      let en = (e.end.getTime() - dayStart) / 60000 - GRID_START_HOUR * 60;
      s = Math.max(0, Math.min(s, GRID_MINUTES - MIN_RENDER_MINUTES));
      en = Math.min(GRID_MINUTES, Math.max(en, s + MIN_RENDER_MINUTES));
      return { event: e, s, en };
    })
    .sort((a, b) => a.s - b.s || b.en - a.en);

  const out: PositionedEvent[] = [];
  let cluster: { item: (typeof items)[number]; col: number }[] = [];
  let colEnds: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    const cols = colEnds.length || 1;
    for (const { item, col } of cluster) {
      out.push({
        event: item.event,
        top: (item.s / 60) * HOUR_PX,
        height: ((item.en - item.s) / 60) * HOUR_PX,
        left: col / cols,
        width: 1 / cols,
      });
    }
    cluster = [];
    colEnds = [];
    clusterEnd = -1;
  };

  for (const item of items) {
    if (cluster.length > 0 && item.s >= clusterEnd) flush();
    let col = colEnds.findIndex((end) => end <= item.s);
    if (col === -1) {
      col = colEnds.length;
      colEnds.push(item.en);
    } else {
      colEnds[col] = item.en;
    }
    cluster.push({ item, col });
    clusterEnd = Math.max(clusterEnd, item.en);
  }
  if (cluster.length) flush();
  return out;
}
