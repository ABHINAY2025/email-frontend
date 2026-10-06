import type * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarRange, Check, ChevronDown, CircleDashed, ListFilter, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusDot } from '@/components/common/badges';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { mediumDate } from '@/lib/format';
import { ALL_STATUSES, BUCKET_META, isApplicationStatus, isBucket } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { ApplicationFacets, ApplicationQuery, ApplicationSort, ApplicationStatus, SortDir } from '@/types/api';

export const PAGE_SIZE = 25;

export const SORT_OPTIONS: { value: ApplicationSort; label: string }[] = [
  { value: 'lastActivityAt', label: 'Last activity' },
  { value: 'appliedAt', label: 'Applied date' },
  { value: 'company', label: 'Company' },
  { value: 'jobTitle', label: 'Job title' },
  { value: 'status', label: 'Status' },
];

const FILTER_KEYS = ['q', 'bucket', 'status', 'companyId', 'from', 'to', 'location', 'source', 'emailAccountId', 'jobTitle'] as const;

/** Parse the URL search params into an ApplicationQuery (the URL is the source of truth). */
export function useApplicationParams() {
  const [params, setParams] = useSearchParams();

  const query = useMemo<ApplicationQuery>(() => {
    const num = (k: string) => {
      const v = params.get(k);
      const n = v ? Number(v) : NaN;
      return Number.isFinite(n) ? n : undefined;
    };
    const bucket = params.get('bucket');
    const sort = params.get('sort') as ApplicationSort | null;
    const status = (params.get('status') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(isApplicationStatus);
    return {
      q: params.get('q') || undefined,
      bucket: bucket && isBucket(bucket) ? bucket : undefined,
      status: status.length ? status : undefined,
      companyId: num('companyId'),
      from: params.get('from') || undefined,
      to: params.get('to') || undefined,
      location: params.get('location') || undefined,
      source: params.get('source') || undefined,
      emailAccountId: num('emailAccountId'),
      jobTitle: params.get('jobTitle') || undefined,
      archived: params.get('archived') === 'true',
      sort: sort && SORT_OPTIONS.some((o) => o.value === sort) ? sort : 'lastActivityAt',
      dir: (params.get('dir') as SortDir) === 'asc' ? 'asc' : 'desc',
      page: Math.max(0, (num('page') ?? 1) - 1),
      size: PAGE_SIZE,
    };
  }, [params]);

  /** Update params; any filter change resets to page 1. */
  const update = (patch: Record<string, string | null | undefined>, opts: { keepPage?: boolean } = {}) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v === null || v === undefined || v === '') next.delete(k);
          else next.set(k, v);
        }
        if (!opts.keepPage && !('page' in patch)) next.delete('page');
        return next;
      },
      { replace: true },
    );
  };

  const clearFilters = () => update(Object.fromEntries(FILTER_KEYS.map((k) => [k, null])));

  const activeFilterCount = FILTER_KEYS.filter((k) => params.get(k)).length;

  return { query, params, update, clearFilters, activeFilterCount, view: params.get('view') === 'compact' ? 'compact' : 'table' } as const;
}

type Update = ReturnType<typeof useApplicationParams>['update'];

