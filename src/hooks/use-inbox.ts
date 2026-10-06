import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { inboxApi } from '@/api/inbox';
import { errorMessage } from '@/lib/api';
import { qk } from '@/lib/query-keys';
import { CLASSIFICATION_META } from '@/lib/classification';
import { invalidateApplicationData } from './use-applications';
import type { EmailClassification, EmailDetail, InboxItem, InboxQuery, Page } from '@/types/api';

export function useInbox(q: InboxQuery) {
  return useQuery({
    queryKey: qk.inbox.list(q),
    queryFn: () => inboxApi.list(q),
    placeholderData: keepPreviousData,
  });
}

/** Paged inbox feed for the two-pane inbox ("Load more"). */
export function useInboxFeed(q: Omit<InboxQuery, 'page'>) {
  return useInfiniteQuery({
    queryKey: ['inbox', 'feed', q] as const,
    queryFn: ({ pageParam }) => inboxApi.list({ ...q, page: pageParam, size: q.size ?? 50 }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
}

export function useInboxCounts() {
  return useQuery({ queryKey: qk.inbox.counts(), queryFn: inboxApi.counts, staleTime: 20_000 });
}

export function useEmail(id: number | null) {
  return useQuery({
    queryKey: qk.inbox.detail(id ?? -1),
    queryFn: () => inboxApi.get(id as number),
    enabled: id !== null && Number.isFinite(id),
  });
}

/** Mark read/unread with optimistic updates across inbox lists, detail & application emails. */
export function useSetEmailRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, read }: { id: number; read: boolean }) => inboxApi.setRead(id, read),
    onMutate: async ({ id, read }) => {
      const snaps: [readonly unknown[], unknown][] = [];
      for (const [key, data] of qc.getQueriesData<Page<InboxItem>>({ queryKey: ['inbox', 'list'] })) {
        snaps.push([key, data]);
        if (data?.content)
          qc.setQueryData(key, { ...data, content: data.content.map((e) => (e.id === id ? { ...e, isRead: read } : e)) });
      }
      for (const [key, data] of qc.getQueriesData<InfiniteData<Page<InboxItem>>>({ queryKey: ['inbox', 'feed'] })) {
        snaps.push([key, data]);
        if (data?.pages)
          qc.setQueryData(key, {
            ...data,
            pages: data.pages.map((p) => ({ ...p, content: p.content.map((e) => (e.id === id ? { ...e, isRead: read } : e)) })),
          });
      }
      const dk = qk.inbox.detail(id);
      const d = qc.getQueryData<EmailDetail>(dk);
      if (d) {
        snaps.push([dk, d]);
        qc.setQueryData(dk, { ...d, isRead: read });
      }
      for (const [key, data] of qc.getQueriesData<EmailDetail[]>({ queryKey: ['applications', 'detail'] })) {
        if (Array.isArray(data) && key[3] === 'emails') {
          snaps.push([key, data]);
          qc.setQueryData(key, data.map((e) => (e.id === id ? { ...e, isRead: read } : e)));
        }
      }
      return { snaps };
    },
    onError: (e, _v, ctx) => {
      ctx?.snaps.forEach(([k, d]) => qc.setQueryData(k, d));
      toast.error('Could not update email', { description: errorMessage(e) });
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: qk.inbox.counts() });
      void qc.invalidateQueries({ queryKey: qk.notifications.all });
      void qc.invalidateQueries({ queryKey: qk.dashboard.attention() });
    },
  });
}

function useInboxMutationBase() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: qk.inbox.all });
    invalidateApplicationData(qc);
    void qc.invalidateQueries({ queryKey: ['applications', 'detail'] });
  };
}

export function useMergeEmail() {
  const refresh = useInboxMutationBase();
  return useMutation({
    mutationFn: ({ id, applicationId }: { id: number; applicationId: number }) => inboxApi.merge(id, applicationId),
    onSuccess: (email) => {
      refresh();
      toast.success('Email linked to application', {
        description: email.companyName ? `${email.companyName}${email.applicationJobTitle ? ` — ${email.applicationJobTitle}` : ''}` : undefined,
      });
    },
    onError: (e) => toast.error('Merge failed', { description: errorMessage(e) }),
  });
}

export function useCreateApplicationFromEmail() {
  const refresh = useInboxMutationBase();
  return useMutation({
    mutationFn: (id: number) => inboxApi.createApplication(id),
    onSuccess: (app) => {
      refresh();
      toast.success('Application created', { description: `${app.companyName} — ${app.jobTitle}` });
    },
    onError: (e) => toast.error('Could not create application', { description: errorMessage(e) }),
  });
}

export function useIgnoreEmail() {
  const refresh = useInboxMutationBase();
  return useMutation({
    mutationFn: (id: number) => inboxApi.ignore(id),
    onSuccess: () => {
      refresh();
      toast.success('Email ignored', { description: 'Marked as not job related and removed from your inbox.' });
    },
    onError: (e) => toast.error('Could not ignore email', { description: errorMessage(e) }),
  });
}

export function useReclassifyEmail() {
  const refresh = useInboxMutationBase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, classification }: { id: number; classification: EmailClassification }) =>
      inboxApi.reclassify(id, classification),
    onSuccess: (email) => {
      qc.setQueryData(qk.inbox.detail(email.id), email);
      refresh();
      toast.success(`Reclassified as ${CLASSIFICATION_META[email.classification].label}`);
    },
    onError: (e) => toast.error('Could not reclassify', { description: errorMessage(e) }),
  });
}

export function useDeleteEmail() {
  const refresh = useInboxMutationBase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => inboxApi.remove(id),
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: qk.inbox.detail(id) });
      refresh();
      toast.success('Email deleted');
    },
    onError: (e) => toast.error('Could not delete email', { description: errorMessage(e) }),
  });
}
