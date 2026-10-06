import type { ApplicationQuery, InboxQuery } from '@/types/api';

/** Centralized TanStack Query keys. Prefix arrays allow broad invalidation. */
export const qk = {
  me: ['auth', 'me'] as const,
  /** Public; kept across logout (prefix 'auth'). */
  authConfig: ['auth', 'config'] as const,
  onboarding: ['onboarding'] as const,
  health: ['health'] as const,

  applications: {
    all: ['applications'] as const,
    lists: () => ['applications', 'list'] as const,
    list: (q: ApplicationQuery) => ['applications', 'list', q] as const,
    board: (archived: boolean) => ['applications', 'board', { archived }] as const,
    facets: () => ['applications', 'facets'] as const,
    detail: (id: number) => ['applications', 'detail', id] as const,
    emails: (id: number) => ['applications', 'detail', id, 'emails'] as const,
    timeline: (id: number) => ['applications', 'detail', id, 'timeline'] as const,
    history: (id: number) => ['applications', 'detail', id, 'history'] as const,
  },

  inbox: {
    all: ['inbox'] as const,
    list: (q: InboxQuery) => ['inbox', 'list', q] as const,
    counts: () => ['inbox', 'counts'] as const,
    detail: (id: number) => ['inbox', 'detail', id] as const,
  },

  dashboard: {
    all: ['dashboard'] as const,
    summary: () => ['dashboard', 'summary'] as const,
    activity: (limit: number) => ['dashboard', 'activity', limit] as const,
    attention: () => ['dashboard', 'attention'] as const,
  },

  calendar: {
    all: ['calendar'] as const,
    range: (from: string, to: string) => ['calendar', from, to] as const,
  },

  companies: {
    all: ['companies'] as const,
    list: (q: string) => ['companies', 'list', q] as const,
    detail: (id: number) => ['companies', 'detail', id] as const,
  },

  analytics: {
    all: ['analytics'] as const,
    overview: () => ['analytics', 'overview'] as const,
    applications: () => ['analytics', 'applications'] as const,
    status: () => ['analytics', 'status'] as const,
    responseRate: () => ['analytics', 'response-rate'] as const,
  },

  emailAccounts: {
    all: ['email-accounts'] as const,
  },

  sync: {
    status: ['sync', 'status'] as const,
  },

  notifications: {
    all: ['notifications'] as const,
    list: () => ['notifications', 'list'] as const,
    unread: () => ['notifications', 'unread-count'] as const,
  },

  search: (q: string) => ['search', q] as const,
  settings: ['settings'] as const,
};
