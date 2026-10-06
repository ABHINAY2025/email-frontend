import { useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  ArrowRightLeft,
  CalendarDays,
  ChevronDown,
  CircleAlert,
  ExternalLink,
  FileQuestion,
  GitMerge,
  History,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  StickyNote,
  Trash2,
  Workflow,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompanyAvatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip } from '@/components/ui/tooltip';
import { StatusBadge, StatusDot } from '@/components/common/badges';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { DisplayId, RelativeTime } from '@/components/common/data-display';
import { EmptyState, ErrorState } from '@/components/common/states';
import { AuditHistory } from '@/components/applications/detail/audit-history';
import { ChangeStatusDialog } from '@/components/applications/detail/change-status-dialog';
import { DetailsSidebar } from '@/components/applications/detail/details-sidebar';
import { EditDetailsDialog } from '@/components/applications/detail/edit-details-dialog';
import { EmailsSection } from '@/components/applications/detail/emails-section';
import { MergeDialog } from '@/components/applications/detail/merge-dialog';
import { NotesSection } from '@/components/applications/detail/notes-section';
import { ApplicationTimeline } from '@/components/applications/detail/timeline';
import { Page } from '@/components/layout/page';
import {
  useApplication,
  useApplicationEmails,
  useArchiveApplication,
  useDeleteApplication,
} from '@/hooks/use-applications';
import { ApiClientError } from '@/lib/api';
import { mediumDate } from '@/lib/format';
import { ALL_STATUSES } from '@/lib/status';
import { safeUrl } from '@/lib/utils';
import type { ApplicationStatus } from '@/types/api';

type Tab = 'timeline' | 'emails' | 'notes' | 'history';
const TABS: Tab[] = ['timeline', 'emails', 'notes', 'history'];

