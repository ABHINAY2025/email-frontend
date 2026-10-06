import { api } from '@/lib/api';
import type { CurrentUser, HealthResponse, LoginRequest } from '@/types/api';

export const authApi = {
  me: () => api.get<CurrentUser>('/auth/me', undefined, { skipAuthRedirect: true }),
  login: (body: LoginRequest) => api.post<CurrentUser>('/auth/login', body, { skipAuthRedirect: true }),
  logout: () => api.post<void>('/auth/logout'),
};

export const healthApi = {
  get: () => api.get<HealthResponse>('/health', undefined, { skipAuthRedirect: true }),
};
