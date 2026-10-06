import { ALL_CALENDAR_TYPES, CALENDAR_TYPE_META } from '@/lib/classification';
import { HUE_CLASSES } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { CalendarEventType } from '@/types/api';

/** Clickable legend: toggles visibility per event type, with per-type counts for the visible range. */
export function TypeLegend({
  counts,
  hidden,
  onToggle,
  onShowAll,
}: {
  counts: Record<CalendarEventType, number>;
  hidden: Set<CalendarEventType>;
  onToggle: (t: CalendarEventType) => void;
  onShowAll: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {ALL_CALENDAR_TYPES.map((t) => {
        const m = CALENDAR_TYPE_META[t];
        const c = HUE_CLASSES[m.hue];
        const off = hidden.has(t);
        return (
          <button
            key={t}
            type="button"
            aria-pressed={!off}
            onClick={() => onToggle(t)}
            title={off ? `Show ${m.label}` : `Hide ${m.label}`}
            className={cn(
              'focus-ring inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-xs transition-colors duration-150',
              off
                ? 'border-dashed border-border text-subtle hover:text-muted-foreground'
                : 'border-border bg-card text-foreground/90 hover:bg-accent',
            )}
          >
            <span className={cn('size-1.5 rounded-full', off ? 'border border-current bg-transparent' : c.dot)} />
            <span className={cn(off && 'line-through decoration-subtle/60')}>{m.label}</span>
            <span className="tabular text-2xs text-muted-foreground">{counts[t]}</span>
          </button>
        );
      })}
      {hidden.size > 0 && (
        <button
          type="button"
          onClick={onShowAll}
          className="focus-ring ml-1 h-6 rounded-md px-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Show all
        </button>
      )}
    </div>
  );
}
