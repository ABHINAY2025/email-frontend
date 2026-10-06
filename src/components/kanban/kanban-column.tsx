import { useDroppable } from '@dnd-kit/core';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip } from '@/components/ui/tooltip';
import { HUE_CLASSES, STATUS_META } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { ApplicationStatus, ApplicationSummary } from '@/types/api';
import { KanbanCard } from './kanban-card';

export const COLUMN_WIDTH = 'w-[272px]';

export function KanbanColumn({
  status,
  apps,
  dragging,
  className,
}: {
  status: ApplicationStatus;
  apps: ApplicationSummary[];
  /** Status of the card currently being dragged (null when idle). */
  dragging: ApplicationStatus | null;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { status } });
  const meta = STATUS_META[status];
  const canDrop = dragging !== null && dragging !== status;

  return (
    <section
      ref={setNodeRef}
      aria-label={`${meta.label} column`}
      className={cn(
        'flex h-full min-h-0 shrink-0 flex-col rounded-xl border bg-muted/30 transition-[background-color,box-shadow,border-color] duration-150',
        COLUMN_WIDTH,
        isOver && canDrop && 'border-primary/40 bg-primary/[0.05] ring-1 ring-primary/30',
        className,
      )}
    >
      <header className="flex h-9 shrink-0 items-center gap-2 px-3">
        <span className={cn('size-2 shrink-0 rounded-full', HUE_CLASSES[meta.hue].dot)} />
        <Tooltip content={meta.description}>
          <h2 className="truncate text-xs font-semibold text-foreground/90">{meta.label}</h2>
        </Tooltip>
        <span className="tabular ml-auto rounded-[5px] bg-muted px-1.5 text-2xs font-medium leading-[18px] text-muted-foreground">
          {apps.length}
        </span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-1.5 pb-1.5">
        {apps.map((a) => (
          <KanbanCard key={a.id} app={a} />
        ))}
        {apps.length === 0 && (
          <div
            className={cn(
              'flex h-20 shrink-0 items-center justify-center rounded-lg border border-dashed text-xs text-subtle transition-colors',
              isOver && canDrop && 'border-primary/40 text-primary/80',
            )}
          >
            {canDrop ? 'Drop here' : 'No applications'}
          </div>
        )}
      </div>
    </section>
  );
}

export function KanbanColumnSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className={cn('flex h-full shrink-0 flex-col rounded-xl border bg-muted/30', COLUMN_WIDTH)}>
      <div className="flex h-9 items-center gap-2 px-3">
        <Skeleton className="size-2 rounded-full" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="ml-auto h-4 w-6" />
      </div>
      <div className="flex flex-col gap-1.5 px-1.5">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-2.5">
            <div className="flex items-center gap-1.5">
              <Skeleton className="size-5 rounded-[4px]" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="mt-2 h-3.5 w-11/12" />
            <Skeleton className="mt-1.5 h-3 w-1/2" />
            <Skeleton className="mt-3 h-2.5 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
