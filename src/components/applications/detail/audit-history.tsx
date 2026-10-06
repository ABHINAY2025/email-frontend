import { Bot, History, User } from 'lucide-react';
import { StatusTransition } from '@/components/common/badges';
import { Confidence } from '@/components/common/data-display';
import { EmptyState } from '@/components/common/states';
import { fullTimestamp, dateTime } from '@/lib/format';
import type { StatusHistoryEntry } from '@/types/api';

export function AuditHistory({ entries, onOpenEmail }: { entries: StatusHistoryEntry[]; onOpenEmail: (id: number) => void }) {
  if (entries.length === 0)
    return <EmptyState compact icon={History} title="No status history" description="Every status change — automatic or manual — is recorded here." />;
  return (
    <ol className="divide-y overflow-hidden rounded-lg border">
      {entries.map((h) => (
        <li key={h.id} className="flex flex-col gap-1.5 px-3 py-2.5 text-xs sm:flex-row sm:items-center sm:gap-3">
          <time className="tabular w-[120px] shrink-0 text-muted-foreground" dateTime={h.changedAt} title={fullTimestamp(h.changedAt)}>
            {dateTime(h.changedAt)}
          </time>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-foreground/90">
            {h.actor === 'USER' ? <User className="size-3.5 text-muted-foreground" /> : <Bot className="size-3.5 text-muted-foreground" />}
            {h.actor === 'USER' ? 'You changed' : 'System changed'}
          </span>
          <StatusTransition from={h.fromStatus} to={h.toStatus} />
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground sm:justify-end">
            {h.reason && (
              <span className="min-w-0 truncate" title={h.reason}>
                <span className="text-subtle">Reason:</span> {h.reason}
              </span>
            )}
            {h.emailId !== null && (
              <button type="button" className="font-mono text-[11px] text-primary hover:underline" onClick={() => onOpenEmail(h.emailId!)}>
                Email #{h.emailId}
              </button>
            )}
            {h.confidence !== null && <Confidence value={h.confidence} />}
          </span>
        </li>
      ))}
    </ol>
  );
}
