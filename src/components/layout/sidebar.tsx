import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  Inbox,
  LayoutDashboard,
  Mail,
  Settings,
  SquareKanban,
  type LucideIcon,
} from 'lucide-react';
import { useInboxCounts } from '@/hooks/use-inbox';
import { cn } from '@/lib/utils';
import { ProductMark } from './product-mark';
import { SidebarStatus } from './sync-status';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  end?: boolean;
}

export function Sidebar() {
  const counts = useInboxCounts();
  const unread = counts.data?.unread ?? 0;

  const main: NavItem[] = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/applications', label: 'Applications', icon: Briefcase },
    { to: '/inbox', label: 'My Inbox', icon: Inbox, badge: unread },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/kanban', label: 'Kanban', icon: SquareKanban },
    { to: '/companies', label: 'Companies', icon: Building2 },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];
  const secondary: NavItem[] = [
    { to: '/settings/email-accounts', label: 'Email Accounts', icon: Mail },
    { to: '/settings/general', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-full flex-col text-sidebar-foreground">
      <div className="flex h-12 shrink-0 items-center px-4">
        <NavLink to="/dashboard" className="rounded-md focus-ring text-foreground">
          <ProductMark />
        </NavLink>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 pb-3 pt-1" aria-label="Primary">
        <ul className="space-y-px">
          {main.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </ul>
        <div className="mx-2 mb-1.5 mt-5 label-caps">Workspace</div>
        <ul className="space-y-px">
          {secondary.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </ul>
      </nav>
      <SidebarStatus />
    </div>
  );
}

function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <li>
      <NavLink
        to={item.to}
        end={item.end}
        className={({ isActive }) =>
          cn(
            'group flex h-[30px] items-center gap-2.5 rounded-md px-2 text-[13px] font-medium transition-colors duration-150 focus-ring',
            isActive
              ? 'bg-sidebar-accent text-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
          )
        }
      >
        {({ isActive }) => (
          <>
            <Icon className={cn('size-4 shrink-0', isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
            <span className="truncate">{item.label}</span>
            {!!item.badge && (
              <span className="tabular ml-auto rounded-[4px] bg-primary/15 px-1.5 py-px text-[11px] font-semibold text-primary">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    </li>
  );
}
