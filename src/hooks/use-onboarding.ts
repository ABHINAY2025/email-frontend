import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, onboardingApi } from '@/api/auth';
import { useAuth } from '@/hooks/use-auth';
import { useEmailAccounts, useSyncStatus } from '@/hooks/use-queries';
import { ApiClientError } from '@/lib/api';
import { readTicks, writeTicks, type ManualTicks } from '@/lib/onboarding';
import { qk } from '@/lib/query-keys';
import type { AuthConfig, OnboardingStatus } from '@/types/api';

/** 4xx means "this backend doesn't support it" — don't retry those. */
const retryUnlessClientError = (count: number, e: unknown) =>
  !(e instanceof ApiClientError && e.status >= 400 && e.status < 500) && count < 1;

/**
 * Public auth config. Any failure (older backend → 404/401, network) degrades to
 * `registrationEnabled: false`, which simply hides the sign-up entry points.
 */
export function useAuthConfig() {
  return useQuery({
    queryKey: qk.authConfig,
    queryFn: async (): Promise<AuthConfig> => {
      try {
        const cfg = await authApi.config();
        return { registrationEnabled: !!cfg?.registrationEnabled };
      } catch {
        return { registrationEnabled: false };
      }
    },
    staleTime: 10 * 60_000,
    retry: 0,
    refetchOnWindowFocus: false,
  });
}

/** Server onboarding status. `isError` (e.g. 404 on an older backend) means "don't prompt". */
export function useOnboarding() {
  const { user } = useAuth();
  return useQuery({
    queryKey: qk.onboarding,
    queryFn: onboardingApi.status,
    enabled: !!user,
    staleTime: 30_000,
    retry: retryUnlessClientError,
    // Poll while the first sync runs (SSE also invalidates this key).
    refetchInterval: (q) => (q.state.data?.syncInProgress ? 5_000 : false),
  });
}

/**
 * Status for the guide page itself. Falls back to a status derived from email accounts + sync
 * status when the onboarding endpoint is unavailable, so the guide still works on older backends.
 */
export function useOnboardingStatusWithFallback(): {
  status: OnboardingStatus | null;
  isLoading: boolean;
  fromServer: boolean;
} {
  const onboarding = useOnboarding();
  const fallbackEnabled = onboarding.isError;
  const accounts = useEmailAccounts();
  const sync = useSyncStatus();

  return useMemo(() => {
    if (onboarding.data) return { status: onboarding.data, isLoading: false, fromServer: true };
    if (!fallbackEnabled) return { status: null, isLoading: true, fromServer: false };
    if (!accounts.data) return { status: null, isLoading: accounts.isPending, fromServer: false };
    const real = accounts.data.filter((a) => a.provider !== 'DEMO');
    const hasEmailAccount = real.length > 0;
    const firstSyncCompleted =
      !!sync.data?.recentJobs.some((j) => j.status === 'COMPLETED') || real.some((a) => !!a.lastSyncAt);
    const syncInProgress = sync.data?.state === 'SYNCING' || real.some((a) => a.syncStatus === 'SYNCING');
    return {
      status: {
        hasEmailAccount,
        firstSyncCompleted,
        syncInProgress,
        hasApplications: false,
        dismissed: false,
        completed: hasEmailAccount && firstSyncCompleted,
      },
      isLoading: false,
      fromServer: false,
    };
  }, [onboarding.data, fallbackEnabled, accounts.data, accounts.isPending, sync.data]);
}

function useSetDismissed(dismissed: boolean) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => (dismissed ? onboardingApi.dismiss() : onboardingApi.reset()),
    onMutate: () => {
      const prev = qc.getQueryData<OnboardingStatus>(qk.onboarding);
      if (prev) qc.setQueryData<OnboardingStatus>(qk.onboarding, { ...prev, dismissed });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      // Older backend without the endpoint: keep the optimistic state for this session only.
      if (ctx?.prev && !(_e instanceof ApiClientError && _e.status === 404)) qc.setQueryData(qk.onboarding, ctx.prev);
    },
    onSettled: (_d, e) => {
      if (!e) void qc.invalidateQueries({ queryKey: qk.onboarding });
    },
  });
}

/** POST /api/onboarding/dismiss — hides the guide and the dashboard checklist. */
export const useDismissOnboarding = () => useSetDismissed(true);
/** POST /api/onboarding/reset — re-opens the guide. */
export const useResetOnboarding = () => useSetDismissed(false);

/** "I've done this" ticks for steps the server can't detect, persisted in localStorage per user. */
export function useManualTicks(): [ManualTicks, (patch: Partial<ManualTicks>) => void] {
  const { user } = useAuth();
  const [ticks, setTicks] = useState<ManualTicks>(() => readTicks(user));
  useEffect(() => setTicks(readTicks(user)), [user]);
  const update = useCallback(
    (patch: Partial<ManualTicks>) =>
      setTicks((prev) => {
        const next = { ...prev, ...patch };
        writeTicks(user, next);
        return next;
      }),
    [user],
  );
  return [ticks, update];
}
