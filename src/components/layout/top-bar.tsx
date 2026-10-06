import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, LogOut, Menu, Moon, RefreshCw, Search, Settings, Sun, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Kbd } from '@/components/ui/kbd';
import { Tooltip } from '@/components/ui/tooltip';
import { useAppUI } from '@/hooks/use-app-ui';
import { useAuth } from '@/hooks/use-auth';
import { useStartSync, useSyncStatus } from '@/hooks/use-queries';
import { useApplication } from '@/hooks/use-applications';
import { useCompany } from '@/hooks/use-queries';
import { useTheme, type ThemePreference } from '@/lib/theme';
import { initials } from '@/lib/utils';
import { NotificationsBell } from './notifications';

const SECTION_TITLES: Record<string, string> = {
  dashboard: 'Overview',
  applications: 'Applications',
  inbox: 'My Inbox',
  calendar: 'Calendar',
  kanban: 'Kanban',
  companies: 'Companies',
  analytics: 'Analytics',
  settings: 'Settings',
};

function useBreadcrumbs(): { label: string; to?: string }[] {
  const { pathname } = useLocation();
  const parts = pathname.split('/').filter(Boolean);
  const section = parts[0] ?? 'dashboard';
  const appId = section === 'applications' && parts[1] ? Number(parts[1]) : NaN;
  const companyId = section === 'companies' && parts[1] ? Number(parts[1]) : NaN;
  const app = useApplication(appId);
  const company = useCompany(companyId);
  const crumbs: { label: string; to?: string }[] = [{ label: SECTION_TITLES[section] ?? 'Not found', to: `/${section}` }];
  if (section === 'applications' && parts[1]) {
    crumbs.push({ label: app.data ? `${app.data.displayId} · ${app.data.companyName}` : `AF-${parts[1]}` });
  } else if (section === 'companies' && parts[1]) {
    crumbs.push({ label: company.data?.name ?? 'Company' });
  } else if (section === 'settings' && parts[1]) {
    crumbs.push({ label: parts[1] === 'email-accounts' ? 'Email Accounts' : 'General' });
  }
  return crumbs;
}

export function TopBar() {
  const { setCommandOpen, setMobileNavOpen } = useAppUI();
  const crumbs = useBreadcrumbs();
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background px-3 md:px-4">
      <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation">
        <Menu className="!size-4" />
      </Button>

      <nav aria-label="Breadcrumb" className="flex min-w-0 shrink items-center gap-1 text-[13px] md:w-[260px] lg:w-[300px]">
        {crumbs.map((c, i) => (
          <Fragment key={i}>
            {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-subtle" />}
            {c.to && i < crumbs.length - 1 ? (
              <Link to={c.to} className="truncate text-muted-foreground transition-colors hover:text-foreground">
                {c.label}
              </Link>
            ) : (
              <span className={i === crumbs.length - 1 ? 'truncate font-medium text-foreground' : 'truncate text-muted-foreground'}>
                {c.label}
              </span>
            )}
          </Fragment>
        ))}
      </nav>

      <div className="flex flex-1 justify-center">
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="group hidden h-8 w-full max-w-[440px] items-center gap-2 rounded-md border bg-card px-2.5 text-[13px] text-subtle transition-colors hover:border-input hover:text-muted-foreground focus-ring sm:flex"
        >
          <Search className="size-3.5" />
          <span className="truncate">Search applications, emails, companies…</span>
          <span className="ml-auto flex items-center gap-0.5">
            <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
      </div>

      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon-sm" className="sm:hidden" onClick={() => setCommandOpen(true)} aria-label="Search">
          <Search className="!size-4" />
        </Button>
        <SyncButton />
        <NotificationsBell />
        <ThemeToggle />
        <ProfileMenu />
      </div>
    </header>
  );
}

function SyncButton() {
  const sync = useSyncStatus();
  const start = useStartSync();
  const syncing = start.isPending || sync.data?.state === 'SYNCING';
  return (
    <Tooltip content={syncing ? 'Syncing mail…' : 'Sync mail now'}>
      <Button variant="ghost" size="sm" onClick={() => start.mutate()} disabled={syncing} aria-label="Sync mail" className="gap-1.5 px-2">
        <RefreshCw className={syncing ? 'animate-spin' : ''} />
        <span className="hidden md:inline">{syncing ? 'Syncing' : 'Sync'}</span>
      </Button>
    </Tooltip>
  );
}

function ThemeToggle() {
  const { resolved, toggle } = useTheme();
  return (
    <Tooltip content={resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
      <Button variant="ghost" size="icon-sm" onClick={toggle} aria-label="Toggle theme">
        {resolved === 'dark' ? <Sun className="!size-4" /> : <Moon className="!size-4" />}
      </Button>
    </Tooltip>
  );
}

function ProfileMenu() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const name = user?.displayName || user?.username || 'User';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="ml-1 flex size-7 items-center justify-center rounded-full border bg-muted text-[11px] font-semibold text-foreground/90 transition-colors hover:border-input focus-ring"
          aria-label="Profile menu"
        >
          {initials(name)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="truncate text-[13px] font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">@{user?.username}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings/general">
            <Settings /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings/email-accounts">
            <UserRound /> Email accounts
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Moon /> Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuLabel>Appearance</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as ThemePreference)}>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void logout()}>
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
