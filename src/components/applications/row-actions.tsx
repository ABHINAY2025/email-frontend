import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, ArchiveRestore, ArrowRightLeft, ExternalLink, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusDot } from '@/components/common/badges';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useArchiveApplication, useDeleteApplication, useUpdateStatus } from '@/hooks/use-applications';
import { ALL_STATUSES } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { ApplicationSummary } from '@/types/api';

export function ApplicationRowActions({
  app,
  className,
  allowDelete = false,
}: {
  app: ApplicationSummary;
  className?: string;
  allowDelete?: boolean;
}) {
  const navigate = useNavigate();
  const status = useUpdateStatus();
  const archive = useArchiveApplication();
  const del = useDeleteApplication();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            className={cn('text-muted-foreground', className)}
            aria-label={`Actions for ${app.companyName} ${app.jobTitle}`}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onSelect={() => navigate(`/applications/${app.id}`)}>
            <ExternalLink /> Open
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ArrowRightLeft /> Change status
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-44">
              {ALL_STATUSES.map((s) => (
                <DropdownMenuItem
                  key={s}
                  disabled={s === app.status}
                  onSelect={() => status.mutate({ id: app.id, status: s, previous: app.status })}
                >
                  <StatusDot status={s} />
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => archive.mutate({ id: app.id, archived: !app.archived })}>
            {app.archived ? (
              <>
                <ArchiveRestore /> Unarchive
              </>
            ) : (
              <>
                <Archive /> Archive
              </>
            )}
          </DropdownMenuItem>
          {allowDelete && (
            <DropdownMenuItem destructive onSelect={() => setConfirmDelete(true)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {allowDelete && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Delete application?"
          description={`${app.companyName} — ${app.jobTitle} will be permanently deleted, along with its timeline, notes and linked emails.`}
          confirmLabel="Delete application"
          destructive
          loading={del.isPending}
          onConfirm={async () => {
            await del.mutateAsync(app.id).catch(() => undefined);
            setConfirmDelete(false);
          }}
        />
      )}
    </>
  );
}
