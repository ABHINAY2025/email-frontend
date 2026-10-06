import { api } from '@/lib/api';
import type {
  ApplicationDetail,
  ApplicationFacets,
  ApplicationQuery,
  ApplicationSummary,
  CreateApplicationRequest,
  EmailDetail,
  Note,
  Page,
  StatusHistoryEntry,
  TimelineEvent,
  UpdateApplicationRequest,
  UpdateStatusRequest,
} from '@/types/api';

export const applicationsApi = {
  list: (q: ApplicationQuery = {}, signal?: AbortSignal) =>
    api.get<Page<ApplicationSummary>>(
      '/applications',
      {
        q: q.q,
        bucket: q.bucket && q.bucket !== 'all' ? q.bucket : undefined,
        status: q.status,
        companyId: q.companyId,
        from: q.from,
        to: q.to,
        location: q.location,
        source: q.source,
        emailAccountId: q.emailAccountId,
        jobTitle: q.jobTitle,
        archived: q.archived ? true : undefined,
        sort: q.sort,
        dir: q.dir,
        page: q.page,
        size: q.size,
      },
      { signal },
    ),
  /** Fetch every page (used by Kanban). */
  listAll: async (q: ApplicationQuery = {}): Promise<ApplicationSummary[]> => {
    const size = 200;
    const first = await applicationsApi.list({ ...q, page: 0, size });
    const all = [...first.content];
    for (let p = 1; p < Math.min(first.totalPages, 25); p++) {
      const next = await applicationsApi.list({ ...q, page: p, size });
      all.push(...next.content);
    }
    return all;
  },
  get: (id: number) => api.get<ApplicationDetail>(`/applications/${id}`),
  create: (body: CreateApplicationRequest) => api.post<ApplicationDetail>('/applications', body),
  update: (id: number, body: UpdateApplicationRequest) => api.patch<ApplicationDetail>(`/applications/${id}`, body),
  remove: (id: number) => api.delete(`/applications/${id}`),
  updateStatus: (id: number, body: UpdateStatusRequest) =>
    api.patch<ApplicationDetail>(`/applications/${id}/status`, body),
  emails: (id: number) => api.get<EmailDetail[]>(`/applications/${id}/emails`),
  timeline: (id: number) => api.get<TimelineEvent[]>(`/applications/${id}/timeline`),
  events: (id: number) => api.get<TimelineEvent[]>(`/applications/${id}/events`),
  history: (id: number) => api.get<StatusHistoryEntry[]>(`/applications/${id}/history`),
  addNote: (id: number, content: string) => api.post<Note>(`/applications/${id}/notes`, { content }),
  updateNote: (id: number, noteId: number, content: string) =>
    api.patch<Note>(`/applications/${id}/notes/${noteId}`, { content }),
  deleteNote: (id: number, noteId: number) => api.delete(`/applications/${id}/notes/${noteId}`),
  merge: (id: number, sourceApplicationId: number) =>
    api.post<ApplicationDetail>(`/applications/${id}/merge`, { sourceApplicationId }),
  facets: () => api.get<ApplicationFacets>('/applications/facets'),
};
