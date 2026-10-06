import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Inbox, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClassificationBadge } from '@/components/common/badges';
import { RelativeTime } from '@/components/common/data-display';
import { EmailBody } from '@/components/common/email-body';
import { EmptyState, ErrorState } from '@/components/common/states';
import { EmailInsights } from '@/components/inbox/email-insights';
import { useApplicationEmails } from '@/hooks/use-applications';
import { useSetEmailRead } from '@/hooks/use-inbox';
import { fullTimestamp } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { EmailDetail } from '@/types/api';

export function EmailsSection({
  applicationId,
  expandedId,
  onToggle,
}: {
  applicationId: number;
  expandedId: number | null;
  onToggle: (id: number | null) => void;
}) {
  const q = useApplicationEmails(applicationId);
  const setRead = useSetEmailRead();
  const refs = useRef(new Map<number, HTMLLIElement>());

  // Newest first for scanning; the API returns oldest first.
  const emails = q.data ? [...q.data].reverse() : [];

  // Scroll to + mark read when an email is expanded (from the timeline, header or a click)
  useEffect(() => {
    if (expandedId === null || !q.data) return;
    const el = refs.current.get(expandedId);
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    const email = q.data.find((e) => e.id === expandedId);
    if (email && !email.isRead) setRead.mutate({ id: email.id, read: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedId, q.data]);

  if (q.isLoading)
    return (
      <div className="divide-y rounded-lg border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2 px-3 py-3">
            <Skeleton className="h-3.5 w-64" />
            <Skeleton className="h-3 w-96 max-w-full" />
          </div>
        ))}
      </div>
    );
  if (q.isError) return <ErrorState compact error={q.error} onRetry={() => q.refetch()} />;
  if (emails.length === 0)
    return <EmptyState compact icon={Mail} title="No emails linked" description="Emails detected for this application will be listed here." />;

  return (
    <ul className="divide-y overflow-hidden rounded-lg border">
      {emails.map((e) => (
        <li
          key={e.id}
          ref={(el) => {
            if (el) refs.current.set(e.id, el);
            else refs.current.delete(e.id);
          }}
          className="scroll-mt-16"
        >
          <EmailRow email={e} expanded={expandedId === e.id} onToggle={() => onToggle(expandedId === e.id ? null : e.id)} />
        </li>
      ))}
    </ul>
  );
}

function EmailRow({ email: e, expanded, onToggle }: { email: EmailDetail; expanded: boolean; onToggle: () => void }) {
  return (
    <div className={cn(expanded && 'bg-card')}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={cn(
          'flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-accent/40 focus-visible:bg-accent/40 focus-visible:outline-none',
          expanded && 'border-b',
        )}
      >
        <ChevronRight className={cn('mt-0.5 size-3.5 shrink-0 text-subtle transition-transform duration-150', expanded && 'rotate-90')} />
        <span className="mt-1.5 flex w-1.5 shrink-0 justify-center">
          {!e.isRead && <span className="size-1.5 rounded-full bg-primary" aria-label="Unread" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className={cn('truncate text-[13px]', e.isRead ? 'font-medium text-foreground/90' : 'font-semibold')}>{e.subject}</span>
            <span className="ml-auto shrink-0 text-2xs text-subtle">
              <RelativeTime value={e.receivedAt} />
            </span>
          </span>
          <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate">{e.senderName ? `${e.senderName} <${e.senderEmail}>` : e.senderEmail}</span>
            <ClassificationBadge value={e.classification} className="hidden sm:inline-flex" />
          </span>
          {!expanded && e.summary && <span className="mt-1 line-clamp-1 text-xs text-subtle">{e.summary}</span>}
        </span>
      </button>
      {expanded && (
        <div className="space-y-3 px-3 pb-4 pt-3 sm:pl-[42px]">
          <dl className="grid grid-cols-[64px_1fr] gap-x-3 gap-y-0.5 text-xs">
            <dt className="text-muted-foreground">From</dt>
            <dd className="truncate">{e.senderName ? `${e.senderName} <${e.senderEmail}>` : e.senderEmail}</dd>
            {e.recipient && (
              <>
                <dt className="text-muted-foreground">To</dt>
                <dd className="truncate">{e.recipient}</dd>
              </>
            )}
            <dt className="text-muted-foreground">Received</dt>
            <dd className="tabular">{fullTimestamp(e.receivedAt)}</dd>
            {e.emailAccountEmail && (
              <>
                <dt className="text-muted-foreground">Account</dt>
                <dd className="truncate">{e.emailAccountEmail}</dd>
              </>
            )}
          </dl>
          <EmailInsights email={e} />
          <div className="rounded-lg border bg-background/40 p-3">
            <EmailBody html={e.bodyHtml} text={e.bodyText} maxHeight={900} />
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" size="xs" asChild>
              <Link to={`/inbox?email=${e.id}`}>
                <Inbox /> Open in inbox
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
