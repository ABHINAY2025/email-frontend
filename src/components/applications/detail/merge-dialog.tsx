import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompanyAvatar } from '@/components/ui/avatar';
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
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/common/badges';
import { RelativeTime } from '@/components/common/data-display';
import { ErrorNote } from '@/components/common/states';
import { applicationsApi } from '@/api/applications';
import { invalidateApplicationData, useApplications } from '@/hooks/use-applications';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { errorMessage } from '@/lib/api';
import { qk } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import type { ApplicationDetail } from '@/types/api';

/**
 * "Merge into…": moves this application's emails/events/notes into the chosen target
 * (POST /applications/{target}/merge { sourceApplicationId: this }) and deletes this one.
 */
export function MergeDialog({ app, open, onOpenChange }: { app: ApplicationDetail; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [q, setQ] = useState(app.companyName);
  const [targetId, setTargetId] = useState<number | null>(null);
  const debounced = useDebouncedValue(q.trim(), 200);
  const list = useApplications({ q: debounced || undefined, size: 20, sort: 'lastActivityAt', dir: 'desc' });
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQ(app.companyName);
      setTargetId(null);
    }
  }, [open, app.companyName]);

  const merge = useMutation({
    mutationFn: (target: number) => applicationsApi.merge(target, app.id),
    onSuccess: (merged) => {
      qc.removeQueries({ queryKey: qk.applications.detail(app.id) });
      qc.setQueryData(qk.applications.detail(merged.id), merged);
      invalidateApplicationData(qc, merged.id);
      void qc.invalidateQueries({ queryKey: qk.inbox.all });
      toast.success('Applications merged', { description: `${app.displayId} was merged into ${merged.displayId}.` });
      onOpenChange(false);
      navigate(`/applications/${merged.id}`, { replace: true });
    },
  });

  const candidates = (list.data?.content ?? []).filter((a) => a.id !== app.id);
  const target = candidates.find((c) => c.id === targetId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Merge into another application</DialogTitle>
          <DialogDescription>
            Emails, timeline events and notes from <span className="font-mono">{app.displayId}</span> move into the application you pick. {app.displayId} is then deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          {merge.isError && <ErrorNote>{errorMessage(merge.error)}</ErrorNote>}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" placeholder="Search applications…" autoFocus />
          </div>
          <ul role="listbox" aria-label="Target application" className="max-h-72 divide-y overflow-y-auto rounded-lg border">
            {list.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="p-2.5">
                  <Skeleton className="h-4 w-60" />
                </li>
              ))
            ) : candidates.length === 0 ? (
              <li className="p-4 text-center text-xs text-muted-foreground">No other applications found.</li>
            ) : (
              candidates.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={targetId === c.id}
                    onClick={() => setTargetId(c.id)}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none',
                      targetId === c.id && 'bg-primary/10 hover:bg-primary/10',
                    )}
                  >
                    <CompanyAvatar name={c.companyName} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">
                        {c.companyName} <span className="font-normal text-muted-foreground">· {c.jobTitle}</span>
                      </span>
                      <span className="block text-2xs text-subtle">
                        <span className="font-mono">{c.displayId}</span> · {c.emailCount} emails · <RelativeTime value={c.lastActivityAt} />
                      </span>
                    </span>
                    <StatusBadge status={c.status} />
                  </button>
                </li>
              ))
            )}
          </ul>
          {target && (
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-mono">{app.displayId}</span>
              <ArrowRight className="size-3" />
              <span className="font-mono text-foreground">{target.displayId}</span>
              <span>({target.companyName} — {target.jobTitle})</span>
            </p>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!targetId} loading={merge.isPending} onClick={() => targetId && merge.mutate(targetId)}>
            Merge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
