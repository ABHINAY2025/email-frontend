import { api } from '@/lib/api';
import type { AuthConfig, CurrentUser, HealthResponse, LoginRequest, OnboardingStatus, RegisterRequest } from '@/types/api';

export const authApi = {
  me: () => api.get<CurrentUser>('/auth/me', undefined, { skipAuthRedirect: true }),
  login: (body: LoginRequest) => api.post<CurrentUser>('/auth/login', body, { skipAuthRedirect: true }),
  register: (body: RegisterRequest) => api.post<CurrentUser>('/auth/register', body, { skipAuthRedirect: true }),
  config: () => api.get<AuthConfig>('/auth/config', undefined, { skipAuthRedirect: true }),
  logout: () => api.post<void>('/auth/logout'),
};

export const onboardingApi = {
  // skipAuthRedirect: older backends don't have this endpoint; a failure here must never log the user out.
  status: () => api.get<OnboardingStatus>('/onboarding', undefined, { skipAuthRedirect: true }),
  dismiss: () => api.post<void>('/onboarding/dismiss', undefined, { skipAuthRedirect: true }),
  reset: () => api.post<void>('/onboarding/reset', undefined, { skipAuthRedirect: true }),
};

export const healthApi = {
  get: () => api.get<HealthResponse>('/health', undefined, { skipAuthRedirect: true }),
};
