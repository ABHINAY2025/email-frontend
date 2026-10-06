import { Link } from 'react-router-dom';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Briefcase, LayoutList, Mail, Plus, SearchX, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Segmented } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip } from '@/components/ui/tooltip';
import { Spinner } from '@/components/ui/kbd';
import { ApplicationsTable, type AppColumn } from '@/components/applications/applications-table';
import { ApplicationsCompactList } from '@/components/applications/compact-list';
import {
  ActiveFilterChips,
  CompanyFilter,
  DateRangeFilter,
  MoreFilters,
  SearchFilter,
  SORT_OPTIONS,
  StatusFilter,
  useApplicationParams,
} from '@/components/applications/filters';
import { Pagination } from '@/components/common/pagination';
import { EmptyState, ErrorState } from '@/components/common/states';
import { Page, PageHeader } from '@/components/layout/page';
import { useAppUI } from '@/hooks/use-app-ui';
import { useApplicationFacets, useApplications } from '@/hooks/use-applications';
import type { ApplicationSort } from '@/types/api';

const COLUMNS: AppColumn[] = [
  'displayId',
  'company',
  'jobTitle',
  'location',
  'appliedAt',
  'status',
  'lastActivity',
  'emails',
  'source',
  'emailAccount',
  'actions',
];

export default function ApplicationsPage() {
  const { query, update, clearFilters, activeFilterCount, view } = useApplicationParams();
  const facets = useApplicationFacets();
  const list = useApplications(query);
  const { openAddApplication } = useAppUI();

  const data = list.data;
  const filtered = activeFilterCount > 0;
  const showEmpty = data && data.totalElements === 0;

  return (
    <Page>
      <PageHeader
        title="Applications"
        description={
          data ? (
            <span className="tabular">
              {data.totalElements.toLocaleString()} {query.archived ? 'archived ' : ''}application{data.totalElements === 1 ? '' : 's'}
              {filtered ? ' matching filters' : ''}
            </span>
          ) : (
            'All the roles you are tracking.'
          )
        }
        actions={
          <Button onClick={() => openAddApplication()}>
            <Plus /> Add application
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="mb-3 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <SearchFilter value={query.q ?? ''} onChange={(v) => update({ q: v || null })} />
          <StatusFilter value={query.status ?? []} onChange={(v) => update({ status: v.join(',') || null })} />
          <CompanyFilter facets={facets.data} value={query.companyId} onChange={(v) => update({ companyId: v })} />
          <DateRangeFilter from={query.from} to={query.to} update={update} />
          <MoreFilters query={query} facets={facets.data} update={update} />

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {list.isFetching && !list.isLoading && <Spinner />}
            <div className="flex items-center gap-1.5">
              <Switch id="show-archived" checked={!!query.archived} onCheckedChange={(v) => update({ archived: v ? 'true' : null })} />
              <Label htmlFor="show-archived" className="cursor-pointer text-xs font-normal text-muted-foreground">
                Show archived
              </Label>
            </div>
            <div className="flex items-center">
              <Select value={query.sort} onValueChange={(v) => update({ sort: v as ApplicationSort }, { keepPage: true })}>
                <SelectTrigger size="sm" className="h-8 w-[136px] rounded-r-none" aria-label="Sort by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Tooltip content={query.dir === 'asc' ? 'Ascending' : 'Descending'}>
                <Button
                  variant="outline"
                  size="icon"
                  className="-ml-px rounded-l-none"
                  onClick={() => update({ dir: query.dir === 'asc' ? 'desc' : 'asc' }, { keepPage: true })}
                  aria-label="Toggle sort direction"
                >
                  {query.dir === 'asc' ? <ArrowUpNarrowWide /> : <ArrowDownWideNarrow />}
                </Button>
              </Tooltip>
            </div>
            <Segmented
              value={view}
              onValueChange={(v) => update({ view: v === 'table' ? null : v }, { keepPage: true })}
              options={[
                { value: 'table', label: <span className="sr-only">Table</span>, icon: Table2, title: 'Table view' },
                { value: 'compact', label: <span className="sr-only">Compact list</span>, icon: LayoutList, title: 'Compact list' },
              ]}
            />
          </div>
        </div>
        <ActiveFilterChips query={query} facets={facets.data} update={update} clear={clearFilters} />
      </div>

      <Card className="overflow-hidden">
        {list.isError ? (
          <ErrorState error={list.error} onRetry={() => list.refetch()} />
        ) : showEmpty && filtered ? (
          <EmptyState
            icon={SearchX}
            title="No applications match these filters"
            description="Try removing a filter or broadening your search."
            actions={
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : showEmpty && query.archived ? (
          <EmptyState icon={Briefcase} title="No archived applications" description="Applications you archive will be kept here." />
        ) : showEmpty ? (
          <EmptyState
            icon={Mail}
            title="No applications yet."
            description="Connect an email account and we'll automatically detect your job applications."
            actions={
              <>
                <Button size="sm" asChild>
                  <Link to="/settings/email-accounts">Connect Email</Link>
                </Button>
                <Button size="sm" variant="outline" onClick={() => openAddApplication()}>
                  Add manually
                </Button>
              </>
            }
          />
        ) : view === 'compact' ? (
          <ApplicationsCompactList apps={data?.content} loading={list.isLoading} />
        ) : (
          <ApplicationsTable apps={data?.content} columns={COLUMNS} loading={list.isLoading} skeletonRows={12} allowDelete />
        )}
      </Card>

      {data && data.totalElements > 0 && (
        <Pagination
          className="mt-3"
          page={data.page}
          size={data.size}
          totalElements={data.totalElements}
          totalPages={data.totalPages}
          onPageChange={(p) => {
            update({ page: p > 0 ? String(p + 1) : null });
            document.getElementById('main')?.scrollTo({ top: 0 });
          }}
        />
      )}
    </Page>
  );
}
