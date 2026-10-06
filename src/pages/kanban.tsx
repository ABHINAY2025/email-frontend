import * as React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Mail, Plus, Search, SquareKanban, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/kbd';
import { EmptyState, ErrorState } from '@/components/common/states';
import { KanbanBoard, KanbanBoardSkeleton } from '@/components/kanban/kanban-board';
import { applicationsApi } from '@/api/applications';
import { useAppUI } from '@/hooks/use-app-ui';
import { useBoardApplications } from '@/hooks/use-applications';
import { qk } from '@/lib/query-keys';
import { pluralize } from '@/lib/utils';
import type { ApplicationSummary } from '@/types/api';

const ALL_COMPANIES = '__all';

export default function KanbanPage() {
  const { openAddApplication } = useAppUI();
  const [hideArchived, setHideArchived] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [company, setCompany] = React.useState<string>(ALL_COMPANIES);

  const active = useBoardApplications(false);
  // Same key / fn as useBoardApplications(true) so optimistic status patches apply; only fetched when needed.
  const archived = useQuery({
    queryKey: qk.applications.board(true),
    queryFn: () => applicationsApi.listAll({ archived: true, sort: 'lastActivityAt', dir: 'desc' }),
    enabled: !hideArchived,
  });

  const apps = React.useMemo<ApplicationSummary[]>(() => {
    const base = active.data ?? [];
    if (hideArchived || !archived.data) return base;
    const seen = new Set(base.map((a) => a.id));
    return [...base, ...archived.data.filter((a) => !seen.has(a.id))];
  }, [active.data, archived.data, hideArchived]);

  const companies = React.useMemo(() => {
    const map = new Map<number, string>();
    for (const a of apps) map.set(a.companyId, a.companyName);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [apps]);

  // Drop a company filter that no longer exists in the data.
  React.useEffect(() => {
    if (company !== ALL_COMPANIES && apps.length > 0 && !companies.some(([id]) => String(id) === company)) {
      setCompany(ALL_COMPANIES);
    }
  }, [companies, company, apps.length]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return apps.filter((a) => {
      if (company !== ALL_COMPANIES && String(a.companyId) !== company) return false;
      if (!q) return true;
      return [a.companyName, a.jobTitle, a.location ?? '', a.displayId].some((v) => v.toLowerCase().includes(q));
    });
  }, [apps, search, company]);

  const loading = active.isPending || (!hideArchived && archived.isPending);
  const error = active.error ?? (!hideArchived ? archived.error : null);
  const fetching = (active.isFetching || archived.isFetching) && !loading;
  const filtering = search.trim() !== '' || company !== ALL_COMPANIES;
  const noData = !loading && !error && apps.length === 0;

  const retry = () => {
    void active.refetch();
    if (!hideArchived) void archived.refetch();
  };

  return (
    <div className="flex h-[calc(100dvh-48px)] min-h-[440px] flex-col">
      {/* Header + filters */}
      <div className="shrink-0 px-4 pb-3 pt-5 md:px-6 lg:px-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              Board
              {fetching && <Spinner />}
            </h1>
            <p className="mt-0.5 hidden text-[13px] text-muted-foreground sm:block">
              Drag cards between columns to update an application's status.
            </p>
          </div>
          <Button size="sm" onClick={() => openAddApplication()}>
            <Plus /> <span className="hidden sm:inline">Add application</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setSearch('')}
              placeholder="Filter by company, title, location, ID…"
              aria-label="Filter applications"
              className="h-7 pl-8 pr-7 text-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear filter"
                className="focus-ring absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-subtle hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          <Select value={company} onValueChange={setCompany}>
            <SelectTrigger size="sm" className="w-auto min-w-[148px] max-w-[220px]" aria-label="Company">
              <SelectValue placeholder="All companies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_COMPANIES}>All companies</SelectItem>
              {companies.length > 0 && <SelectSeparator />}
              {companies.map(([id, name]) => (
                <SelectItem key={id} value={String(id)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex h-7 items-center gap-2 rounded-md border bg-card px-2.5">
            <Switch id="kanban-hide-archived" checked={hideArchived} onCheckedChange={setHideArchived} />
            <Label htmlFor="kanban-hide-archived" className="cursor-pointer text-xs font-normal text-muted-foreground">
              Hide archived
            </Label>
          </div>

          {filtering && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setCompany(ALL_COMPANIES);
              }}
            >
              Reset
            </Button>
          )}

          {!loading && !error && (
            <span className="tabular ml-auto text-xs text-muted-foreground">
              {filtering ? `${filtered.length} of ${pluralize(apps.length, 'application')}` : pluralize(apps.length, 'application')}
            </span>
          )}
        </div>
      </div>

      {/* Board */}
      <div className="min-h-0 flex-1">
        {error ? (
          <div className="px-4 md:px-6 lg:px-8">
            <div className="rounded-xl border bg-card">
              <ErrorState error={error} onRetry={retry} title="Could not load the board" />
            </div>
          </div>
        ) : noData ? (
          <div className="px-4 md:px-6 lg:px-8">
            <div className="rounded-xl border bg-card">
              <EmptyState
                icon={SquareKanban}
                title={hideArchived ? 'No applications yet' : 'No applications'}
                description="Connect an email account to detect applications automatically, or add one manually."
                actions={
                  <>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/settings/email-accounts">
                        <Mail /> Connect email
                      </Link>
                    </Button>
                    <Button size="sm" onClick={() => openAddApplication()}>
                      <Plus /> Add application
                    </Button>
                  </>
                }
              />
            </div>
          </div>
        ) : (
          <div className="h-full overflow-x-auto overflow-y-hidden px-4 pb-4 md:px-6 lg:px-8">
            {loading ? <KanbanBoardSkeleton /> : <KanbanBoard apps={filtered} />}
          </div>
        )}
      </div>
    </div>
  );
}
