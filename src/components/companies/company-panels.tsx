import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ExternalLink, Mail } from 'lucide-react';
import { ClassificationBadge, StatusTransition } from '@/components/common/badges';
import { Field, NotDetected, RelativeTime } from '@/components/common/data-display';
import { days, percent } from '@/lib/format';
import { cn, safeUrl } from '@/lib/utils';
import type { ActivityItem, CompanyDetail, Contact, InboxItem } from '@/types/api';

/** Recent emails: unread dot · subject · sender · classification · time. */
export function RecentEmailsList({ emails }: { emails: InboxItem[] }) {
  const navigate = useNavigate();
  if (emails.length === 0) return <p className="px-4 py-6 text-center text-xs text-muted-foreground">No emails from this company yet.</p>;
  return (
    <ul className="divide-y divide-border/70">
      {emails.map((e) => {
        const open = () => navigate(`/inbox?email=${e.id}`);
        return (
          <li key={e.id}>
            <div
              role="link"
              tabIndex={0}
              onClick={open}
              onKeyDown={(ev) => ev.key === 'Enter' && open()}
              className="focus-ring flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors duration-150 hover:bg-accent/40"
            >
              <span
                className={cn('size-1.5 shrink-0 rounded-full', e.isRead ? 'bg-transparent' : 'bg-primary')}
                aria-label={e.isRead ? undefined : 'Unread'}
              />
              <div className="min-w-0 flex-1">
                <p className={cn('truncate text-[13px]', e.isRead ? 'text-foreground/90' : 'font-semibold')}>{e.subject || '(no subject)'}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {e.senderName ?? e.senderEmail}
                  {e.applicationJobTitle && <span className="text-subtle"> · {e.applicationJobTitle}</span>}
                </p>
              </div>
              <ClassificationBadge value={e.classification} className="hidden sm:inline-flex" />
              <span className="w-[68px] shrink-0 text-right text-xs text-muted-foreground">
                <RelativeTime value={e.receivedAt} />
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Activity history across the company's applications. */
export function ActivityList({ items }: { items: ActivityItem[] }) {
  const navigate = useNavigate();
  if (items.length === 0) return <p className="px-4 py-6 text-center text-xs text-muted-foreground">No activity recorded yet.</p>;
  return (
    <ol className="divide-y divide-border/70">
      {items.map((a) => {
        const open = () => navigate(`/applications/${a.applicationId}`);
        return (
          <li key={a.id}>
            <div
              role="link"
              tabIndex={0}
              onClick={open}
              onKeyDown={(ev) => ev.key === 'Enter' && open()}
              className="focus-ring grid cursor-pointer grid-cols-[72px_1fr] gap-3 px-4 py-2 transition-colors duration-150 hover:bg-accent/40"
            >
              <span className="pt-px text-xs text-muted-foreground">
                <RelativeTime value={a.occurredAt} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[13px] text-foreground/90">{a.title}</span>
                  {a.newStatus && <StatusTransition from={a.previousStatus} to={a.newStatus} />}
                </div>
                <p className="truncate text-xs text-subtle">
                  {a.jobTitle}
                  {a.actor === 'USER' && ' · by you'}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function ResponseStats({ stats }: { stats: CompanyDetail['responseStats'] }) {
  return (
    <dl className="px-4 py-2">
      <Field label="Response rate">
        <span className="tabular font-medium">{percent(stats.responseRate)}</span>
      </Field>
      <Field label="Avg response">
        {stats.avgResponseDays === null ? <NotDetected label="Not enough data" /> : <span className="tabular">{days(stats.avgResponseDays)}</span>}
      </Field>
      <Field label="Total emails">
        <span className="tabular">{stats.totalEmails.toLocaleString()}</span>
      </Field>
    </dl>
  );
}

export function ContactsList({ contacts }: { contacts: Contact[] }) {
  if (contacts.length === 0) return <p className="px-4 py-5 text-center text-xs text-muted-foreground">No contacts detected.</p>;
  return (
    <ul className="divide-y divide-border/70">
      {contacts.map((c) => (
        <li key={c.id} className="px-4 py-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-[13px] font-medium">{c.name ?? c.email}</p>
            <span className="tabular inline-flex shrink-0 items-center gap-1 text-2xs text-muted-foreground" title={`${c.emailCount} emails`}>
              <Mail className="size-3" />
              {c.emailCount}
            </span>
          </div>
          <p className="truncate text-xs">{c.role ? <span className="text-muted-foreground">{c.role}</span> : <NotDetected label="Role not detected" />}</p>
          <div className="mt-0.5 flex items-baseline justify-between gap-2 text-xs">
            <a href={`mailto:${c.email}`} className="focus-ring min-w-0 truncate rounded text-primary hover:underline">
              {c.email}
            </a>
            <span className="shrink-0 text-2xs text-subtle">
              <RelativeTime value={c.lastContactAt} />
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CompanyDetails({ company }: { company: CompanyDetail }) {
  return (
    <dl className="px-4 py-2">
      <Field label="Domain">{company.domain ? <span>{company.domain}</span> : <NotDetected />}</Field>
      <Field label="Website">
        <WebsiteLink url={company.website} />
      </Field>
      <Field label="Latest activity">
        {company.latestActivityAt ? <RelativeTime value={company.latestActivityAt} /> : <NotDetected label="No activity" />}
      </Field>
    </dl>
  );
}

export function WebsiteLink({ url, className }: { url: string | null; className?: string }) {
  const href = safeUrl(url);
  if (!href) return <NotDetected />;
  const display = href.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('focus-ring inline-flex min-w-0 items-center gap-1 rounded text-primary hover:underline', className)}
    >
      <span className="truncate">{display}</span>
      <ExternalLink className="size-3 shrink-0" />
    </a>
  );
}

export function BackToCompanies() {
  return (
    <Link
      to="/companies"
      className="focus-ring -ml-1 inline-flex items-center gap-0.5 rounded pr-1 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground"
    >
      <ChevronLeft className="size-3.5" />
      Companies
    </Link>
  );
}
