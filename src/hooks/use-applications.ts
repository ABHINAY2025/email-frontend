import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { applicationsApi } from '@/api/applications';
import { errorMessage } from '@/lib/api';
import { qk } from '@/lib/query-keys';
import { STATUS_META } from '@/lib/status';
import type {
  ApplicationDetail,
  ApplicationQuery,
  ApplicationStatus,
  ApplicationSummary,
  CreateApplicationRequest,
  Page,
  UpdateApplicationRequest,
} from '@/types/api';

/** Invalidate everything derived from application data. */
export function invalidateApplicationData(qc: QueryClient, id?: number) {
  void qc.invalidateQueries({ queryKey: qk.applications.lists() });
  void qc.invalidateQueries({ queryKey: ['applications', 'board'] });
  void qc.invalidateQueries({ queryKey: qk.applications.facets() });
  if (id !== undefined) void qc.invalidateQueries({ queryKey: qk.applications.detail(id) });
  void qc.invalidateQueries({ queryKey: qk.dashboard.all });
  void qc.invalidateQueries({ queryKey: qk.companies.all });
  void qc.invalidateQueries({ queryKey: qk.analytics.all });
  void qc.invalidateQueries({ queryKey: qk.calendar.all });
}

export function useApplications(q: ApplicationQuery) {
  return useQuery({
    queryKey: qk.applications.list(q),
    queryFn: ({ signal }) => applicationsApi.list(q, signal),
    placeholderData: keepPreviousData,
  });
}

export function useBoardApplications(archived = false) {
  return useQuery({
    queryKey: qk.applications.board(archived),
    queryFn: () => applicationsApi.listAll({ archived, sort: 'lastActivityAt', dir: 'desc' }),
  });
}

export function useApplicationFacets() {
  return useQuery({ queryKey: qk.applications.facets(), queryFn: applicationsApi.facets, staleTime: 60_000 });
}

export function useApplication(id: number) {
  return useQuery({
    queryKey: qk.applications.detail(id),
    queryFn: () => applicationsApi.get(id),
    enabled: Number.isFinite(id),
    retry: (count, err) => (err as { status?: number })?.status !== 404 && count < 2,
  });
}

export function useApplicationEmails(id: number) {
  return useQuery({ queryKey: qk.applications.emails(id), queryFn: () => applicationsApi.emails(id), enabled: Number.isFinite(id) });
}

export function useApplicationTimeline(id: number) {
  return useQuery({ queryKey: qk.applications.timeline(id), queryFn: () => applicationsApi.timeline(id), enabled: Number.isFinite(id) });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateApplicationRequest) => applicationsApi.create(body),
    onSuccess: (app) => {
      qc.setQueryData(qk.applications.detail(app.id), app);
      invalidateApplicationData(qc);
      toast.success('Application added', { description: `${app.companyName} — ${app.jobTitle}` });
    },
  });
}

export function useUpdateApplication(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateApplicationRequest) => applicationsApi.update(id, body),
    onSuccess: (app) => {
      qc.setQueryData(qk.applications.detail(id), app);
      invalidateApplicationData(qc, id);
    },
    onError: (e) => toast.error('Could not update application', { description: errorMessage(e) }),
  });
}

/** Archive / unarchive from any list. */
export function useArchiveApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, archived }: { id: number; archived: boolean }) => applicationsApi.update(id, { archived }),
    onSuccess: (app, { archived }) => {
      qc.setQueryData(qk.applications.detail(app.id), app);
      invalidateApplicationData(qc, app.id);
      toast.success(archived ? 'Application archived' : 'Application restored', {
        description: `${app.companyName} — ${app.jobTitle}`,
      });
    },
    onError: (e) => toast.error('Could not update application', { description: errorMessage(e) }),
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => applicationsApi.remove(id),
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: qk.applications.detail(id) });
      invalidateApplicationData(qc);
      void qc.invalidateQueries({ queryKey: qk.inbox.all });
      toast.success('Application deleted');
    },
    onError: (e) => toast.error('Could not delete application', { description: errorMessage(e) }),
  });
}

