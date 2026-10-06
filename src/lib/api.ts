import type { ApiError } from '@/types/api';

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: Record<string, string> | null;
  readonly timestamp: string | null;

  constructor(init: { status: number; code: string; message: string; fieldErrors?: Record<string, string> | null; timestamp?: string | null }) {
    super(init.message);
    this.name = 'ApiClientError';
    this.status = init.status;
    this.code = init.code;
    this.fieldErrors = init.fieldErrors ?? null;
    this.timestamp = init.timestamp ?? null;
  }
}

export function isApiError(e: unknown): e is ApiClientError {
  return e instanceof ApiClientError;
}

/** Friendly message for any thrown value — never a stack trace. */
export function errorMessage(e: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (e instanceof ApiClientError) return e.message || fallback;
  if (e instanceof TypeError) return 'Unable to reach the server. Check your connection.';
  return fallback;
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;
export function setUnauthorizedHandler(fn: UnauthorizedHandler | null) {
  onUnauthorized = fn;
}

function readCookie(name: string): string | null {
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

let csrfPromise: Promise<void> | null = null;

/** Prime the XSRF-TOKEN cookie (idempotent; re-run with force after login/logout). */
export function primeCsrf(force = false): Promise<void> {
  if (!csrfPromise || force) {
    csrfPromise = fetch('/api/auth/csrf', { credentials: 'include' })
      .then(() => undefined)
      .catch(() => undefined);
  }
  return csrfPromise;
}

type Query = Record<string, string | number | boolean | null | undefined | (string | number)[]>;

export function buildQuery(params?: Query): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) {
      if (v.length) sp.set(k, v.join(','));
    } else {
      sp.set(k, String(v));
    }
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
  /** Do not trigger the global 401 handler (used by auth probes). */
  skipAuthRedirect?: boolean;
}

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

async function parseError(res: Response): Promise<ApiClientError> {
  let body: Partial<ApiError> | null = null;
  try {
    const text = await res.text();
    body = text ? (JSON.parse(text) as Partial<ApiError>) : null;
  } catch {
    body = null;
  }
  const fallback =
    res.status === 502 || res.status === 503 || res.status === 504 || (res.status >= 500 && !body)
      ? 'The server is unavailable right now. Please try again shortly.'
      : res.status === 404
        ? 'Not found.'
        : res.status === 401
          ? 'Your session has expired. Please sign in again.'
          : res.status === 403
            ? 'You do not have permission to do that.'
            : 'Something went wrong. Please try again.';
  return new ApiClientError({
    status: body?.status ?? res.status,
    code: body?.error ?? (res.status === 401 ? 'UNAUTHORIZED' : 'HTTP_' + res.status),
    message: body?.message || fallback,
    fieldErrors: body?.fieldErrors ?? null,
    timestamp: body?.timestamp ?? null,
  });
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const method = opts.method ?? 'GET';
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  if (MUTATING.has(method)) {
    let token = readCookie('XSRF-TOKEN');
    if (!token) {
      await primeCsrf(true);
      token = readCookie('XSRF-TOKEN');
    }
    if (token) headers['X-XSRF-TOKEN'] = token;
  }

  const doFetch = () =>
    fetch(`/api${path}${buildQuery(opts.query)}`, {
      method,
      headers,
      credentials: 'include',
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });

  let res = await doFetch();

  // A stale CSRF token yields 403 — refresh it once and retry.
  if (res.status === 403 && MUTATING.has(method)) {
    await primeCsrf(true);
    const token = readCookie('XSRF-TOKEN');
    if (token) {
      headers['X-XSRF-TOKEN'] = token;
      res = await doFetch();
    }
  }

  if (!res.ok) {
    const err = await parseError(res);
    if (res.status === 401 && !opts.skipAuthRedirect) onUnauthorized?.();
    throw err;
  }

  if (res.status === 204 || (res.status === 202 && res.headers.get('content-length') === '0')) {
    return undefined as T;
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  get: <T>(path: string, query?: Query, opts?: Omit<RequestOptions, 'method' | 'query'>) =>
    request<T>(path, { ...opts, method: 'GET', query }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T = void>(path: string, query?: Query) => request<T>(path, { method: 'DELETE', query }),
};
