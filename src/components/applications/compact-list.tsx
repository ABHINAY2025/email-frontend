import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { CompanyAvatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/common/badges';
import { RelativeTime } from '@/components/common/data-display';
import { cn } from '@/lib/utils';
import type { ApplicationSummary } from '@/types/api';
import { ApplicationRowActions } from './row-actions';

/** One-line-per-application list; denser than the table. */
export function ApplicationsCompactList({ apps, loading }: { apps: ApplicationSummary[] | undefined; loading?: boolean }) {
  if (loading && !apps)
    return (
      <ul className="divide-y">
        {Array.from({ length: 12 }).map((_, i) => (
          <li key={i} className="flex h-9 items-center gap-3 px-4">
            <Skeleton className="size-5" />
            <Skeleton className="h-3.5 w-64" />
            <Skeleton className="ml-auto h-3.5 w-16" />
          </li>
        ))}
      </ul>
    );
  return (
    <ul className="divide-y">
      {apps?.map((a) => (
        <li key={a.id} className={cn('group relative flex h-9 items-center gap-3 px-4 text-[13px] transition-colors hover:bg-accent/40', a.archived && 'opacity-60')}>
          <Link to={`/applications/${a.id}`} className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50" aria-label={`${a.companyName} — ${a.jobTitle}`} />
          <span className="hidden w-14 shrink-0 font-mono text-[11px] text-subtle sm:inline">{a.displayId}</span>
          <CompanyAvatar name={a.companyName} size="xs" />
          <span className="min-w-0 flex-1 truncate">
            <span className="font-medium">{a.companyName}</span>
            <span className="text-muted-foreground"> · {a.jobTitle}</span>
            {a.location && <span className="hidden text-subtle md:inline"> · {a.location}</span>}
          </span>
          {a.needsReview && <span className="size-1.5 shrink-0 rounded-full bg-hue-orange" title="Needs review" />}
          <span className="tabular hidden w-10 shrink-0 items-center justify-end gap-1 text-xs text-subtle md:inline-flex">
            <Mail className="size-3" />
            {a.emailCount}
          </span>
          <StatusBadge status={a.status} className="shrink-0" />
          <span className="hidden w-16 shrink-0 text-right text-xs text-muted-foreground sm:inline">
            <RelativeTime value={a.lastActivityAt} />
          </span>
          <span className="relative z-[1] opacity-60 group-hover:opacity-100">
            <ApplicationRowActions app={a} allowDelete />
          </span>
        </li>
      ))}
    </ul>
  );
}
