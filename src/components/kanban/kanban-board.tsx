import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardCode,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from '@dnd-kit/core';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useUpdateStatus } from '@/hooks/use-applications';
import { PIPELINE_STATUSES, STATUS_META, isApplicationStatus } from '@/lib/status';
import type { ApplicationStatus, ApplicationSummary } from '@/types/api';
import { KanbanCardBody, markDragEnd } from './kanban-card';
import { KanbanColumn, KanbanColumnSkeleton } from './kanban-column';

/** Closed lanes: each terminal status gets its own lane (CLOSED = "position closed" stays distinct). */
export const CLOSED_LANES: ApplicationStatus[] = ['REJECTED', 'WITHDRAWN', 'CLOSED'];
const CLOSED_OPEN_KEY = 'applyflow.kanban.closedOpen';

function readClosedOpen(): boolean {
  try {
    return window.localStorage.getItem(CLOSED_OPEN_KEY) === '1';
  } catch {
    return false;
  }
}

const collisionDetection: CollisionDetection = (args) => {
  const within = pointerWithin(args);
  return within.length > 0 ? within : rectIntersection(args);
};

/** Keyboard: ←/→ jump straight to the neighbouring column instead of nudging 25px at a time. */
const columnKeyboardCoordinates: KeyboardCoordinateGetter = (event, { context }) => {
  const { collisionRect, droppableRects } = context;
  if (!collisionRect) return undefined;
  const right = event.code === KeyboardCode.Right;
  const left = event.code === KeyboardCode.Left;
  if (!right && !left) return undefined;
  event.preventDefault();
  const cx = collisionRect.left + collisionRect.width / 2;
  let best: { left: number; top: number } | null = null;
  for (const rect of droppableRects.values()) {
    const rcx = rect.left + rect.width / 2;
    if (right ? rcx <= cx + 4 : rcx >= cx - 4) continue;
    if (!best || (right ? rect.left < best.left : rect.left > best.left)) best = { left: rect.left, top: rect.top };
  }
  if (!best) return undefined;
  return { x: best.left + 6, y: best.top + 40 };
};

function byLastActivityDesc(a: ApplicationSummary, b: ApplicationSummary) {
  return (b.lastActivityAt ?? '').localeCompare(a.lastActivityAt ?? '');
}

export function KanbanBoard({ apps }: { apps: ApplicationSummary[] }) {
  const updateStatus = useUpdateStatus();
  const [active, setActive] = React.useState<ApplicationSummary | null>(null);
  const [closedOpen, setClosedOpenState] = React.useState(readClosedOpen);

  const setClosedOpen = (open: boolean) => {
    setClosedOpenState(open);
    try {
      window.localStorage.setItem(CLOSED_OPEN_KEY, open ? '1' : '0');
    } catch {
      /* storage unavailable */
    }
  };

  const columns = React.useMemo(() => {
    const map = new Map<ApplicationStatus, ApplicationSummary[]>();
    for (const s of [...PIPELINE_STATUSES, ...CLOSED_LANES]) map.set(s, []);
    for (const a of apps) map.get(a.status)?.push(a);
    for (const list of map.values()) list.sort(byLastActivityDesc);
    return map;
  }, [apps]);

  const closedCount = CLOSED_LANES.reduce((n, s) => n + (columns.get(s)?.length ?? 0), 0);
  const byId = React.useMemo(() => new Map(apps.map((a) => [a.id, a])), [apps]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Press-and-hold on touch so horizontal board scrolling still works
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
      coordinateGetter: columnKeyboardCoordinates,
    }),
  );

  const announcements: Announcements = {
    onDragStart: ({ active: a }) => `Picked up ${byId.get(Number(a.id))?.companyName ?? 'card'}.`,
    onDragOver: ({ over }) =>
      over && isApplicationStatus(String(over.id)) ? `Over ${STATUS_META[over.id as ApplicationStatus].label}.` : 'Not over a column.',
    onDragEnd: ({ over }) =>
      over && isApplicationStatus(String(over.id)) ? `Moved to ${STATUS_META[over.id as ApplicationStatus].label}.` : 'Dropped.',
    onDragCancel: () => 'Move cancelled.',
  };

  const onDragStart = (e: DragStartEvent) => setActive(byId.get(Number(e.active.id)) ?? null);

  const onDragEnd = (e: DragEndEvent) => {
    markDragEnd();
    setActive(null);
    const app = byId.get(Number(e.active.id));
    const target = e.over ? String(e.over.id) : null;
    if (!app || !target || !isApplicationStatus(target) || target === app.status) return;
    updateStatus.mutate({ id: app.id, status: target, previous: app.status });
  };

  const dragging = active?.status ?? null;
  const showClosed = closedOpen || active !== null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        markDragEnd();
        setActive(null);
      }}
      accessibility={{ announcements }}
    >
      <div className="flex h-full w-max gap-2.5">
        {PIPELINE_STATUSES.map((s) => (
          <KanbanColumn key={s} status={s} apps={columns.get(s) ?? []} dragging={dragging} />
        ))}

        <Collapsible open={showClosed} onOpenChange={setClosedOpen} asChild>
          <div className="ml-1 flex h-full shrink-0 gap-2.5 border-l pl-3.5">
            {!showClosed && (
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  aria-label={`Show closed applications (${closedCount})`}
                  className="focus-ring flex h-full w-10 flex-col items-center gap-2 rounded-xl border border-dashed bg-muted/20 py-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <ChevronRight className="size-3.5" />
                  <span className="label-caps [writing-mode:vertical-rl]">Closed</span>
                  <span className="tabular rounded-[5px] bg-muted px-1 text-2xs font-medium leading-[18px]">{closedCount}</span>
                </button>
              </CollapsibleTrigger>
            )}
            <CollapsibleContent className="h-full data-[state=closed]:animate-none data-[state=open]:animate-none">
              <div className="flex h-full gap-2.5">
                <CollapsibleTrigger asChild disabled={active !== null}>
                  <button
                    type="button"
                    aria-label="Collapse closed applications"
                    title="Collapse"
                    className="focus-ring flex h-full w-6 shrink-0 flex-col items-center gap-2 rounded-lg py-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
                  >
                    <ChevronLeft className="size-3.5" />
                    <span className="label-caps [writing-mode:vertical-rl]">Closed · {closedCount}</span>
                  </button>
                </CollapsibleTrigger>
                {CLOSED_LANES.map((s) => (
                  <KanbanColumn key={s} status={s} apps={columns.get(s) ?? []} dragging={dragging} />
                ))}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      <DragOverlay dropAnimation={null}>
        {active ? (
          <div className="w-[256px]">
            <KanbanCardBody app={active} overlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export function KanbanBoardSkeleton() {
  return (
    <div className="flex h-full w-max gap-2.5">
      {PIPELINE_STATUSES.map((s, i) => (
        <KanbanColumnSkeleton key={s} cards={[3, 2, 1, 2, 1, 1][i] ?? 1} />
      ))}
    </div>
  );
}

