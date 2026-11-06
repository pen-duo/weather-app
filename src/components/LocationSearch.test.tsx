import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { LocationSearch } from './LocationSearch';
import { DEFAULT_LOCATION } from '../api/weather';
afterEach(() => vi.unstubAllGlobals());
it('validates and updates weather from the first match without another click', async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        results: [DEFAULT_LOCATION, { ...DEFAULT_LOCATION, id: 2, name: '同名地点' }],
      }),
    ),
  );
  vi.stubGlobal('fetch', fetchMock);
  const select = vi.fn();
  const user = userEvent.setup();
  render(<LocationSearch onSelect={select} />);
  await user.click(screen.getByRole('button', { name: /搜索地点/ }));
  expect(screen.getByText('请输入至少 2 个字符的地点名称。')).toBeVisible();
  expect(fetchMock).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText('想了解哪里的天气？'), '香港{Enter}');
  await waitFor(() => expect(select).toHaveBeenCalledWith(DEFAULT_LOCATION));
  expect(select).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('button', { name: /中国香港/ })).not.toBeInTheDocument();
  expect(screen.queryByText(/选择地点 ·/)).not.toBeInTheDocument();
});
it('shows empty results and invalidates them when the query changes', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')));
  const user = userEvent.setup();
  render(<LocationSearch onSelect={vi.fn()} />);
  const input = screen.getByLabelText('想了解哪里的天气？');
  await user.type(input, '不存在{Enter}');
  expect(await screen.findByText(/没有找到/)).toBeVisible();
  await user.type(input, 'a');
  await waitFor(() => expect(screen.queryByText(/没有找到/)).not.toBeInTheDocument());
});

it('ignores an earlier search that finishes after a newer search', async () => {
  let finishOld!: (response: Response) => void;
  const next = { ...DEFAULT_LOCATION, id: 23, name: '广州' };
  const fetchMock = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finishOld = resolve;
        }),
    )
    .mockResolvedValueOnce(new Response(JSON.stringify({ results: [next] })));
  vi.stubGlobal('fetch', fetchMock);
  const select = vi.fn();
  const user = userEvent.setup();
  render(<LocationSearch onSelect={select} />);
  const input = screen.getByLabelText('想了解哪里的天气？');
  await user.type(input, '上海{Enter}');
  await user.clear(input);
  await user.type(input, '广州{Enter}');
  await waitFor(() => expect(select).toHaveBeenCalledWith(next));
  finishOld(new Response(JSON.stringify({ results: [DEFAULT_LOCATION] })));
  await waitFor(() => expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true));
  expect(select).toHaveBeenCalledTimes(1);
});

it('keeps a failed search retryable and updates weather after retry', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [DEFAULT_LOCATION] }))),
  );
  const select = vi.fn();
  const user = userEvent.setup();
  render(<LocationSearch onSelect={select} />);
  await user.type(screen.getByLabelText('想了解哪里的天气？'), '香港{Enter}');
  expect(await screen.findByRole('alert')).toHaveTextContent('无法连接天气服务');
  expect(select).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: /重新尝试/ }));
  await waitFor(() => expect(select).toHaveBeenCalledWith(DEFAULT_LOCATION));
  expect(screen.getByLabelText('想了解哪里的天气？')).toHaveValue('香港');
});