export function SearchFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(value);
  const debounced = useDebouncedValue(local, 250);
  useEffect(() => setLocal(value), [value]);
  useEffect(() => {
    if (debounced !== value) onChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);
  return (
    <div className="relative w-full sm:w-64">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
      <Input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="Search company, title, ID…"
        className="pl-8"
        aria-label="Search applications"
      />
      {local && (
        <button
          type="button"
          onClick={() => setLocal('')}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-subtle hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

function FilterButton({ active, children, ...props }: React.ComponentProps<typeof Button> & { active?: boolean }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn('h-8 gap-1.5 border-dashed font-normal text-muted-foreground', active && 'border-solid text-foreground')}
      {...props}
    >
      {children}
    </Button>
  );
}

export function StatusFilter({ value, onChange }: { value: ApplicationStatus[]; onChange: (v: ApplicationStatus[]) => void }) {
  const toggle = (s: ApplicationStatus) => onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s]);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <FilterButton active={value.length > 0}>
          <CircleDashed /> Status
          {value.length > 0 && <span className="tabular rounded bg-primary/15 px-1 text-[11px] font-semibold text-primary">{value.length}</span>}
          <ChevronDown className="!size-3 opacity-60" />
        </FilterButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        {ALL_STATUSES.map((s) => (
          <DropdownMenuCheckboxItem key={s} checked={value.includes(s)} onCheckedChange={() => toggle(s)} onSelect={(e) => e.preventDefault()}>
            <StatusDot status={s} />
          </DropdownMenuCheckboxItem>
        ))}
        {value.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <button type="button" className="h-7 w-full rounded-[5px] px-2 text-left text-xs text-muted-foreground hover:bg-accent" onClick={() => onChange([])}>
              Clear status filter
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const ANY = '__any__';

function FacetSelect({
  label,
  value,
  options,
  onChange,
  id,
}: {
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (v: string | null) => void;
  id: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value ?? ANY} onValueChange={(v) => onChange(v === ANY ? null : v)}>
        <SelectTrigger id={id} size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function CompanyFilter({ facets, value, onChange }: { facets?: ApplicationFacets; value?: number; onChange: (v: string | null) => void }) {
  const current = facets?.companies.find((c) => c.id === value);
  return (
    <Select value={value ? String(value) : ANY} onValueChange={(v) => onChange(v === ANY ? null : v)}>
      <SelectTrigger
        size="sm"
        className={cn('h-8 w-auto max-w-[180px] gap-1.5 border-dashed font-normal text-muted-foreground', value && 'border-solid text-foreground')}
        aria-label="Company filter"
      >
        <span className="truncate">{current ? current.name : 'Company'}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY}>Any company</SelectItem>
        {facets?.companies.map((c) => (
          <SelectItem key={c.id} value={String(c.id)}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function DateRangeFilter({ from, to, update }: { from?: string; to?: string; update: Update }) {
  const [f, setF] = useState(from ?? '');
  const [t, setT] = useState(to ?? '');
  useEffect(() => {
    setF(from ?? '');
    setT(to ?? '');
  }, [from, to]);
  const active = !!(from || to);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <FilterButton active={active}>
          <CalendarRange />
          {active ? `${from ? mediumDate(from) : '…'} – ${to ? mediumDate(to) : '…'}` : 'Applied date'}
        </FilterButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 space-y-3">
        <p className="label-caps">Applied between</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="flt-from">From</Label>
            <Input id="flt-from" type="date" value={f} max={t || undefined} onChange={(e) => setF(e.target.value)} className="h-7 px-1.5 text-xs" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="flt-to">To</Label>
            <Input id="flt-to" type="date" value={t} min={f || undefined} onChange={(e) => setT(e.target.value)} className="h-7 px-1.5 text-xs" />
          </div>
        </div>
        <div className="flex justify-between">
          <Button variant="ghost" size="xs" onClick={() => update({ from: null, to: null })} disabled={!active}>
            Clear
          </Button>
          <Button size="xs" onClick={() => update({ from: f || null, to: t || null })}>
            <Check /> Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function MoreFilters({ query, facets, update }: { query: ApplicationQuery; facets?: ApplicationFacets; update: Update }) {
  const [jobTitle, setJobTitle] = useState(query.jobTitle ?? '');
  useEffect(() => setJobTitle(query.jobTitle ?? ''), [query.jobTitle]);
  const count = [query.location, query.source, query.emailAccountId, query.jobTitle].filter(Boolean).length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <FilterButton active={count > 0}>
          <ListFilter /> More
          {count > 0 && <span className="tabular rounded bg-primary/15 px-1 text-[11px] font-semibold text-primary">{count}</span>}
        </FilterButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-3">
        <FacetSelect
          id="flt-location"
          label="Location"
          value={query.location}
          options={(facets?.locations ?? []).map((l) => ({ value: l, label: l }))}
          onChange={(v) => update({ location: v })}
        />
        <FacetSelect
          id="flt-source"
          label="Source"
          value={query.source}
          options={(facets?.sources ?? []).map((l) => ({ value: l, label: l }))}
          onChange={(v) => update({ source: v })}
        />
        <FacetSelect
          id="flt-account"
          label="Email account"
          value={query.emailAccountId ? String(query.emailAccountId) : undefined}
          options={(facets?.emailAccounts ?? []).map((a) => ({ value: String(a.id), label: a.email }))}
          onChange={(v) => update({ emailAccountId: v })}
        />
        <form
          className="space-y-1"
          onSubmit={(e) => {
            e.preventDefault();
            update({ jobTitle: jobTitle.trim() || null });
          }}
        >
          <Label htmlFor="flt-title">Job title contains</Label>
          <div className="flex gap-1.5">
            <Input id="flt-title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Engineer" className="h-7 text-xs" />
            <Button type="submit" size="xs" variant="outline" className="h-7">
              Apply
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

/** Removable chips for every active filter (including bucket from the dashboard). */
export function ActiveFilterChips({
  query,
  facets,
  update,
  clear,
}: {
  query: ApplicationQuery;
  facets?: ApplicationFacets;
  update: Update;
  clear: () => void;
}) {
  const chips: { key: string; label: React.ReactNode; onRemove: () => void }[] = [];
  if (query.bucket && query.bucket !== 'all')
    chips.push({ key: 'bucket', label: <>Bucket: {BUCKET_META[query.bucket].label}</>, onRemove: () => update({ bucket: null }) });
  if (query.q) chips.push({ key: 'q', label: <>Search: “{query.q}”</>, onRemove: () => update({ q: null }) });
  query.status?.forEach((s) =>
    chips.push({
      key: `status-${s}`,
      label: <StatusDot status={s} />,
      onRemove: () => update({ status: query.status!.filter((x) => x !== s).join(',') || null }),
    }),
  );
  if (query.companyId)
    chips.push({
      key: 'company',
      label: <>Company: {facets?.companies.find((c) => c.id === query.companyId)?.name ?? `#${query.companyId}`}</>,
      onRemove: () => update({ companyId: null }),
    });
  if (query.from || query.to)
    chips.push({
      key: 'date',
      label: (
        <>
          Applied: {query.from ? mediumDate(query.from) : '…'} – {query.to ? mediumDate(query.to) : '…'}
        </>
      ),
      onRemove: () => update({ from: null, to: null }),
    });
  if (query.location) chips.push({ key: 'location', label: <>Location: {query.location}</>, onRemove: () => update({ location: null }) });
  if (query.source) chips.push({ key: 'source', label: <>Source: {query.source}</>, onRemove: () => update({ source: null }) });
  if (query.emailAccountId)
    chips.push({
      key: 'account',
      label: <>Account: {facets?.emailAccounts.find((a) => a.id === query.emailAccountId)?.email ?? `#${query.emailAccountId}`}</>,
      onRemove: () => update({ emailAccountId: null }),
    });
  if (query.jobTitle) chips.push({ key: 'jobTitle', label: <>Title: {query.jobTitle}</>, onRemove: () => update({ jobTitle: null }) });

  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <span key={c.key} className="inline-flex h-6 items-center gap-1 rounded-md border bg-card pl-2 pr-0.5 text-xs">
          <span className="max-w-[240px] truncate">{c.label}</span>
          <button
            type="button"
            onClick={c.onRemove}
            className="rounded p-0.5 text-subtle transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Remove filter"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <Button variant="ghost" size="xs" onClick={clear}>
        Clear filters
      </Button>
    </div>
  );
}