export function useMergeApplication(targetId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sourceApplicationId: number) => applicationsApi.merge(targetId, sourceApplicationId),
    onSuccess: (app, sourceId) => {
      qc.removeQueries({ queryKey: qk.applications.detail(sourceId) });
      qc.setQueryData(qk.applications.detail(targetId), app);
      void qc.invalidateQueries({ queryKey: qk.applications.detail(targetId) });
      invalidateApplicationData(qc, targetId);
      void qc.invalidateQueries({ queryKey: qk.inbox.all });
      toast.success('Applications merged');
    },
    onError: (e) => toast.error('Merge failed', { description: errorMessage(e) }),
  });
}

type ListSnapshot = [readonly unknown[], unknown][];

function patchSummaries(qc: QueryClient, id: number, patch: Partial<ApplicationSummary>): ListSnapshot {
  const snapshots: ListSnapshot = [];
  for (const [key, data] of qc.getQueriesData({ queryKey: qk.applications.lists() })) {
    snapshots.push([key, data]);
    const page = data as Page<ApplicationSummary> | undefined;
    if (!page?.content) continue;
    qc.setQueryData(key, {
      ...page,
      content: page.content.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    });
  }
  for (const [key, data] of qc.getQueriesData({ queryKey: ['applications', 'board'] })) {
    snapshots.push([key, data]);
    const list = data as ApplicationSummary[] | undefined;
    if (!Array.isArray(list)) continue;
    qc.setQueryData(
      key,
      list.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );
  }
  const detailKey = qk.applications.detail(id);
  const detail = qc.getQueryData<ApplicationDetail>(detailKey);
  if (detail) {
    snapshots.push([detailKey, detail]);
    qc.setQueryData(detailKey, { ...detail, ...patch });
  }
  return snapshots;
}

interface StatusVars {
  id: number;
  status: ApplicationStatus;
  reason?: string;
  /** Previous status (for undo). */
  previous?: ApplicationStatus;
  silent?: boolean;
}

/** Optimistic status change, with toast + undo. Used by Kanban, tables and detail page. */
export function useUpdateStatus() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, status, reason }: StatusVars) =>
      applicationsApi.updateStatus(id, { status, reason: reason?.trim() || undefined }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: qk.applications.all });
      const snapshots = patchSummaries(qc, vars.id, { status: vars.status, lastActivityAt: new Date().toISOString() });
      return { snapshots };
    },
    onError: (e, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error('Status change failed', { description: errorMessage(e) });
    },
    onSuccess: (app, vars) => {
      qc.setQueryData(qk.applications.detail(app.id), app);
      if (vars.silent) return;
      const prev = vars.previous;
      toast.success(`Moved to ${STATUS_META[vars.status].label}`, {
        description: `${app.companyName} — ${app.jobTitle}`,
        action:
          prev && prev !== vars.status
            ? {
                label: 'Undo',
                onClick: () =>
                  mutation.mutate({ id: vars.id, status: prev, reason: 'Undo', silent: true }),
              }
            : undefined,
      });
    },
    onSettled: (_d, _e, vars) => {
      invalidateApplicationData(qc, vars.id);
      void qc.invalidateQueries({ queryKey: qk.applications.timeline(vars.id) });
    },
  });
  return mutation;
}

export function useAddNote(appId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => applicationsApi.addNote(appId, content),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.applications.detail(appId) });
      toast.success('Note added');
    },
    onError: (e) => toast.error('Could not add note', { description: errorMessage(e) }),
  });
}

export function useUpdateNote(appId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, content }: { noteId: number; content: string }) =>
      applicationsApi.updateNote(appId, noteId, content),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.applications.detail(appId) });
      toast.success('Note updated');
    },
    onError: (e) => toast.error('Could not update note', { description: errorMessage(e) }),
  });
}

export function useDeleteNote(appId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId: number) => applicationsApi.deleteNote(appId, noteId),
    onMutate: async (noteId) => {
      const key = qk.applications.detail(appId);
      const prev = qc.getQueryData<ApplicationDetail>(key);
      if (prev) qc.setQueryData(key, { ...prev, notes: prev.notes.filter((n) => n.id !== noteId) });
      return { prev };
    },
    onError: (e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.applications.detail(appId), ctx.prev);
      toast.error('Could not delete note', { description: errorMessage(e) });
    },
    onSuccess: () => toast.success('Note deleted'),
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.applications.detail(appId) }),
  });
}
