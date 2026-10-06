import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Inbox as InboxIcon, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Kbd, Spinner } from '@/components/ui/kbd';
import { EmptyState, ErrorState } from '@/components/common/states';
import { InboxListSkeleton, InboxRow } from '@/components/inbox/inbox-list';
import { ReadingPane } from '@/components/inbox/reading-pane';
import { useInboxCounts, useInboxFeed } from '@/hooks/use-inbox';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { INBOX_TABS, isInboxTab } from '@/lib/classification';
import { cn, isTypingTarget } from '@/lib/utils';
import type { InboxTab } from '@/types/api';

const EMPTY_COPY: Record<InboxTab, { title: string; description: string }> = {
  all: { title: 'No job emails yet', description: 'Once your mailbox syncs, application emails show up here automatically.' },
  attention: { title: 'Nothing requires your attention', description: 'Emails that need a reply or action will appear here.' },
  applications: { title: 'No application emails', description: 'Confirmations and application updates will appear here.' },
  recruiters: { title: 'No recruiter emails', description: 'Messages from recruiters will appear here.' },
  interviews: { title: 'No interview emails', description: 'Interview invitations and updates will appear here.' },
  assessments: { title: 'No assessments', description: 'Coding challenges and take-home tasks will appear here.' },
  offers: { title: 'No offers yet', description: 'Keep going — offers will appear here.' },
  rejected: { title: 'No rejections', description: 'Rejection emails will appear here.' },
  review: { title: 'Review queue is empty', description: 'Low-confidence classifications and possible matches will appear here.' },
};

export default function InboxPage() {
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab');
  const tab: InboxTab = isInboxTab(tabParam) ? tabParam : 'all';
  const selectedId = params.get('email') ? Number(params.get('email')) : null;
  const [search, setSearch] = useState(params.get('q') ?? '');
  const q = useDebouncedValue(search.trim(), 250);

  const counts = useInboxCounts();
  const feed = useInboxFeed({ tab, q: q || undefined, size: 50 });
  const items = feed.data?.pages.flatMap((p) => p.content) ?? [];
  const total = feed.data?.pages[0]?.totalElements ?? 0;
  const rowRefs = useRef(new Map<number, HTMLButtonElement>());

  const setParam = (patch: Record<string, string | null>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) v === null || v === '' ? next.delete(k) : next.set(k, v);
        return next;
      },
      { replace: true },
    );

  useEffect(() => {
    if ((params.get('q') ?? '') !== q) setParam({ q: q || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const select = (id: number | null) => setParam({ email: id === null ? null : String(id) });

  // j/k keyboard navigation, u = toggle unread handled in pane via button
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (document.querySelector('[role="dialog"],[role="menu"]')) return;
      if (e.key !== 'j' && e.key !== 'k' && e.key !== 'Escape') return;
      if (e.key === 'Escape') {
        if (selectedId !== null) select(null);
        return;
      }
      if (!items.length) return;
      e.preventDefault();
      const idx = selectedId === null ? -1 : items.findIndex((i) => i.id === selectedId);
      const nextIdx = e.key === 'j' ? Math.min(items.length - 1, idx + 1) : Math.max(0, idx - 1);
      const next = items[nextIdx];
      if (next) {
        select(next.id);
        rowRefs.current.get(next.id)?.scrollIntoView({ block: 'nearest' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, selectedId]);

  /** After an email leaves the current view (ignored/merged/deleted), select the next one. */
  const onRemoved = () => {
    const idx = items.findIndex((i) => i.id === selectedId);
    const next = items[idx + 1] ?? items[idx - 1] ?? null;
    select(next && next.id !== selectedId ? next.id : null);
  };

  return (
    <div className="flex h-[calc(100dvh-48px)] min-h-0 flex-col">
      {/* Tabs */}
      <div className="shrink-0 border-b bg-background">
        <div className="flex items-center gap-1 overflow-x-auto px-3 scrollbar-none md:px-4" role="tablist" aria-label="Inbox views">
          {INBOX_TABS.map((t) => {
            const Icon = t.icon;
            const count = counts.data?.[t.value];
            const active = t.value === tab;
            return (
              <button
                key={t.value}
                role="tab"
                aria-selected={active}
                onClick={() => setParam({ tab: t.value === 'all' ? null : t.value, email: null })}
                className={cn(
                  'relative -mb-px inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40',
                  active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-3.5" />
                {t.label}
                {count !== undefined && count > 0 && (
                  <span
                    className={cn(
                      'tabular rounded px-1 text-[11px] font-medium',
                      t.value === 'review' || t.value === 'attention' ? 'bg-hue-orange/12 text-hue-orange' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* List pane */}
        <section
          className={cn(
            'flex min-h-0 w-full flex-col border-r md:w-[380px] md:shrink-0 xl:w-[420px]',
            selectedId !== null && 'hidden md:flex',
          )}
          aria-label="Email list"
        >
          <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subject, sender, company…"
                className="h-7 pl-8 text-xs"
                aria-label="Search emails"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-subtle hover:text-foreground" aria-label="Clear search">
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            {feed.isFetching && !feed.isFetchingNextPage && !feed.isLoading ? <Spinner /> : null}
          </div>
          <div className="flex shrink-0 items-center justify-between px-3 py-1.5 text-2xs text-subtle">
            <span className="tabular">{feed.data ? `${total.toLocaleString()} email${total === 1 ? '' : 's'}` : ' '}</span>
            <span className="hidden items-center gap-1 md:inline-flex">
              <Kbd>j</Kbd>
              <Kbd>k</Kbd> to navigate
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {feed.isLoading ? (
              <InboxListSkeleton />
            ) : feed.isError ? (
              <ErrorState compact error={feed.error} onRetry={() => feed.refetch()} />
            ) : items.length === 0 ? (
              q ? (
                <EmptyState compact icon={Search} title={`No emails match “${q}”`} actions={<Button variant="outline" size="sm" onClick={() => setSearch('')}>Clear search</Button>} />
              ) : (
                <EmptyState compact icon={InboxIcon} title={EMPTY_COPY[tab].title} description={EMPTY_COPY[tab].description} />
              )
            ) : (
              <>
                <ul className="divide-y border-t">
                  {items.map((item) => (
                    <li key={item.id}>
                      <InboxRow
                        ref={(el) => {
                          if (el) rowRefs.current.set(item.id, el);
                          else rowRefs.current.delete(item.id);
                        }}
                        item={item}
                        selected={item.id === selectedId}
                        onSelect={() => select(item.id)}
                      />
                    </li>
                  ))}
                </ul>
                {feed.hasNextPage && (
                  <div className="p-3">
                    <Button variant="outline" size="sm" className="w-full" loading={feed.isFetchingNextPage} onClick={() => feed.fetchNextPage()}>
                      Load more
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Reading pane */}
        <section className={cn('min-h-0 min-w-0 flex-1 bg-background', selectedId === null && 'hidden md:block')} aria-label="Email">
          <ReadingPane emailId={selectedId} onBack={() => select(null)} onRemoved={onRemoved} />
        </section>
      </div>
    </div>
  );
}
