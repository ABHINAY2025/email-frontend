import { useMemo, useState } from 'react';
import { Building2, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CompaniesTable, sortCompanies, type CompanySort } from '@/components/companies/companies-table';
import { EmptyState, ErrorState } from '@/components/common/states';
import { Page, PageHeader } from '@/components/layout/page';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { useCompanies } from '@/hooks/use-queries';
import { cn, pluralize } from '@/lib/utils';

export default function CompaniesPage() {
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search.trim(), 200);
  const [sort, setSort] = useState<CompanySort>({ key: 'latestActivityAt', dir: 'desc' });
  const { data, isPending, isFetching, isPlaceholderData, error, refetch } = useCompanies(q);

  const sorted = useMemo(() => (data ? sortCompanies(data, sort) : undefined), [data, sort]);
  const count = data?.length ?? 0;

  return (
    <Page>
      <PageHeader
        title="Companies"
        description={
          data ? (
            <span className="tabular">
              {pluralize(count, 'company', 'companies')}
              {q && ' matching your search'}
            </span>
          ) : (
            'Every employer you have applied to, grouped from your applications.'
          )
        }
      />

      <div className="mb-3 flex items-center gap-2">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSearch('');
            }}
            placeholder="Search companies or domains…"
            aria-label="Search companies"
            className="pl-8 pr-8"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="focus-ring absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-subtle transition-colors hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <Card className={cn('overflow-hidden transition-opacity duration-150', isFetching && isPlaceholderData && 'opacity-70')}>
        {error && !data ? (
          <ErrorState error={error} onRetry={() => void refetch()} title="Could not load companies" />
        ) : !isPending && count === 0 ? (
          q ? (
            <EmptyState
              icon={Search}
              title="No matching companies"
              description={`Nothing matches “${q}”. Try a different name or domain.`}
              actions={
                <Button variant="outline" size="sm" onClick={() => setSearch('')}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Building2}
              title="No companies yet"
              description="Companies are created automatically from detected applications, or when you add an application manually."
              actions={
                <Button variant="outline" size="sm" asChild>
                  <Link to="/applications">Go to applications</Link>
                </Button>
              }
            />
          )
        ) : (
          <CompaniesTable companies={sorted} loading={isPending} sort={sort} onSortChange={setSort} />
        )}
      </Card>
    </Page>
  );
}
