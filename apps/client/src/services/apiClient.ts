import type { ApiResponse } from '@/types';

/** Base URL of the ANIMUS API. Defaults to the same-origin `/api` path, which
 * the proxy (nginx in prod, Vite in dev) forwards to the backend; override with
 * `VITE_API_URL`. */
export const API_URL = import.meta.env.VITE_API_URL ?? '/api';

/**
 * Thin fetch wrapper that unwraps the shared `ApiResponse<T>` envelope and
 * throws a friendly `Error` on failure, so callers receive `T` directly.
 */
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers as Record<string, string> | undefined),
      },
    });
  } catch {
    throw new Error('Unable to reach the server. Please check your connection.');
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || !payload.success) {
    throw new Error(payload?.error ?? `Request failed (${response.status})`);
  }

  return payload.data as T;
}
