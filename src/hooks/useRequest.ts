import { useEffect, useState } from 'react';
import { ApiError } from '../api/weather';
export type RequestState<T> =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };
/** A stable callback is the request identity. Cleanup both aborts and ignores stale responses. */
export function useRequest<T>(request: ((signal: AbortSignal) => Promise<T>) | null) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    request: typeof request;
    attempt: number;
    state: RequestState<T>;
  }>({ request: null, attempt: 0, state: { status: 'idle' } });
  useEffect(() => {
    if (!request) return;
    const controller = new AbortController();
    let active = true;
    request(controller.signal).then(
      (data) => {
        if (active) setResult({ request, attempt, state: { status: 'success', data } });
      },
      (error) => {
        if (active)
          setResult({
            request,
            attempt,
            state: {
              status: 'error',
              message: error instanceof ApiError ? error.message : '加载失败，请重试。',
            },
          });
      },
    );
    return () => {
      active = false;
      controller.abort();
    };
  }, [request, attempt]);
  // Never render a previous city's data beneath the newly selected city, even before effects run.
  const state: RequestState<T> = !request
    ? { status: 'idle' }
    : result.request === request && result.attempt === attempt
      ? result.state
      : { status: 'loading' };
  return { state, retry: () => setAttempt((n) => n + 1) };
}
