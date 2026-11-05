import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { LocationSearch } from './LocationSearch';
import { DEFAULT_LOCATION } from '../api/weather';
afterEach(() => vi.unstubAllGlobals());
it('validates, searches by keyboard, then selects a result', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify({ results: [DEFAULT_LOCATION] })));
  vi.stubGlobal('fetch', fetchMock);
  const select = vi.fn();
  const user = userEvent.setup();
  render(<LocationSearch onSelect={select} />);
  await user.click(screen.getByRole('button', { name: /搜索地点/ }));
  expect(screen.getByText('请输入至少 2 个字符的地点名称。')).toBeVisible();
  expect(fetchMock).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText('想了解哪里的天气？'), '香港{Enter}');
  await user.click(await screen.findByRole('button', { name: /中国香港/ }));
  expect(select).toHaveBeenCalledWith(DEFAULT_LOCATION);
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
