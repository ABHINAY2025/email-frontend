import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { ApiClientError, primeCsrf, setUnauthorizedHandler } from '@/lib/api';
import { qk } from '@/lib/query-keys';
import { clearOnboardingSessionFlags } from '@/lib/onboarding';
import type { CurrentUser, LoginRequest, RegisterRequest } from '@/types/api';

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  /** Set when the auth probe failed for a reason other than 401 (e.g. backend down). */
  probeError: Error | null;
  login: (body: LoginRequest) => Promise<CurrentUser>;
  /** Creates the account; the backend also signs the new user in. */
  register: (body: RegisterRequest) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const meQuery = useQuery({
    queryKey: qk.me,
    queryFn: async () => {
      await primeCsrf();
      try {
        return await authApi.me();
      } catch (e) {
        if (e instanceof ApiClientError && (e.status === 401 || e.status === 403)) return null;
        throw e;
      }
    },
    staleTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Any 401 from the API drops the session and sends the user to /login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (qc.getQueryData(qk.me) === null) return;
      qc.setQueryData(qk.me, null);
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        const from = window.location.pathname + window.location.search;
        navigate(`/login?from=${encodeURIComponent(from)}`, { replace: true });
      }
    });
    return () => setUnauthorizedHandler(null);
  }, [qc, navigate]);

  /** Session id rotates on login/register → refresh CSRF and drop any data cached for a previous user. */
  const startSession = useCallback(
    async (user: CurrentUser) => {
      await primeCsrf(true);
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
      clearOnboardingSessionFlags();
      qc.setQueryData(qk.me, user);
      return user;
    },
    [qc],
  );

  const login = useCallback(
    async (body: LoginRequest) => {
      await primeCsrf();
      return startSession(await authApi.login(body));
    },
    [startSession],
  );

  const register = useCallback(
    async (body: RegisterRequest) => {
      await primeCsrf();
      return startSession(await authApi.register(body));
    },
    [startSession],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* session may already be gone */
    }
    qc.setQueryData(qk.me, null);
    qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
    clearOnboardingSessionFlags();
    await primeCsrf(true);
    navigate('/login', { replace: true });
  }, [qc, navigate]);


  const value = useMemo<AuthContextValue>(
    () => ({
      user: meQuery.data ?? null,
      isLoading: meQuery.isLoading,
      probeError: meQuery.isError ? (meQuery.error as Error) : null,
      login,
      register,
      logout,
      retry: () => void meQuery.refetch(),
    }),
    [meQuery.data, meQuery.isLoading, meQuery.isError, meQuery.error, login, register, logout, meQuery],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
