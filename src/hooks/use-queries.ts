import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { healthApi } from '@/api/auth';
import {
  analyticsApi,
  calendarApi,
  companiesApi,
  dashboardApi,
  emailAccountsApi,
  notificationsApi,
  privacyApi,
  searchApi,
  settingsApi,
  syncApi,
} from '@/api/misc';
import { ApiClientError, errorMessage } from '@/lib/api';
import { qk } from '@/lib/query-keys';
import type {
  AppSettings,
  CreateEmailAccountRequest,
  Notification,
  UpdateEmailAccountRequest,
} from '@/types/api';

// ------------------------------------------------------------- dashboard
export const useDashboardSummary = () => useQuery({ queryKey: qk.dashboard.summary(), queryFn: dashboardApi.summary });
export const useDashboardActivity = (limit = 20) =>
  useQuery({ queryKey: qk.dashboard.activity(limit), queryFn: () => dashboardApi.activity(limit) });
export const useDashboardAttention = () => useQuery({ queryKey: qk.dashboard.attention(), queryFn: dashboardApi.attention });

// ------------------------------------------------------------- calendar
export const useCalendarEvents = (from: string, to: string) =>
  useQuery({ queryKey: qk.calendar.range(from, to), queryFn: () => calendarApi.events(from, to), placeholderData: (p) => p });

// ------------------------------------------------------------- companies
export const useCompanies = (q: string) =>
  useQuery({ queryKey: qk.companies.list(q), queryFn: () => companiesApi.list(q || undefined), placeholderData: (p) => p });
export const useCompany = (id: number) =>
  useQuery({
    queryKey: qk.companies.detail(id),
    queryFn: () => companiesApi.get(id),
    enabled: Number.isFinite(id),
    retry: (c, e) => (e as ApiClientError)?.status !== 404 && c < 2,
  });

// ------------------------------------------------------------- analytics
export const useAnalyticsOverview = () => useQuery({ queryKey: qk.analytics.overview(), queryFn: analyticsApi.overview });
export const useAnalyticsApplications = () =>
  useQuery({ queryKey: qk.analytics.applications(), queryFn: analyticsApi.applications });
export const useAnalyticsStatus = () => useQuery({ queryKey: qk.analytics.status(), queryFn: analyticsApi.status });
export const useAnalyticsResponseRate = () =>
  useQuery({ queryKey: qk.analytics.responseRate(), queryFn: analyticsApi.responseRate });

// ------------------------------------------------------------- health
export const useHealth = () =>
  useQuery({
    queryKey: qk.health,
    queryFn: healthApi.get,
    refetchInterval: 60_000,
    retry: 0,
  });

// ------------------------------------------------------------- sync
export const useSyncStatus = () =>
  useQuery({
    queryKey: qk.sync.status,
    queryFn: syncApi.status,
    // Poll faster while a sync is in flight (SSE also invalidates).
    refetchInterval: (q) => (q.state.data?.state === 'SYNCING' ? 4_000 : 60_000),
  });

export function useStartSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: syncApi.start,
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: qk.sync.status });
      void qc.invalidateQueries({ queryKey: qk.emailAccounts.all });
      if (res?.started === 0) toast.message('Nothing to sync', { description: 'No enabled mail accounts are ready to sync.' });
      else toast.success('Sync started', { description: res ? `Syncing ${res.started} account${res.started === 1 ? '' : 's'}…` : undefined });
    },
    onError: (e) => {
      if (e instanceof ApiClientError && e.code === 'SYNC_IN_PROGRESS') toast.message('A sync is already running');
      else toast.error('Could not start sync', { description: errorMessage(e) });
    },
  });
}

// ------------------------------------------------------------- email accounts
export const useEmailAccounts = () => useQuery({ queryKey: qk.emailAccounts.all, queryFn: emailAccountsApi.list });

function useAccountsRefresh() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: qk.emailAccounts.all });
    void qc.invalidateQueries({ queryKey: qk.sync.status });
  };
}

export function useCreateEmailAccount() {
  const refresh = useAccountsRefresh();
  return useMutation({
    mutationFn: (body: CreateEmailAccountRequest) => emailAccountsApi.create(body),
    onSuccess: (acc) => {
      refresh();
      toast.success('Account connected', { description: `${acc.email} — initial sync started.` });
    },
  });
}

export function useUpdateEmailAccount() {
  const refresh = useAccountsRefresh();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateEmailAccountRequest }) => emailAccountsApi.update(id, body),
    onSuccess: () => {
      refresh();
      toast.success('Account updated');
    },
  });
}

