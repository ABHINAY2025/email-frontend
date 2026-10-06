import { Link } from 'react-router-dom';
import { ExternalLink, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { ProviderMark, StatusBadge } from '@/components/common/badges';
import { Confidence, Field, NotDetected, RelativeTime } from '@/components/common/data-display';
import { mediumDate, salaryRange } from '@/lib/format';
import { safeUrl } from '@/lib/utils';
import type { ApplicationDetail } from '@/types/api';

export function DetailsSidebar({ app, onEdit }: { app: ApplicationDetail; onEdit: () => void }) {
  const salary = salaryRange(app.salaryMin, app.salaryMax, app.salaryCurrency);
  const jobUrl = safeUrl(app.jobUrl);
  return (
    <Card>
      <CardHeader
        title="Details"
        actions={
          <Button variant="ghost" size="xs" onClick={onEdit}>
            <Pencil /> Edit
          </Button>
        }
      />
      <dl className="divide-y divide-border/60 px-4 py-1.5">
        <Field label="Company">
          <Link to={`/companies/${app.companyId}`} className="font-medium hover:underline">
            {app.companyName}
          </Link>
          {app.companyDomain && <span className="block text-xs text-subtle">{app.companyDomain}</span>}
        </Field>
        <Field label="Job title">{app.jobTitle}</Field>
        <Field label="Location">{app.location ?? <NotDetected />}</Field>
        <Field label="Employment">{app.employmentType ?? <NotDetected />}</Field>
        <Field label="Salary">{salary ? <span className="tabular">{salary}</span> : <NotDetected />}</Field>
        <Field label="Job URL">
          {jobUrl ? (
            <a href={jobUrl} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 text-primary hover:underline">
              <span className="truncate">{new URL(jobUrl).hostname.replace(/^www\./, '')}</span>
              <ExternalLink className="size-3 shrink-0" />
            </a>
          ) : (
            <NotDetected />
          )}
        </Field>
        <Field label="Source">{app.source ?? <NotDetected />}</Field>
        <Field label="Applied">{app.appliedAt ? <span className="tabular">{mediumDate(app.appliedAt)}</span> : <NotDetected />}</Field>
        <Field label="Status">
          <div className="flex flex-col items-start gap-1">
            <StatusBadge status={app.status} />
            {app.currentStage && <span className="text-xs text-muted-foreground">{app.currentStage}</span>}
          </div>
        </Field>
        <Field label="Email account">
          {app.emailAccountEmail ? (
            <span className="flex min-w-0 items-center gap-1.5" title={app.emailAccountEmail}>
              <ProviderMark provider={app.provider} />
              <span className="min-w-0 truncate">{app.emailAccountEmail}</span>
            </span>
          ) : (
            <NotDetected label="Added manually" />
          )}
        </Field>
        <Field label="Recruiter">
          {app.recruiterName || app.recruiterEmail ? (
            <span className="flex flex-col">
              {app.recruiterName && <span>{app.recruiterName}</span>}
              {app.recruiterEmail && (
                <a href={`mailto:${app.recruiterEmail}`} className="truncate text-xs text-primary hover:underline">
                  {app.recruiterEmail}
                </a>
              )}
            </span>
          ) : (
            <NotDetected />
          )}
        </Field>
        <Field label="Reference">{app.applicationRef ? <span className="font-mono text-xs">{app.applicationRef}</span> : <NotDetected />}</Field>
        <Field label="Last activity">
          <RelativeTime value={app.lastActivityAt} />
        </Field>
        <Field label="Confidence">{app.confidence !== null ? <Confidence value={app.confidence} /> : <NotDetected />}</Field>
        <Field label="Application ID">
          <span className="font-mono text-xs text-muted-foreground">{app.displayId}</span>
        </Field>
        <Field label="Created">
          <RelativeTime value={app.createdAt} />
        </Field>
      </dl>
    </Card>
  );
}
