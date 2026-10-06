import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/common/badges';
import { useUpdateStatus } from '@/hooks/use-applications';
import { ALL_STATUSES, HUE_CLASSES, STATUS_META } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { ApplicationDetail, ApplicationStatus } from '@/types/api';

export function ChangeStatusDialog({
  app,
  open,
  onOpenChange,
  initialStatus,
}: {
  app: ApplicationDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStatus?: ApplicationStatus | null;
}) {
  const [status, setStatus] = useState<ApplicationStatus>(initialStatus ?? app.status);
  const [reason, setReason] = useState('');
  const update = useUpdateStatus();

  useEffect(() => {
    if (open) {
      setStatus(initialStatus ?? app.status);
      setReason('');
    }
  }, [open, initialStatus, app.status]);

  const submit = () => {
    if (status === app.status) return onOpenChange(false);
    update.mutate(
      { id: app.id, status, reason, previous: app.status },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change status</DialogTitle>
          <DialogDescription>
            {app.companyName} — {app.jobTitle}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Current <StatusBadge status={app.status} />
          </div>
          <div role="radiogroup" aria-label="New status" className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {ALL_STATUSES.map((s) => {
              const m = STATUS_META[s];
              const active = status === s;
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setStatus(s)}
                  className={cn(
                    'flex h-8 items-center gap-2 rounded-md border px-2.5 text-xs font-medium transition-colors focus-ring',
                    active ? cn(HUE_CLASSES[m.hue].bg, HUE_CLASSES[m.hue].border, 'text-foreground') : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  <span className={cn('size-1.5 rounded-full', HUE_CLASSES[m.hue].dot)} />
                  {m.label}
                  {s === app.status && <span className="ml-auto text-[10px] text-subtle">now</span>}
                </button>
              );
            })}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status-reason">Reason (optional)</Label>
            <Input
              id="status-reason"
              value={reason}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Recruiter called to schedule onsite"
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} loading={update.isPending} disabled={status === app.status}>
            Update status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