export function useTestEmailAccount() {
  return useMutation({
    mutationFn: (id: number) => emailAccountsApi.test(id),
    onSuccess: (r) => (r.success ? toast.success('Connection OK', { description: r.message }) : toast.error('Connection failed', { description: r.message })),
    onError: (e) => toast.error('Connection test failed', { description: errorMessage(e) }),
  });
}

export function useSyncEmailAccount() {
  const refresh = useAccountsRefresh();
  return useMutation({
    mutationFn: (id: number) => emailAccountsApi.sync(id),
    onSuccess: (job) => {
      refresh();
      toast.success('Sync started', { description: job?.emailAccountEmail });
    },
    onError: (e) => {
      if (e instanceof ApiClientError && e.code === 'SYNC_IN_PROGRESS') toast.message('This account is already syncing');
      else toast.error('Could not start sync', { description: errorMessage(e) });
    },
  });
}

function useAllDataRefresh() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
  };
}

export function useClearEmailAccount() {
  const refresh = useAllDataRefresh();
  return useMutation({
    mutationFn: (id: number) => emailAccountsApi.clear(id),
    onSuccess: () => {
      refresh();
      toast.success('Imported mail cleared', { description: 'The sync cursor was reset for this account.' });
    },
    onError: (e) => toast.error('Could not clear mail', { description: errorMessage(e) }),
  });
}

export function useDeleteEmailAccount() {
  const refresh = useAllDataRefresh();
  return useMutation({
    mutationFn: ({ id, purge }: { id: number; purge: boolean }) => emailAccountsApi.remove(id, purge),
    onSuccess: () => {
      refresh();
      toast.success('Account disconnected');
    },
    onError: (e) => toast.error('Could not disconnect account', { description: errorMessage(e) }),
  });
}

// ------------------------------------------------------------- notifications
export const useNotifications = () =>
  useQuery({ queryKey: qk.notifications.list(), queryFn: () => notificationsApi.list(false, 50) });
export const useUnreadNotifications = () =>
  useQuery({ queryKey: qk.notifications.unread(), queryFn: notificationsApi.unreadCount, refetchInterval: 120_000 });

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onMutate: (id) => {
      const prev = qc.getQueryData<Notification[]>(qk.notifications.list());
      if (prev) qc.setQueryData(qk.notifications.list(), prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      const c = qc.getQueryData<{ count: number }>(qk.notifications.unread());
      if (c && prev?.find((n) => n.id === id && !n.read))
        qc.setQueryData(qk.notifications.unread(), { count: Math.max(0, c.count - 1) });
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.notifications.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onMutate: () => {
      const prev = qc.getQueryData<Notification[]>(qk.notifications.list());
      if (prev) qc.setQueryData(qk.notifications.list(), prev.map((n) => ({ ...n, read: true })));
      qc.setQueryData(qk.notifications.unread(), { count: 0 });
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.notifications.all }),
  });
}

// ------------------------------------------------------------- search
export const useSearch = (q: string) =>
  useQuery({
    queryKey: qk.search(q),
    queryFn: ({ signal }) => searchApi.search(q, signal),
    enabled: q.trim().length >= 1,
    staleTime: 15_000,
    placeholderData: (p) => p,
  });

// ------------------------------------------------------------- settings
export const useSettings = () => useQuery({ queryKey: qk.settings, queryFn: settingsApi.get, staleTime: 5 * 60_000 });

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AppSettings) => settingsApi.update(body),
    onSuccess: (s) => {
      qc.setQueryData(qk.settings, s);
      void qc.invalidateQueries({ queryKey: qk.sync.status });
      void qc.invalidateQueries({ queryKey: qk.me });
      toast.success('Settings saved');
    },
    onError: (e) => toast.error('Could not save settings', { description: errorMessage(e) }),
  });
}

export function usePrivacyAction(kind: 'clearImportedMail' | 'clearDemoData' | 'deleteAllData') {
  const refresh = useAllDataRefresh();
  const labels = {
    clearImportedMail: 'Imported mail cleared',
    clearDemoData: 'Demo data removed',
    deleteAllData: 'All data deleted',
  } as const;
  return useMutation({
    mutationFn: () => privacyApi[kind](),
    onSuccess: () => {
      refresh();
      toast.success(labels[kind]);
    },
    onError: (e) => toast.error('Action failed', { description: errorMessage(e) }),
  });
}
