import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { RelativeTime } from '@/components/common/data-display';
import { EmptyState, ErrorState } from '@/components/common/states';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotifications,
} from '@/hooks/use-queries';
import { NOTIFICATION_META } from '@/lib/classification';
import { HUE_CLASSES } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types/api';

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const unread = useUnreadNotifications();
  const list = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const navigate = useNavigate();
  const count = unread.data?.count ?? 0;

  const onClick = (n: Notification) => {
    if (!n.read) markRead.mutate(n.id);
    setOpen(false);
    if (n.type === 'SYNC_FAILURE') navigate('/settings/email-accounts');
    else if (n.applicationId) navigate(`/applications/${n.applicationId}`);
    else if (n.emailId) navigate(`/inbox?email=${n.emailId}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative" aria-label={`Notifications${count ? ` (${count} unread)` : ''}`}>
          <Bell className="!size-4" />
          {count > 0 && (
            <span className="tabular absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-background bg-primary px-0.5 text-[9px] font-bold leading-none text-primary-foreground">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] max-w-[calc(100vw-16px)] p-0">
        <div className="flex h-10 items-center justify-between border-b px-3">
          <span className="text-[13px] font-semibold">Notifications</span>
          <Button variant="ghost" size="xs" disabled={count === 0 || markAll.isPending} onClick={() => markAll.mutate()}>
            <CheckCheck /> Mark all read
          </Button>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {list.isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : list.isError ? (
            <ErrorState compact error={list.error} onRetry={() => list.refetch()} />
          ) : !list.data?.length ? (
            <EmptyState compact icon={Bell} title="You're all caught up" description="New interviews, offers and sync issues will show up here." />
          ) : (
            <ul className="divide-y">
              {list.data.map((n) => {
                const m = NOTIFICATION_META[n.type];
                const Icon = m.icon;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => onClick(n)}
                      className={cn(
                        'flex w-full gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-accent/60 focus-visible:bg-accent focus-visible:outline-none',
                        !n.read && 'bg-primary/[0.04]',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border',
                          HUE_CLASSES[m.hue].bg,
                          HUE_CLASSES[m.hue].border,
                          HUE_CLASSES[m.hue].text,
                        )}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className={cn('truncate text-[13px]', !n.read ? 'font-semibold' : 'font-medium text-foreground/90')}>{n.title}</span>
                          {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                        </span>
                        <span className="line-clamp-2 text-xs text-muted-foreground">{n.message}</span>
                      </span>
                      <span className="shrink-0 text-2xs text-subtle">
                        <RelativeTime value={n.createdAt} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
