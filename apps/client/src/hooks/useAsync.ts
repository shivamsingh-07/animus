import { useCallback, useEffect, useState, type DependencyList } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseAsyncOptions {
  /** Keep prior data visible while a new request is in flight. */
  keepPreviousData?: boolean;
}

/**
 * Runs an async `factory` whenever `deps` change, exposing a tidy
 * `{ data, loading, error, reload }` tuple. Stale resolutions are ignored so
 * rapid dependency changes (e.g. typing in search) never cause flicker.
 */
export function useAsync<T>(
  factory: () => Promise<T>,
  deps: DependencyList,
  options: UseAsyncOptions = {},
) {
  const { keepPreviousData = false } = options;
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    setState((prev) => ({
      data: keepPreviousData ? prev.data : null,
      loading: true,
      error: null,
    }));

    factory()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (active) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      });

    return () => {
      active = false;
    };
    // `factory` is intentionally excluded; the caller keys re-runs via `deps`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce, keepPreviousData]);

  return { ...state, reload };
}
