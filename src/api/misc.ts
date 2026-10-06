import { api } from '@/lib/api';
import type {
  ActivityItem,
  AnalyticsOverview,
  AppSettings,
  ApplicationsAnalytics,
  AttentionItem,
  CalendarEvent,
  CompanyDetail,
  CompanySummary,
  ConnectionTestResult,
  CreateEmailAccountRequest,
  DashboardSummary,
  EmailAccount,
  Notification,
  ResponseRateAnalytics,
  SearchResults,
  StatusAnalytics,
  SyncJob,
  SyncStartResponse,
  SyncStatusResponse,
  UpdateEmailAccountRequest,
} from '@/types/api';

export const dashboardApi = {
  summary: () => api.get<DashboardSummary>('/dashboard/summary'),
  activity: (limit = 20) => api.get<ActivityItem[]>('/dashboard/activity', { limit }),
  attention: () => api.get<AttentionItem[]>('/dashboard/attention'),
};

export const calendarApi = {
  events: (from: string, to: string) => api.get<CalendarEvent[]>('/calendar/events', { from, to }),
};

export const companiesApi = {
  list: (q?: string) => api.get<CompanySummary[]>('/companies', { q }),
  get: (id: number) => api.get<CompanyDetail>(`/companies/${id}`),
};

export const analyticsApi = {
  overview: () => api.get<AnalyticsOverview>('/analytics/overview'),
  applications: () => api.get<ApplicationsAnalytics>('/analytics/applications'),
  status: () => api.get<StatusAnalytics>('/analytics/status'),
  responseRate: () => api.get<ResponseRateAnalytics>('/analytics/response-rate'),
};

export const emailAccountsApi = {
  list: () => api.get<EmailAccount[]>('/email-accounts'),
  create: (body: CreateEmailAccountRequest) => api.post<EmailAccount>('/email-accounts', body),
  update: (id: number, body: UpdateEmailAccountRequest) => api.patch<EmailAccount>(`/email-accounts/${id}`, body),
  test: (id: number) => api.post<ConnectionTestResult>(`/email-accounts/${id}/test`),
  sync: (id: number) => api.post<SyncJob>(`/email-accounts/${id}/sync`),
  clear: (id: number) => api.post<void>(`/email-accounts/${id}/clear`),
  remove: (id: number, purge: boolean) => api.delete(`/email-accounts/${id}`, { purge }),
};

export const syncApi = {
  start: () => api.post<SyncStartResponse>('/sync'),
  status: () => api.get<SyncStatusResponse>('/sync/status'),
};

export const notificationsApi = {
  list: (unreadOnly = false, limit = 50) => api.get<Notification[]>('/notifications', { unreadOnly, limit }),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
  markRead: (id: number) => api.patch<Notification>(`/notifications/${id}/read`),
  markAllRead: () => api.post<void>('/notifications/read-all'),
};

export const searchApi = {
  search: (q: string, signal?: AbortSignal) => api.get<SearchResults>('/search', { q }, { signal }),
};

export const settingsApi = {
  get: () => api.get<AppSettings>('/settings'),
  update: (body: AppSettings) => api.put<AppSettings>('/settings', body),
};

export const privacyApi = {
  clearImportedMail: () => api.post<void>('/privacy/clear-imported-mail'),
  clearDemoData: () => api.post<void>('/privacy/clear-demo-data'),
  deleteAllData: () => api.post<void>('/privacy/delete-all-data'),
};
