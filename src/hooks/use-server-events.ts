import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { connectServerEvents } from '@/lib/sse';
import { qk } from '@/lib/query-keys';
import type {
  ApplicationSummary,
  InboxItem,
  Notification,
  ServerEvent,
  StatusChangedPayload,
  SyncJob,
} from '@/types/api';

const TOAST_NOTIFICATION_TYPES = new Set<Notification['type']>([
  'NEW_INTERVIEW',
  'NEW_OFFER',
  'NEW_REJECTION',
  'RECRUITER_RESPONSE',
  'ASSESSMENT_DEADLINE',
  'POSSIBLE_DUPLICATE',
]);

/** Mount once in the app shell. Keeps every query fresh from the server event stream. */
export function useServerEvents(enabled = true) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const navRef = useRef(navigate);
  navRef.current = navigate;

  useEffect(() => {
    if (!enabled) return;

    // Coalesce bursts (a sync can emit dozens of events) into one invalidation pass.
    const pending = new Set<string>();
    let flushTimer: ReturnType<typeof setTimeout> | null = null;
    const keysByGroup: Record<string, readonly unknown[]> = {
      applications: qk.applications.all,
      dashboard: qk.dashboard.all,
      inbox: qk.inbox.all,
      notifications: qk.notifications.all,
      sync: qk.sync.status,
      accounts: qk.emailAccounts.all,
      calendar: qk.calendar.all,
      analytics: qk.analytics.all,
      companies: qk.companies.all,
      onboarding: qk.onboarding,
    };
    const invalidate = (...groups: string[]) => {
      groups.forEach((g) => pending.add(g));
      if (flushTimer) return;
      flushTimer = setTimeout(() => {
        flushTimer = null;
        pending.forEach((g) => void qc.invalidateQueries({ queryKey: keysByGroup[g] }));
        pending.clear();
      }, 400);
    };

    const ALL = Object.keys(keysByGroup);

    const onEvent = (ev: ServerEvent) => {
      switch (ev.type) {
        case 'APPLICATION_CREATED':
        case 'APPLICATION_UPDATED': {
          const app = ev.payload as ApplicationSummary;
          if (app?.id) void qc.invalidateQueries({ queryKey: qk.applications.detail(app.id) });
          invalidate('applications', 'dashboard', 'calendar', 'analytics', 'companies');
          if (ev.type === 'APPLICATION_CREATED') invalidate('onboarding');
          break;
        }
        case 'STATUS_CHANGED': {
          const p = ev.payload as StatusChangedPayload;
          if (p?.applicationId) void qc.invalidateQueries({ queryKey: qk.applications.detail(p.applicationId) });
          invalidate('applications', 'dashboard', 'calendar', 'analytics', 'companies');
          break;
        }
        case 'EMAIL_RECEIVED': {
          const email = ev.payload as InboxItem;
          if (email?.applicationId) void qc.invalidateQueries({ queryKey: qk.applications.detail(email.applicationId) });
          invalidate('inbox', 'dashboard', 'applications', 'companies', 'onboarding');
          break;
        }
        case 'SYNC_STARTED':
          invalidate('sync', 'accounts', 'onboarding');
          break;
        case 'SYNC_COMPLETED': {
          const job = ev.payload as SyncJob;
          invalidate(...ALL);
          if (job && (job.applicationsCreated > 0 || job.applicationsUpdated > 0)) {
            const parts = [];
            if (job.applicationsCreated) parts.push(`${job.applicationsCreated} new`);
            if (job.applicationsUpdated) parts.push(`${job.applicationsUpdated} updated`);
            toast.success('Sync complete', {
              description: `${job.emailAccountEmail}: ${parts.join(', ')} application${job.applicationsCreated + job.applicationsUpdated === 1 ? '' : 's'}.`,
            });
          }
          break;
        }
        case 'SYNC_FAILED': {
          const job = ev.payload as SyncJob;
          invalidate('sync', 'accounts', 'notifications', 'onboarding');
          toast.error('Sync failed', {
            description: job?.error ? `${job.emailAccountEmail}: ${job.error}` : job?.emailAccountEmail,
            action: { label: 'View details', onClick: () => navRef.current('/settings/email-accounts') },
            duration: 10_000,
          });
          break;
        }
        case 'NOTIFICATION_CREATED': {
          const n = ev.payload as Notification;
          invalidate('notifications');
          if (n && TOAST_NOTIFICATION_TYPES.has(n.type)) {
            const show = n.type === 'NEW_REJECTION' ? toast.message : n.type === 'NEW_OFFER' ? toast.success : toast.info;
            show(n.title, {
              description: n.message,
              action: n.applicationId
                ? { label: 'Open', onClick: () => navRef.current(`/applications/${n.applicationId}`) }
                : n.emailId
                  ? { label: 'Review', onClick: () => navRef.current(`/inbox?tab=review&email=${n.emailId}`) }
                  : undefined,
            });
          }
          break;
        }
      }
    };

    const stop = connectServerEvents({
      onEvent,
      // After a reconnect we may have missed events — refresh everything visible.
      onReconnect: () => invalidate(...ALL),
    });

    return () => {
      stop();
      if (flushTimer) clearTimeout(flushTimer);
    };
  }, [enabled, qc]);
}
