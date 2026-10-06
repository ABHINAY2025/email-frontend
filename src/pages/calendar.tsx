import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Page } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/kbd';
import { Tooltip } from '@/components/ui/tooltip';
import { ErrorState } from '@/components/common/states';
import { useCalendarEvents } from '@/hooks/use-queries';
import { ALL_CALENDAR_TYPES } from '@/lib/classification';
import { isoDate } from '@/lib/format';
import { cn, isTypingTarget } from '@/lib/utils';
import type { CalendarEventType } from '@/types/api';
import {
  daysIn,
  groupByDay,
  isCalendarView,
  parseAnchor,
  rangeTitle,
  stepAnchor,
  toCalEvent,
  visibleRange,
  type CalEvent,
  type CalendarView,
} from '@/components/calendar/calendar-utils';
import { MonthView } from '@/components/calendar/month-view';
import { TimeGridView } from '@/components/calendar/time-grid-view';
import { AgendaSkeleton, AgendaView } from '@/components/calendar/agenda-view';
import { TypeLegend } from '@/components/calendar/type-legend';

const VIEW_OPTIONS: { value: CalendarView; label: string; title: string }[] = [
  { value: 'month', label: 'Month', title: 'Month (M)' },
  { value: 'week', label: 'Week', title: 'Week (W)' },
  { value: 'day', label: 'Day', title: 'Day (D)' },
  { value: 'agenda', label: 'Agenda', title: 'Agenda (A)' },
];

const VIEW_KEYS: Record<string, CalendarView> = { m: 'month', w: 'week', d: 'day', a: 'agenda' };

function defaultView(): CalendarView {
  try {
    return window.matchMedia('(max-width: 767px)').matches ? 'agenda' : 'month';
  } catch {
    return 'month';
  }
}

export default function CalendarPage() {
  const [params, setParams] = useSearchParams();
  const [fallbackView] = React.useState<CalendarView>(defaultView);
  const viewParam = params.get('view');
  const view: CalendarView = isCalendarView(viewParam) ? viewParam : fallbackView;
  const anchor = React.useMemo(() => parseAnchor(params.get('date')), [params]);

  const navigate = React.useCallback(
    (next: { view?: CalendarView; date?: Date }) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.set('view', next.view ?? view);
          p.set('date', isoDate(next.date ?? anchor));
          return p;
        },
        { replace: true },
      );
    },
    [setParams, view, anchor],
  );

  const { start, end } = visibleRange(view, anchor);
  const from = isoDate(start);
  const to = isoDate(end);
  const query = useCalendarEvents(from, to);

  const [hidden, setHidden] = React.useState<Set<CalendarEventType>>(() => new Set());

  const allEvents = React.useMemo<CalEvent[]>(() => {
    const out: CalEvent[] = [];
    for (const e of query.data ?? []) {
      const c = toCalEvent(e);
      // Guard against stale placeholder data from the previous range.
      if (c && c.dayKey >= from && c.dayKey <= to) out.push(c);
    }
    return out;
  }, [query.data, from, to]);

  const counts = React.useMemo(() => {
    const c = Object.fromEntries(ALL_CALENDAR_TYPES.map((t) => [t, 0])) as Record<CalendarEventType, number>;
    for (const e of allEvents) c[e.raw.type] += 1;
    return c;
  }, [allEvents]);

  const visible = React.useMemo(() => allEvents.filter((e) => !hidden.has(e.raw.type)), [allEvents, hidden]);
  const byDay = React.useMemo(() => groupByDay(visible), [visible]);

  const toggleType = (t: CalendarEventType) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  // Keyboard: ← / → navigate, T today, M/W/D/A switch view.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (document.querySelector('[role="dialog"]')) return;
      const k = e.key.toLowerCase();
      if (e.key === 'ArrowLeft') navigate({ date: stepAnchor(view, anchor, -1) });
      else if (e.key === 'ArrowRight') navigate({ date: stepAnchor(view, anchor, 1) });
      else if (k === 't') navigate({ date: new Date() });
      else if (VIEW_KEYS[k]) navigate({ view: VIEW_KEYS[k] });
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, view, anchor]);

  const openDay = (d: Date) => navigate({ view: 'day', date: d });
  const initialLoading = query.isPending;
  const stale = query.isPlaceholderData;
  const empty = !initialLoading && !query.isError && visible.length === 0;

  return (
    <Page>
      {/* Toolbar */}
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="tabular truncate text-lg font-semibold tracking-tight">{rangeTitle(view, anchor)}</h1>
          {query.isFetching && !initialLoading && <Spinner />}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip content="Today (T)">
            <Button variant="outline" size="sm" onClick={() => navigate({ date: new Date() })}>
              Today
            </Button>
          </Tooltip>
          <div className="flex items-center">
            <Tooltip content="Previous (←)">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Previous"
                onClick={() => navigate({ date: stepAnchor(view, anchor, -1) })}
              >
                <ChevronLeft />
              </Button>
            </Tooltip>
            <Tooltip content="Next (→)">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Next"
                onClick={() => navigate({ date: stepAnchor(view, anchor, 1) })}
              >
                <ChevronRight />
              </Button>
            </Tooltip>
          </div>
          <Segmented
            value={view}
            onValueChange={(v) => navigate({ view: v })}
            options={VIEW_OPTIONS}
            className="ml-auto md:ml-0"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <TypeLegend counts={counts} hidden={hidden} onToggle={toggleType} onShowAll={() => setHidden(new Set())} />
        {empty && view !== 'agenda' && (
          <p className="text-xs text-muted-foreground">
            {allEvents.length > 0 ? 'All events in this period are hidden' : 'No events in this period'}
          </p>
        )}
      </div>

      {query.isError && !query.data ? (
        <div className="rounded-xl border bg-card">
          <ErrorState error={query.error} onRetry={() => void query.refetch()} title="Could not load calendar events" />
        </div>
      ) : (
        <div className={cn('transition-opacity duration-150', stale && 'opacity-60')}>
          {view === 'month' && (
            <MonthView start={start} end={end} anchor={anchor} byDay={byDay} loading={initialLoading} onOpenDay={openDay} />
          )}
          {(view === 'week' || view === 'day') && (
            <TimeGridView days={daysIn(start, end)} byDay={byDay} onOpenDay={view === 'week' ? openDay : undefined} />
          )}
          {view === 'agenda' && (initialLoading ? <AgendaSkeleton /> : <AgendaView byDay={byDay} />)}
        </div>
      )}
    </Page>
  );
}
