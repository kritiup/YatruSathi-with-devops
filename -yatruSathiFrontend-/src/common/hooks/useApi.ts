import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '../utils/errors';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Runs an async request and tracks {data, loading, error}, converting any
 * thrown error into a display string. `deps` controls re-fetching; pass
 * `{ immediate: false }` to trigger manually via the returned `run`.
 */
export function useApi<T>(
  request: () => Promise<T>,
  deps: unknown[] = [],
  options: { immediate?: boolean } = {}
) {
  const { immediate = true } = options;
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /* eslint-disable react-hooks/exhaustive-deps -- caller-supplied `deps` array is the contract */
  const run = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await request();
      if (mounted.current) setState({ data, loading: false, error: null });
      return data;
    } catch (err) {
      if (mounted.current) {
        setState(s => ({ ...s, loading: false, error: getApiErrorMessage(err) }));
      }
      throw err;
    }
  }, deps);

  useEffect(() => {
    if (immediate) run().catch(() => undefined);
  }, [run, immediate]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return { ...state, run, setData: (data: T) => setState(s => ({ ...s, data })) };
}
