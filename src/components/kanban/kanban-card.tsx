import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDraggable } from '@dnd-kit/core';
import { Archive, Mail, MapPin } from 'lucide-react';
import { CompanyAvatar } from '@/components/ui/avatar';
import { Tooltip } from '@/components/ui/tooltip';
import { DisplayId, RelativeTime } from '@/components/common/data-display';
import { shortDate } from '@/lib/format';
import { cn, pluralize } from '@/lib/utils';
import type { ApplicationSummary } from '@/types/api';

/** Timestamp of the last drag end — suppresses the synthetic click some browsers fire after a drop. */
let lastDragEndAt = 0;
export function markDragEnd() {
  lastDragEndAt = Date.now();
}

/** Pure presentational card (used both in columns and in the DragOverlay). */
export function KanbanCardBody({ app, overlay }: { app: ApplicationSummary; overlay?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-2.5 text-left transition-colors duration-150',
        overlay ? 'rotate-[1.5deg] cursor-grabbing border-input shadow-popover' : 'hover:border-input',
        app.archived && !overlay && 'bg-card/70',
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <CompanyAvatar name={app.companyName} size="xs" />
        <span className="min-w-0 truncate text-xs font-medium text-muted-foreground">{app.companyName}</span>
        {app.needsReview && (
          <Tooltip content="Needs review — low-confidence match or status">
            <span className="size-1.5 shrink-0 rounded-full bg-hue-orange" aria-label="Needs review" />
          </Tooltip>
        )}
        {app.archived && (
          <Tooltip content="Archived">
            <Archive className="size-3 shrink-0 text-subtle" aria-label="Archived" />
          </Tooltip>
        )}
        <DisplayId id={app.displayId} className="ml-auto shrink-0" />
      </div>

      <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-foreground">{app.jobTitle}</p>

      {app.location && (
        <p className="mt-1 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3 shrink-0 text-subtle" />
          <span className="truncate">{app.location}</span>
        </p>
      )}

      <div className="mt-2 flex items-center gap-2 border-t pt-2 text-2xs text-subtle">
        {app.appliedAt && <span className="tabular whitespace-nowrap">Applied {shortDate(app.appliedAt)}</span>}
        {app.appliedAt && app.lastActivityAt && <span aria-hidden>·</span>}
        {app.lastActivityAt && (
          <span className="flex min-w-0 items-center gap-1 whitespace-nowrap">
            Updated <RelativeTime value={app.lastActivityAt} />
          </span>
        )}
        {app.emailCount > 0 && (
          <Tooltip content={pluralize(app.emailCount, 'email')}>
            <span className="tabular ml-auto flex shrink-0 items-center gap-1">
              <Mail className="size-3" />
              {app.emailCount}
            </span>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

/** Draggable wrapper: click (without drag) opens the application; Space picks up via keyboard. */
export function KanbanCard({ app }: { app: ApplicationSummary }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: app.id,
    data: { status: app.status },
  });
  const open = () => navigate(`/applications/${app.id}`);

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-roledescription="Draggable application card"
      aria-label={`${app.companyName} — ${app.jobTitle}. Press Enter to open, Space to move.`}
      onClick={(e) => {
        if (isDragging || e.defaultPrevented || Date.now() - lastDragEndAt < 250) return;
        open();
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
        listeners?.onKeyDown?.(e);
        if (!isDragging && !e.defaultPrevented && e.key === 'Enter') {
          e.preventDefault();
          open();
        }
      }}
      className={cn(
        'focus-ring cursor-grab touch-manipulation rounded-lg outline-none active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
    >
      <KanbanCardBody app={app} />
    </div>
  );
}
