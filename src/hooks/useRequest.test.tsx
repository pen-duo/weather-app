import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/weather';
import { useRequest } from './useRequest';
describe('request lifecycle', () => {
  it('ignores a stale response even when the transport does not honor abort', async () => {
    let finishOld!: (value: string) => void;
    const old = vi.fn(
      (_signal: AbortSignal) =>
        new Promise<string>((resolve) => {
          finishOld = resolve;
        }),
    );
    const next = vi.fn(async (_signal: AbortSignal) => 'London');
    const { result, rerender } = renderHook(({ request }) => useRequest(request), {
      initialProps: { request: old as (signal: AbortSignal) => Promise<string> },
    });
    expect(result.current.state.status).toBe('loading');
    rerender({ request: next });
    expect(old.mock.calls[0][0].aborted).toBe(true);
    await waitFor(() =>
      expect(result.current.state).toEqual({ status: 'success', data: 'London' }),
    );
    await act(async () => {
      finishOld('Hong Kong');
    });
    expect(result.current.state).toEqual({ status: 'success', data: 'London' });
  });
  it('retries after failure and cancels on unmount', async () => {
    const request = vi
      .fn<(signal: AbortSignal) => Promise<string>>()
      .mockRejectedValueOnce(new ApiError('network'))
      .mockResolvedValueOnce('recovered');
    const { result, unmount } = renderHook(() => useRequest(request));
    await waitFor(() => expect(result.current.state.status).toBe('error'));
    act(() => result.current.retry());
    await waitFor(() =>
      expect(result.current.state).toEqual({ status: 'success', data: 'recovered' }),
    );
    unmount();
    expect(request.mock.calls[1][0].aborted).toBe(true);
  });
});
