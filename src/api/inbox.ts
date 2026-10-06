import { api } from '@/lib/api';
import type {
  ApplicationDetail,
  EmailClassification,
  EmailDetail,
  InboxCounts,
  InboxItem,
  InboxQuery,
  Page,
} from '@/types/api';

export const inboxApi = {
  list: (q: InboxQuery = {}) =>
    api.get<Page<InboxItem>>('/inbox', {
      tab: q.tab,
      q: q.q,
      accountId: q.accountId,
      unreadOnly: q.unreadOnly ? true : undefined,
      page: q.page,
      size: q.size,
    }),
  counts: () => api.get<InboxCounts>('/inbox/counts'),
  get: (id: number) => api.get<EmailDetail>(`/inbox/${id}`),
  setRead: (id: number, read: boolean) => api.patch<InboxItem>(`/inbox/${id}/read`, { read }),
  merge: (id: number, applicationId: number) => api.post<EmailDetail>(`/inbox/${id}/merge`, { applicationId }),
  createApplication: (id: number) => api.post<ApplicationDetail>(`/inbox/${id}/create-application`),
  ignore: (id: number) => api.post<void>(`/inbox/${id}/ignore`),
  reclassify: (id: number, classification: EmailClassification) =>
    api.post<EmailDetail>(`/inbox/${id}/reclassify`, { classification }),
  remove: (id: number) => api.delete(`/inbox/${id}`),
};
