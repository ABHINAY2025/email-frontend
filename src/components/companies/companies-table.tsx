import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RelativeTime } from '@/components/common/data-display';
import { CompanyAvatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { CompanySummary, SortDir } from '@/types/api';

export type CompanySortKey = 'name' | 'applications' | 'active' | 'interviews' | 'offers' | 'rejected' | 'latestActivityAt';

export interface CompanySort {
  key: CompanySortKey;
  dir: SortDir;
}

const COLUMNS: { key: CompanySortKey; label: string; numeric?: boolean; className?: string }[] = [
  { key: 'name', label: 'Company', className: 'min-w-[220px]' },
  { key: 'applications', label: 'Applications', numeric: true, className: 'w-[110px]' },
  { key: 'active', label: 'Active', numeric: true, className: 'w-[80px]' },
  { key: 'interviews', label: 'Interviews', numeric: true, className: 'w-[96px]' },
  { key: 'offers', label: 'Offers', numeric: true, className: 'w-[80px]' },
  { key: 'rejected', label: 'Rejected', numeric: true, className: 'w-[88px]' },
  { key: 'latestActivityAt', label: 'Latest activity', className: 'w-[128px]' },
];

/** Client-side comparator. Nulls (no activity) always sort last. */
export function sortCompanies(list: CompanySummary[], sort: CompanySort): CompanySummary[] {
  const mul = sort.dir === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => {
    let r: number;
    switch (sort.key) {
      case 'name':
        r = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        break;
      case 'latestActivityAt': {
        const av = a.latestActivityAt ? Date.parse(a.latestActivityAt) : null;
        const bv = b.latestActivityAt ? Date.parse(b.latestActivityAt) : null;
        if (av === null && bv === null) r = 0;
        else if (av === null) return 1;
        else if (bv === null) return -1;
        else r = av - bv;
        break;
      }
      default:
        r = a[sort.key] - b[sort.key];
    }
    return r * mul || a.name.localeCompare(b.name);
  });
}

/** Default direction when a column is first clicked: text asc, numbers/dates desc. */
export const defaultDir = (key: CompanySortKey): SortDir => (key === 'name' ? 'asc' : 'desc');

export function CompaniesTable({
  companies,
  loading,
  sort,
  onSortChange,
}: {
  companies: CompanySummary[] | undefined;
  loading: boolean;
  sort: CompanySort;
  onSortChange: (s: CompanySort) => void;
}) {
  const navigate = useNavigate();
  const open = (id: number) => navigate(`/companies/${id}`);

  const toggle = (key: CompanySortKey) =>
    onSortChange(sort.key === key ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: defaultDir(key) });

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((c) => {
                const active = sort.key === c.key;
                const Icon = active ? (sort.dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
                return (
                  <TableHead
                    key={c.key}
                    className={cn(c.className, c.numeric && 'text-right')}
                    aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(c.key)}
                      className={cn(
                        'focus-ring group/sort -mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 uppercase tracking-[0.06em] transition-colors duration-150 hover:text-foreground',
                        c.numeric && 'flex-row-reverse',
                        active && 'text-foreground',
                      )}
                    >
                      {c.label}
                      <Icon
                        className={cn(
                          'size-3 transition-opacity duration-150',
                          active ? 'opacity-100' : 'opacity-0 group-hover/sort:opacity-60 group-focus-visible/sort:opacity-60',
                        )}
                        aria-hidden
                      />
                    </button>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !companies
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    {COLUMNS.map((c) => (
                      <TableCell key={c.key} className={cn(c.numeric && 'text-right')}>
                        {c.key === 'name' ? (
                          <div className="flex items-center gap-2">
                            <Skeleton className="size-6" />
                            <Skeleton className="h-3.5 w-32" />
                          </div>
                        ) : (
                          <Skeleton className={cn('h-3.5', c.numeric ? 'ml-auto w-6' : 'w-16')} />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : companies?.map((co) => (
                  <TableRow
                    key={co.id}
                    tabIndex={0}
                    className="focus-ring cursor-pointer"
                    onClick={() => open(co.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') open(co.id);
                    }}
                  >
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <CompanyAvatar name={co.name} size="sm" />
                        <span className="truncate font-medium">{co.name}</span>
                        {co.domain && <span className="truncate text-xs text-subtle">{co.domain}</span>}
                      </div>
                    </TableCell>
                    <NumCell value={co.applications} strong />
                    <NumCell value={co.active} />
                    <NumCell value={co.interviews} />
                    <NumCell value={co.offers} />
                    <NumCell value={co.rejected} />
                    <TableCell className="text-muted-foreground">
                      <RelativeTime value={co.latestActivityAt} />
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <ul className="divide-y md:hidden">
        {loading && !companies
          ? Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex gap-3 px-4 py-3">
                <Skeleton className="size-7" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </li>
            ))
          : companies?.map((co) => (
              <li key={co.id}>
                <div
                  role="link"
                  tabIndex={0}
                  onClick={() => open(co.id)}
                  onKeyDown={(e) => e.key === 'Enter' && open(co.id)}
                  className="focus-ring flex gap-3 px-4 py-3 transition-colors active:bg-accent/60"
                >
                  <CompanyAvatar name={co.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-[13px] font-medium">{co.name}</p>
                      <span className="shrink-0 text-2xs text-subtle">
                        <RelativeTime value={co.latestActivityAt} />
                      </span>
                    </div>
                    {co.domain && <p className="truncate text-xs text-muted-foreground">{co.domain}</p>}
                    <div className="tabular mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-2xs text-muted-foreground">
                      <span>
                        <span className="font-medium text-foreground">{co.applications}</span> apps
                      </span>
                      <span>{co.active} active</span>
                      <span>{co.interviews} interviews</span>
                      <span>{co.offers} offers</span>
                      <span>{co.rejected} rejected</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
      </ul>
    </>
  );
}

function NumCell({ value, strong }: { value: number; strong?: boolean }) {
  return (
    <TableCell className={cn('tabular text-right', value === 0 ? 'text-subtle' : strong ? 'font-medium' : 'text-foreground/90')}>
      {value.toLocaleString()}
    </TableCell>
  );
}