export default function ApplicationDetailPage() {
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const q = useApplication(id);
  const emails = useApplicationEmails(id);
  const archive = useArchiveApplication();
  const del = useDeleteApplication();
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const [statusDialog, setStatusDialog] = useState<{ open: boolean; status: ApplicationStatus | null }>({ open: false, status: null });
  const [editOpen, setEditOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const tabParam = params.get('tab') as Tab | null;
  const tab: Tab = tabParam && TABS.includes(tabParam) ? tabParam : 'timeline';
  const expandedEmail = params.get('email') ? Number(params.get('email')) : null;

  const setTab = (t: Tab, extra: Record<string, string | null> = {}) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (t === 'timeline') next.delete('tab');
        else next.set('tab', t);
        for (const [k, v] of Object.entries(extra)) v === null ? next.delete(k) : next.set(k, v);
        return next;
      },
      { replace: true },
    );

  const openEmail = (emailId: number) => setTab('emails', { email: String(emailId) });

  if (!Number.isFinite(id) || (q.error instanceof ApiClientError && q.error.status === 404)) {
    return (
      <Page>
        <EmptyState
          className="py-24"
          icon={FileQuestion}
          title="Application not found"
          description="It may have been deleted or merged into another application."
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link to="/applications">
                <ArrowLeft /> Back to applications
              </Link>
            </Button>
          }
        />
      </Page>
    );
  }

  if (q.isError)
    return (
      <Page>
        <ErrorState error={q.error} onRetry={() => q.refetch()} title="Could not load this application" />
      </Page>
    );

  if (q.isLoading || !q.data) return <DetailSkeleton />;

  const app = q.data;
  const jobUrl = safeUrl(app.jobUrl);
  const latestEmail = emails.data?.length ? emails.data[emails.data.length - 1] : null;
  const emailCount = emails.data?.length ?? app.emailCount;

  return (
    <Page className="max-w-[1320px]">
      <Link to="/applications" className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Applications
      </Link>

      {/* Header */}
      <header className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-3.5">
          <CompanyAvatar name={app.companyName} size="xl" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
              <Link to={`/companies/${app.companyId}`} className="font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline">
                {app.companyName}
              </Link>
              <DisplayId id={app.displayId} />
              {app.archived && <span className="rounded border px-1.5 text-2xs text-muted-foreground">Archived</span>}
            </div>
            <h1 className="mt-0.5 text-xl font-semibold leading-tight tracking-tight md:text-[22px]">{app.jobTitle}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-muted-foreground">
              <StatusBadge status={app.status} />
              {app.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" /> {app.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5" /> Applied {app.appliedAt ? mediumDate(app.appliedAt) : '—'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Workflow className="size-3.5" /> Last activity <RelativeTime value={app.lastActivityAt} />
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
          <Tooltip content={jobUrl ? 'Open the job posting' : 'No job URL detected'}>
            <span tabIndex={jobUrl ? -1 : 0}>
              {jobUrl ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={jobUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink /> Open Job
                  </a>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <ExternalLink /> Open Job
                </Button>
              )}
            </span>
          </Tooltip>
          <Tooltip content={latestEmail ? 'Show the latest email' : 'No emails linked'}>
            <span tabIndex={latestEmail ? -1 : 0}>
              <Button variant="outline" size="sm" disabled={!latestEmail} onClick={() => latestEmail && openEmail(latestEmail.id)}>
                <Mail /> Open Email
              </Button>
            </span>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowRightLeft /> Change Status <ChevronDown className="!size-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Move to</DropdownMenuLabel>
              {ALL_STATUSES.map((s) => (
                <DropdownMenuItem key={s} disabled={s === app.status} onSelect={() => setStatusDialog({ open: true, status: s })}>
                  <StatusDot status={s} />
                  {s === app.status && <span className="ml-auto text-2xs text-subtle">current</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTab('notes');
              setTimeout(() => notesRef.current?.focus(), 50);
            }}
          >
            <StickyNote /> Add Note
          </Button>
          <Button variant="outline" size="sm" loading={archive.isPending} onClick={() => archive.mutate({ id: app.id, archived: !app.archived })}>
            {!archive.isPending && (app.archived ? <ArchiveRestore /> : <Archive />)}
            {app.archived ? 'Unarchive' : 'Archive'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label="More actions">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                <Pencil /> Edit details
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setMergeOpen(true)}>
                <GitMerge /> Merge into…
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={() => setDeleteOpen(true)}>
                <Trash2 /> Delete application
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {app.needsReview && (
        <div className="mb-4 flex flex-col gap-2 rounded-lg border border-hue-orange/25 bg-hue-orange/[0.07] px-3.5 py-2.5 text-xs sm:flex-row sm:items-center">
          <CircleAlert className="size-4 shrink-0 text-hue-orange" />
          <p className="flex-1 text-foreground/85">
            <span className="font-medium text-foreground">Needs review.</span> Some details or a status change were detected with low confidence.
            Check the emails below and correct anything that looks off.
          </p>
          <div className="flex gap-1.5">
            <Button variant="outline" size="xs" onClick={() => setEditOpen(true)}>
              Edit details
            </Button>
            <Button variant="outline" size="xs" asChild>
              <Link to="/inbox?tab=review">Review queue</Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="min-w-0 self-start">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList className="overflow-x-auto px-3 scrollbar-none">
              <TabsTrigger value="timeline">
                <Workflow /> Timeline
              </TabsTrigger>
              <TabsTrigger value="emails">
                <Mail /> Emails <Count n={emailCount} />
              </TabsTrigger>
              <TabsTrigger value="notes">
                <StickyNote /> Notes <Count n={app.notes.length} />
              </TabsTrigger>
              <TabsTrigger value="history">
                <History /> Audit history <Count n={app.statusHistory.length} />
              </TabsTrigger>
            </TabsList>
            <div className="p-4">
              <TabsContent value="timeline">
                <ApplicationTimeline app={app} onOpenEmail={openEmail} />
              </TabsContent>
              <TabsContent value="emails">
                <EmailsSection
                  applicationId={app.id}
                  expandedId={expandedEmail}
                  onToggle={(eid) => setTab('emails', { email: eid === null ? null : String(eid) })}
                />
              </TabsContent>
              <TabsContent value="notes">
                <NotesSection ref={notesRef} applicationId={app.id} notes={app.notes} />
              </TabsContent>
              <TabsContent value="history">
                <AuditHistory entries={app.statusHistory} onOpenEmail={openEmail} />
              </TabsContent>
            </div>
          </Tabs>
        </Card>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
          <DetailsSidebar app={app} onEdit={() => setEditOpen(true)} />
        </aside>
      </div>

      <ChangeStatusDialog
        app={app}
        open={statusDialog.open}
        initialStatus={statusDialog.status}
        onOpenChange={(open) => setStatusDialog((s) => ({ ...s, open }))}
      />
      <EditDetailsDialog app={app} open={editOpen} onOpenChange={setEditOpen} />
      <MergeDialog app={app} open={mergeOpen} onOpenChange={setMergeOpen} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete application?"
        description={`${app.companyName} — ${app.jobTitle} will be permanently deleted along with its timeline, notes, status history and linked emails. This cannot be undone.`}
        confirmLabel="Delete application"
        destructive
        loading={del.isPending}
        onConfirm={async () => {
          try {
            await del.mutateAsync(app.id);
            setDeleteOpen(false);
            navigate('/applications', { replace: true });
          } catch {
            /* toast already shown */
          }
        }}
      />
    </Page>
  );
}

function Count({ n }: { n: number }) {
  return <span className="tabular rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">{n}</span>;
}

function DetailSkeleton() {
  return (
    <Page className="max-w-[1320px]">
      <Skeleton className="mb-4 h-3.5 w-24" />
      <div className="mb-5 flex gap-3.5">
        <Skeleton className="size-12 rounded-[10px]" />
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-6 w-72" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-[480px] rounded-xl" />
        <Skeleton className="h-[480px] rounded-xl" />
      </div>
    </Page>
  );
}
