import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { CompanyAvatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip } from '@/components/ui/tooltip';
import { StatusBadge } from '@/components/common/badges';
import { DisplayId, RelativeTime } from '@/components/common/data-display';
import { cn } from '@/lib/utils';
import type { ApplicationSummary } from '@/types/api';
import { ApplicationRowActions } from './row-actions';

export type AppColumn =
  | 'displayId'
  | 'company'
  | 'jobTitle'
  | 'location'
  | 'appliedAt'
  | 'status'
  | 'lastActivity'
  | 'source'
  | 'emailAccount'
  | 'emails'
  | 'actions';

export const DEFAULT_COLUMNS: AppColumn[] = [
  'company',
  'jobTitle',
  'location',
  'appliedAt',
  'status',
  'lastActivity',
  'source',
  'emailAccount',
  'actions',
];

const HEAD: Record<AppColumn, { label: string; className?: string }> = {
  displayId: { label: 'ID', className: 'w-[72px]' },
  company: { label: 'Company', className: 'min-w-[160px]' },
  jobTitle: { label: 'Job title', className: 'min-w-[180px]' },
  location: { label: 'Location', className: 'hidden xl:table-cell' },
  appliedAt: { label: 'Applied', className: 'w-[84px]' },
  status: { label: 'Status', className: 'w-[120px]' },
  lastActivity: { label: 'Last activity', className: 'w-[100px] hidden lg:table-cell' },
  source: { label: 'Source', className: 'hidden 2xl:table-cell' },
  emailAccount: { label: 'Email', className: 'hidden 2xl:table-cell' },
  emails: { label: 'Emails', className: 'w-[64px] text-right hidden lg:table-cell' },
  actions: { label: '', className: 'w-[44px]' },
};

/**
 * Dense applications table (desktop) that collapses to stacked cards below `md`.
 */
export function ApplicationsTable({
  apps,
  columns = DEFAULT_COLUMNS,
  loading,
  skeletonRows = 8,
  className,
  allowDelete,
}: {
  apps: ApplicationSummary[] | undefined;
  columns?: AppColumn[];
  loading?: boolean;
  skeletonRows?: number;
  className?: string;
  allowDelete?: boolean;
}) {
  const navigate = useNavigate();
  const open = (id: number) => navigate(`/applications/${id}`);

  return (
    <div className={className}>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c} className={HEAD[c].className}>
                  {HEAD[c].label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !apps
              ? Array.from({ length: skeletonRows }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    {columns.map((c) => (
                      <TableCell key={c} className={HEAD[c].className}>
                        <Skeleton className={cn('h-3.5', c === 'company' ? 'w-28' : c === 'jobTitle' ? 'w-40' : 'w-14')} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : apps?.map((a) => (
                  <TableRow
                    key={a.id}
                    className={cn('group cursor-pointer', a.archived && 'opacity-60')}
                    onClick={() => open(a.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') open(a.id);
                    }}
                    tabIndex={0}
                  >
                    {columns.map((c) => (
                      <TableCell key={c} className={HEAD[c].className}>
                        <Cell column={c} app={a} allowDelete={allowDelete} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <ul className="divide-y md:hidden">
        {loading && !apps
          ? Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex gap-3 px-4 py-3">
                <Skeleton className="size-7" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </li>
            ))
          : apps?.map((a) => (
              <li key={a.id}>
                <div
                  role="link"
                  tabIndex={0}
                  onClick={() => open(a.id)}
                  onKeyDown={(e) => e.key === 'Enter' && open(a.id)}
                  className={cn('flex gap-3 px-4 py-3 transition-colors active:bg-accent/60', a.archived && 'opacity-60')}
                >
                  <CompanyAvatar name={a.companyName} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium">{a.jobTitle}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {a.companyName}
                          {a.location && ` · ${a.location}`}
                        </p>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-2xs text-subtle">
                      <span className="font-mono">{a.displayId}</span>
                      <span>
                        Applied <RelativeTime value={a.appliedAt} mode="date" />
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Mail className="size-3" />
                        {a.emailCount}
                      </span>
                      <span className="ml-auto">
                        <RelativeTime value={a.lastActivityAt} />
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
      </ul>
    </div>
  );
}

function Cell({ column, app: a, allowDelete }: { column: AppColumn; app: ApplicationSummary; allowDelete?: boolean }) {
  switch (column) {
    case 'displayId':
      return <DisplayId id={a.displayId} />;
    case 'company':
      return (
        <div className="flex min-w-0 items-center gap-2">
          <CompanyAvatar name={a.companyName} size="sm" />
          <span className="truncate font-medium">{a.companyName}</span>
          {a.needsReview && (
            <Tooltip content="Needs review — low-confidence detection">
              <span className="size-1.5 shrink-0 rounded-full bg-hue-orange" aria-label="Needs review" />
            </Tooltip>
          )}
        </div>
      );
    case 'jobTitle':
      return <span className="line-clamp-1 text-foreground/90">{a.jobTitle}</span>;
    case 'location':
      return a.location ? (
        <span className="line-clamp-1 text-muted-foreground">{a.location}</span>
      ) : (
        <span className="text-subtle">—</span>
      );
    case 'appliedAt':
      return (
        <span className="text-muted-foreground">
          <RelativeTime value={a.appliedAt} mode="date" />
        </span>
      );
    case 'status':
      return <StatusBadge status={a.status} />;
    case 'lastActivity':
      return (
        <span className="text-muted-foreground">
          <RelativeTime value={a.lastActivityAt} />
        </span>
      );
    case 'source':
      return <span className="text-muted-foreground">{a.source ?? <span className="text-subtle">—</span>}</span>;
    case 'emailAccount':
      return a.emailAccountEmail ? (
        <span className="line-clamp-1 max-w-[180px] text-xs text-muted-foreground">{a.emailAccountEmail}</span>
      ) : (
        <span className="text-subtle">—</span>
      );
    case 'emails':
      return (
        <span className="tabular inline-flex items-center justify-end gap-1 text-muted-foreground">
          <Mail className="size-3" />
          {a.emailCount}
        </span>
      );
    case 'actions':
      return (
        <div className="flex justify-end opacity-60 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <ApplicationRowActions app={a} allowDelete={allowDelete} />
        </div>
      );
  }
}
