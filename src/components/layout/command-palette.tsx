import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import {
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  Inbox,
  LayoutDashboard,
  Mail,
  MailPlus,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Settings,
  SquareKanban,
  type LucideIcon,
} from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Kbd, Spinner } from '@/components/ui/kbd';
import { CompanyAvatar } from '@/components/ui/avatar';
import { StatusBadge, ClassificationBadge } from '@/components/common/badges';
import { useAppUI } from '@/hooks/use-app-ui';
import { useSearch, useStartSync } from '@/hooks/use-queries';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { relativeTime } from '@/lib/format';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface Cmd {
  id: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  keywords?: string[];
  run: () => void;
}

export function CommandPalette() {
  const { commandOpen, setCommandOpen, openAddApplication } = useAppUI();
  const navigate = useNavigate();
  const { toggle } = useTheme();
  const startSync = useStartSync();
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query.trim(), 180);
  const search = useSearch(debounced);

  useEffect(() => {
    if (!commandOpen) setQuery('');
  }, [commandOpen]);

  const close = () => setCommandOpen(false);
  const go = (to: string) => {
    close();
    navigate(to);
  };

  const commands: Cmd[] = [
    { id: 'search-apps', label: 'Search applications', icon: Search, keywords: ['find'], run: () => go(`/applications${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`) },
    { id: 'add-app', label: 'Add application', icon: Plus, shortcut: 'C', keywords: ['new', 'create'], run: () => { close(); openAddApplication(); } },
    { id: 'sync', label: 'Sync mail', icon: RefreshCw, keywords: ['refresh', 'imap', 'fetch'], run: () => { close(); startSync.mutate(); } },
    { id: 'dash', label: 'Go to dashboard', icon: LayoutDashboard, keywords: ['overview', 'home'], run: () => go('/dashboard') },
    { id: 'apps', label: 'Go to applications', icon: Briefcase, run: () => go('/applications') },
    { id: 'inbox', label: 'Go to inbox', icon: Inbox, keywords: ['email', 'mail'], run: () => go('/inbox') },
    { id: 'cal', label: 'Go to calendar', icon: CalendarDays, keywords: ['interview', 'schedule'], run: () => go('/calendar') },
    { id: 'kanban', label: 'Go to Kanban', icon: SquareKanban, keywords: ['board', 'pipeline'], run: () => go('/kanban') },
    { id: 'companies', label: 'Go to companies', icon: Building2, run: () => go('/companies') },
    { id: 'analytics', label: 'Go to analytics', icon: BarChart3, keywords: ['charts', 'stats'], run: () => go('/analytics') },
    { id: 'add-account', label: 'Add email account', icon: MailPlus, keywords: ['connect', 'gmail', 'imap'], run: () => go('/settings/email-accounts?connect=1') },
    { id: 'settings', label: 'Open settings', icon: Settings, keywords: ['preferences'], run: () => go('/settings/general') },
    { id: 'theme', label: 'Toggle theme', icon: Moon, keywords: ['dark', 'light', 'mode'], run: () => { toggle(); } },
  ];

  const results = debounced ? search.data : undefined;
  const hasResults = !!results && (results.applications.length || results.emails.length || results.companies.length);

  return (
    <DialogPrimitive.Root open={commandOpen} onOpenChange={setCommandOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-24px)] max-w-[640px] -translate-x-1/2 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-popover data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98]"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <Command shouldFilter={false} loop className="flex flex-col">
            <div className="flex h-12 items-center gap-2.5 border-b px-4">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search applications, emails, companies… or type a command"
                className="h-full flex-1 bg-transparent text-[14px] outline-none placeholder:text-subtle"
                autoFocus
              />
              {search.isFetching && debounced && <Spinner />}
              <Kbd>Esc</Kbd>
            </div>
            <Command.List className="max-h-[min(60vh,460px)] overflow-y-auto p-1.5">
              {debounced && !search.isFetching && !hasResults && filterCommands(commands, query).length === 0 && (
                <Command.Empty className="py-10 text-center text-xs text-muted-foreground">No results for “{query}”.</Command.Empty>
              )}

              {results && results.applications.length > 0 && (
                <Command.Group heading="Applications">
                  {results.applications.map((a) => (
                    <PaletteItem key={`a-${a.id}`} value={`app-${a.id}`} onSelect={() => go(`/applications/${a.id}`)}>
                      <CompanyAvatar name={a.companyName} size="sm" />
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-medium">{a.companyName}</span>
                        <span className="text-muted-foreground"> · {a.jobTitle}</span>
                        {a.location && <span className="text-subtle"> · {a.location}</span>}
                      </span>
                      <span className="hidden font-mono text-[11px] text-subtle sm:inline">{a.displayId}</span>
                      <StatusBadge status={a.status} />
                    </PaletteItem>
                  ))}
                </Command.Group>
              )}

              {results && results.emails.length > 0 && (
                <Command.Group heading="Emails">
                  {results.emails.map((e) => (
                    <PaletteItem key={`e-${e.id}`} value={`email-${e.id}`} onSelect={() => go(`/inbox?email=${e.id}`)}>
                      <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-medium">{e.subject}</span>
                        <span className="text-muted-foreground"> · {e.senderName || e.senderEmail}</span>
                      </span>
                      <span className="hidden sm:inline">
                        <ClassificationBadge value={e.classification} />
                      </span>
                      <span className="tabular w-14 text-right text-2xs text-subtle">{relativeTime(e.receivedAt)}</span>
                    </PaletteItem>
                  ))}
                </Command.Group>
              )}

              {results && results.companies.length > 0 && (
                <Command.Group heading="Companies">
                  {results.companies.map((c) => (
                    <PaletteItem key={`c-${c.id}`} value={`company-${c.id}`} onSelect={() => go(`/companies/${c.id}`)}>
                      <CompanyAvatar name={c.name} size="sm" />
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-medium">{c.name}</span>
                        {c.domain && <span className="text-subtle"> · {c.domain}</span>}
                      </span>
                      <span className="tabular text-xs text-muted-foreground">
                        {c.applications} app{c.applications === 1 ? '' : 's'}
                      </span>
                    </PaletteItem>
                  ))}
                </Command.Group>
              )}

              {filterCommands(commands, query).length > 0 && (
                <Command.Group heading="Commands">
                  {filterCommands(commands, query).map((c) => {
                    const Icon = c.icon;
                    return (
                      <PaletteItem key={c.id} value={`cmd-${c.id}`} onSelect={c.run}>
                        <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate">
                          {c.id === 'search-apps' && query.trim() ? (
                            <>
                              Search applications for <span className="font-medium">“{query.trim()}”</span>
                            </>
                          ) : (
                            c.label
                          )}
                        </span>
                        {c.shortcut && <Kbd>{c.shortcut}</Kbd>}
                      </PaletteItem>
                    );
                  })}
                </Command.Group>
              )}
            </Command.List>
            <div className="flex h-8 items-center gap-3 border-t bg-elevated/60 px-3 text-2xs text-subtle">
              <span className="inline-flex items-center gap-1">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> navigate
              </span>
              <span className="inline-flex items-center gap-1">
                <Kbd>↵</Kbd> open
              </span>
              <span className="ml-auto">ApplyFlow</span>
            </div>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function filterCommands(cmds: Cmd[], q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return cmds;
  return cmds.filter(
    (c) => c.id === 'search-apps' || c.label.toLowerCase().includes(s) || c.keywords?.some((k) => k.includes(s)),
  );
}

function PaletteItem({ children, value, onSelect }: { children: ReactNode; value: string; onSelect: () => void }) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className={cn(
        'flex h-9 cursor-default select-none items-center gap-2.5 rounded-md px-2 text-[13px] outline-none',
        'data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground',
      )}
    >
      {children}
    </Command.Item>
  );
}
