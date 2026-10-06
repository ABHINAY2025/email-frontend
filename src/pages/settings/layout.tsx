import { Mail, SlidersHorizontal } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { Page, PageHeader } from '@/components/layout/page';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/settings/general', label: 'General', icon: SlidersHorizontal },
  { to: '/settings/email-accounts', label: 'Email accounts', icon: Mail },
];

export default function SettingsLayout() {
  return (
    <Page className="max-w-[960px]">
      <PageHeader title="Settings" description="Preferences, detection rules and connected mailboxes." className="mb-3" />
      <nav aria-label="Settings sections" className="scrollbar-none mb-6 flex items-center gap-1 overflow-x-auto border-b">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'relative -mb-px inline-flex h-9 items-center gap-1.5 whitespace-nowrap border-b-2 px-2 text-sm font-medium transition-colors focus-ring',
                isActive ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
              )
            }
          >
            <Icon className="size-3.5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </Page>
  );
}
