import type { ApiResponse } from '@/types';

/** Base URL of the ANIMUS API. Defaults to the same-origin `/api` path, which
 * the proxy (nginx in prod, Vite in dev) forwards to the backend; override with
 * `VITE_API_URL`. */
export const API_URL = import.meta.env.VITE_API_URL ?? '/api';

/** Fetch wrapper that unwraps the shared `ApiResponse<T>` envelope. */
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        // Soft admin flag so the API also returns titles that aren't `ready` yet.
        'X-Admin-Request': 'true',
        ...(init?.headers as Record<string, string> | undefined),
      },
    });
  } catch {
    throw new Error('Unable to reach the API. Is it running on ' + API_URL + '?');
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
