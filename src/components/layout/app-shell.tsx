import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { AppUIProvider, useAppUI } from '@/hooks/use-app-ui';
import { useServerEvents } from '@/hooks/use-server-events';
import { useAuth } from '@/hooks/use-auth';
import { isTypingTarget } from '@/lib/utils';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import { CommandPalette } from './command-palette';
import { AddApplicationDialog } from '@/components/applications/add-application-dialog';
import { SyncDetailsDialog } from './sync-status';

export function AppShell() {
  return (
    <AppUIProvider>
      <ShellInner />
    </AppUIProvider>
  );
}

function ShellInner() {
  const { user } = useAuth();
  const { setCommandOpen, mobileNavOpen, setMobileNavOpen, openAddApplication } = useAppUI();
  const location = useLocation();
  useServerEvents(!!user);

  // Close the mobile drawer on navigation
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, setMobileNavOpen]);

  // Global shortcuts: ⌘K / Ctrl+K palette, "/" search, "c" create
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen(true);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (e.key === '/') {
        e.preventDefault();
        setCommandOpen(true);
      } else if (e.key === 'c' && !e.shiftKey) {
        e.preventDefault();
        openAddApplication();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setCommandOpen, openAddApplication]);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside className="hidden w-[240px] shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <Sidebar />
      </aside>
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="p-0" hideClose>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main id="main" className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
      <AddApplicationDialog />
      <SyncDetailsDialog />
    </div>
  );
}
