import type * as React from 'react';
import { Building2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ApplicationsTable } from '@/components/applications/applications-table';
import {
  ActivityList,
  BackToCompanies,
  CompanyDetails,
  ContactsList,
  RecentEmailsList,
  ResponseStats,
  WebsiteLink,
} from '@/components/companies/company-panels';
import { StatusStack } from '@/components/companies/status-stack';
import { StatTile } from '@/components/common/stat-tile';
import { EmptyState, ErrorState } from '@/components/common/states';
import { Page } from '@/components/layout/page';
import { CompanyAvatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompany } from '@/hooks/use-queries';
import { ApiClientError } from '@/lib/api';
import { percent } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const companyId = Number(id);
  const valid = Number.isInteger(companyId) && companyId > 0;
  const { data: c, isPending, error, refetch } = useCompany(valid ? companyId : Number.NaN);

  const notFound = !valid || (error instanceof ApiClientError && error.status === 404);

  if (notFound) {
    return (
      <Page>
        <BackToCompanies />
        <Card className="mt-3">
          <EmptyState
            icon={Building2}
            title="Company not found"
            description="This company doesn't exist or was removed along with its applications."
            actions={
              <Button variant="outline" size="sm" asChild>
                <Link to="/companies">Back to companies</Link>
              </Button>
            }
          />
        </Card>
      </Page>
    );
  }

  if (error && !c) {
    return (
      <Page>
        <BackToCompanies />
        <Card className="mt-3">
          <ErrorState error={error} onRetry={() => void refetch()} title="Could not load this company" />
        </Card>
      </Page>
    );
  }

  if (isPending || !c) return <CompanyDetailSkeleton />;

  return (
    <Page>
      <BackToCompanies />

      <header className="mb-5 mt-3 flex min-w-0 items-center gap-3.5">
        <CompanyAvatar name={c.name} size="xl" />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight">{c.name}</h1>
          <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            {c.domain ? <span className="truncate">{c.domain}</span> : null}
            {c.domain && c.website && <span className="text-subtle">·</span>}
            {c.website ? <WebsiteLink url={c.website} /> : !c.domain && <span className="italic text-subtle">Domain not detected</span>}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Applications" value={c.applications.length.toLocaleString()} />
        <StatTile label="Active" value={c.active.toLocaleString()} />
        <StatTile label="Interviews" value={c.interviews.toLocaleString()} />
        <StatTile label="Offers" value={c.offers.toLocaleString()} />
        <StatTile label="Rejected" value={c.rejected.toLocaleString()} />
        <StatTile label="Response rate" value={percent(c.responseStats.responseRate)} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-3">
          <Section title="Status distribution">
            <div className="px-4 py-3">
              <StatusStack distribution={c.statusDistribution} />
            </div>
          </Section>

          <Section title="Applications" count={c.applications.length}>
            {c.applications.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">No applications for this company.</p>
            ) : (
              <ApplicationsTable
                apps={c.applications}
                columns={['displayId', 'jobTitle', 'location', 'appliedAt', 'status', 'lastActivity', 'emails', 'actions']}
              />
            )}
          </Section>

          <Section title="Recent emails" count={c.recentEmails.length}>
            <RecentEmailsList emails={c.recentEmails} />
          </Section>

          <Section title="Activity" count={c.history.length}>
            <ActivityList items={c.history} />
          </Section>
        </div>

        <aside className="min-w-0 space-y-3">
          <Section title="Response statistics">
            <ResponseStats stats={c.responseStats} />
          </Section>
          <Section title="Contacts" count={c.contacts.length}>
            <ContactsList contacts={c.contacts} />
          </Section>
          <Section title="Details">
            <CompanyDetails company={c} />
          </Section>
        </aside>
      </div>
    </Page>
  );
}

function Section({ title, count, children, className }: { title: string; count?: number; children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader
        title={title}
        actions={count !== undefined && count > 0 ? <span className="tabular text-xs text-muted-foreground">{count.toLocaleString()}</span> : undefined}
      />
      {children}
    </Card>
  );
}

function CompanyDetailSkeleton() {
  return (
    <Page>
      <Skeleton className="h-4 w-24" />
      <div className="mb-5 mt-3 flex items-center gap-3.5">
        <Skeleton className="size-12 rounded-[10px]" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3.5 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatTile key={i} label="" value="" loading />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3">
          <Card className="overflow-hidden">
            <CardHeader title={<Skeleton className="h-3.5 w-32" />} />
            <div className="space-y-3 px-4 py-3">
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-3" />
                ))}
              </div>
            </div>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader title={<Skeleton className="h-3.5 w-24" />} />
            <ApplicationsTable
              apps={undefined}
              loading
              skeletonRows={4}
              columns={['displayId', 'jobTitle', 'location', 'appliedAt', 'status', 'lastActivity', 'emails', 'actions']}
            />
          </Card>
        </div>
        <div className="space-y-3">
          {[3, 2, 3].map((n, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader title={<Skeleton className="h-3.5 w-28" />} />
              <div className="space-y-2.5 px-4 py-3">
                {Array.from({ length: n }).map((_, j) => (
                  <Skeleton key={j} className="h-3.5" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Page>
  );
}
