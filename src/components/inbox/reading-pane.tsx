import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Mail, MailOpen, MoreHorizontal, Tags, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompanyAvatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip } from '@/components/ui/tooltip';
import { ClassificationBadge } from '@/components/common/badges';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmailBody } from '@/components/common/email-body';
import { EmptyState, ErrorState } from '@/components/common/states';
import { useDeleteEmail, useEmail, useReclassifyEmail, useSetEmailRead } from '@/hooks/use-inbox';
import { useApplication } from '@/hooks/use-applications';
import { ALL_CLASSIFICATIONS, CLASSIFICATION_META } from '@/lib/classification';
import { fullTimestamp, relativeTime } from '@/lib/format';
import { ApiClientError } from '@/lib/api';
import type { EmailClassification } from '@/types/api';
import { StatusBadge } from '@/components/common/badges';
import { EmailInsights } from './email-insights';
import { MatchReview } from './match-review';

export function ReadingPane({ emailId, onBack, onRemoved }: { emailId: number | null; onBack: () => void; onRemoved: () => void }) {
  const q = useEmail(emailId);
  const setRead = useSetEmailRead();
  const reclassify = useReclassifyEmail();
  const del = useDeleteEmail();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const markedRef = useRef<number | null>(null);

  // Auto mark-as-read once per opened email
  useEffect(() => {
    const e = q.data;
    if (e && !e.isRead && markedRef.current !== e.id) {
      markedRef.current = e.id;
      setRead.mutate({ id: e.id, read: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [emailId]);

  if (emailId === null)
    return <EmptyState className="h-full" icon={Mail} title="No email selected" description="Pick an email from the list to see its summary and details." />;

  if (q.isLoading)
    return (
      <div className="space-y-4 p-5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );

  if (q.isError)
    return q.error instanceof ApiClientError && q.error.status === 404 ? (
      <EmptyState className="h-full" icon={Mail} title="Email not found" description="It may have been deleted or ignored." />
    ) : (
      <ErrorState error={q.error} onRetry={() => q.refetch()} />
    );

  const e = q.data!;
  const sender = e.senderName ? `${e.senderName} <${e.senderEmail}>` : e.senderEmail;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="flex h-11 shrink-0 items-center gap-1 border-b px-2 md:px-3">
        <Button variant="ghost" size="sm" className="md:hidden" onClick={onBack}>
          <ArrowLeft /> Back
        </Button>
        <div className="ml-auto flex items-center gap-1">
          <Tooltip content={e.isRead ? 'Mark as unread' : 'Mark as read'}>
            <Button variant="ghost" size="icon-sm" onClick={() => setRead.mutate({ id: e.id, read: !e.isRead })} aria-label={e.isRead ? 'Mark as unread' : 'Mark as read'}>
              {e.isRead ? <Mail /> : <MailOpen />}
            </Button>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={reclassify.isPending}>
                <Tags /> Reclassify
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Classification</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={e.classification}
                onValueChange={(v) => {
                  if (v !== e.classification) reclassify.mutate({ id: e.id, classification: v as EmailClassification });
                }}
              >
                {ALL_CLASSIFICATIONS.map((c) => {
                  const Icon = CLASSIFICATION_META[c].icon;
                  return (
                    <DropdownMenuRadioItem key={c} value={c}>
                      <Icon /> {CLASSIFICATION_META[c].label}
                    </DropdownMenuRadioItem>
                  );
                })}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="More">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Mail /> Mark as
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onSelect={() => setRead.mutate({ id: e.id, read: true })}>Read</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setRead.mutate({ id: e.id, read: false })}>Unread</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={() => setConfirmDelete(true)}>
                <Trash2 /> Delete email
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[880px] space-y-4 px-4 py-4 md:px-6 md:py-5">
          {/* Subject & meta */}
          <div>
            <h2 className="text-[17px] font-semibold leading-snug tracking-tight">{e.subject}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ClassificationBadge value={e.classification} />
              {e.actionRequired && (
                <span className="inline-flex h-5 items-center rounded-[5px] border border-hue-amber/25 bg-hue-amber/10 px-1.5 text-xs font-medium text-hue-amber">
                  Action required
                </span>
              )}
            </div>
            <dl className="mt-3 grid grid-cols-[64px_1fr] gap-x-3 gap-y-0.5 text-xs">
              <dt className="text-muted-foreground">From</dt>
              <dd className="truncate">{sender}</dd>
              {e.recipient && (
                <>
                  <dt className="text-muted-foreground">To</dt>
                  <dd className="truncate">{e.recipient}</dd>
                </>
              )}
              {e.emailAccountEmail && (
                <>
                  <dt className="text-muted-foreground">Account</dt>
                  <dd className="truncate">{e.emailAccountEmail}</dd>
                </>
              )}
              <dt className="text-muted-foreground">Received</dt>
              <dd className="tabular" title={fullTimestamp(e.receivedAt)}>
                {fullTimestamp(e.receivedAt)} <span className="text-subtle">· {relativeTime(e.receivedAt)}</span>
              </dd>
            </dl>
          </div>

          {e.applicationId !== null && <LinkedApplicationCard applicationId={e.applicationId} fallbackCompany={e.companyName} fallbackTitle={e.applicationJobTitle} />}

          {e.needsReview && <MatchReview email={e} onDone={onRemoved} />}

          <EmailInsights email={e} />

          <div className="rounded-lg border bg-card p-4">
            <EmailBody html={e.bodyHtml} text={e.bodyText} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete email?"
        description="The email is removed from ApplyFlow (not from your mailbox). Its application is kept."
        confirmLabel="Delete"
        destructive
        loading={del.isPending}
        onConfirm={() =>
          del.mutate(e.id, {
            onSuccess: () => {
              setConfirmDelete(false);
              onRemoved();
            },
          })
        }
      />
    </div>
  );
}

function LinkedApplicationCard({ applicationId, fallbackCompany, fallbackTitle }: { applicationId: number; fallbackCompany: string | null; fallbackTitle: string | null }) {
  const app = useApplication(applicationId);
  const company = app.data?.companyName ?? fallbackCompany ?? 'Application';
  return (
    <Link
      to={`/applications/${applicationId}`}
      className="group flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:border-input hover:bg-accent/30 focus-ring"
    >
      <CompanyAvatar name={company} />
      <div className="min-w-0 flex-1">
        <p className="label-caps mb-0.5">Linked application</p>
        <p className="truncate text-[13px] font-medium">
          {company}
          <span className="font-normal text-muted-foreground"> · {app.data?.jobTitle ?? fallbackTitle ?? '—'}</span>
        </p>
      </div>
      {app.data && (
        <>
          <span className="hidden font-mono text-[11px] text-subtle sm:inline">{app.data.displayId}</span>
          <StatusBadge status={app.data.status} />
        </>
      )}
      <ChevronRight className="size-4 text-subtle transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
