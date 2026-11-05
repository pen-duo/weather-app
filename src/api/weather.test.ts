import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_LOCATION,
  getWeather,
  requestJson,
  REQUEST_TIMEOUT,
  searchLocations,
} from './weather';
import { weatherFixture } from '../test/fixtures';
const signal = () => new AbortController().signal;
function respond(body: unknown, status = 200) {
  return vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })),
  );
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe('API contracts', () => {
  it('encodes search, returns disambiguating metadata, and accepts an empty result', async () => {
    respond({ results: [DEFAULT_LOCATION] });
    expect(await searchLocations(' 香港 ', signal())).toEqual([DEFAULT_LOCATION]);
    const url = vi.mocked(fetch).mock.calls[0][0] as URL;
    expect(url.searchParams.get('name')).toBe('香港');
    respond({});
    expect(await searchLocations('unknown', signal())).toEqual([]);
  });
  it('requests explicit units and destination timezone', async () => {
    respond(weatherFixture);
    expect(await getWeather(DEFAULT_LOCATION, signal())).toEqual(weatherFixture);
    const url = vi.mocked(fetch).mock.calls[0][0] as URL;
    expect(url.searchParams.get('timezone')).toBe('auto');
    expect(url.searchParams.get('temperature_unit')).toBe('celsius');
    expect(url.searchParams.get('forecast_days')).toBe('7');
  });
  it('accepts missing measurements without converting them to zero', async () => {
    respond({
      ...weatherFixture,
      current: { ...weatherFixture.current, temperature_2m: null, relative_humidity_2m: 0 },
    });
    const data = await getWeather(DEFAULT_LOCATION, signal());
    expect(data.current.temperature_2m).toBeNull();
    expect(data.current.relative_humidity_2m).toBe(0);
  });
  it('rejects mismatched arrays and incorrect measurement types', async () => {
    respond({ ...weatherFixture, daily: { ...weatherFixture.daily, weather_code: [0] } });
    await expect(getWeather(DEFAULT_LOCATION, signal())).rejects.toMatchObject({ kind: 'invalid' });
    respond({ ...weatherFixture, current: { ...weatherFixture.current, temperature_2m: '24' } });
    await expect(getWeather(DEFAULT_LOCATION, signal())).rejects.toMatchObject({ kind: 'invalid' });
  });
  it('does not interpret a provider error as no locations', async () => {
    respond({ error: true, reason: 'bad input' });
    await expect(searchLocations('London', signal())).rejects.toMatchObject({ kind: 'invalid' });
  });
  it.each([
    [429, 'rate-limit'],
    [503, 'server'],
  ])('handles HTTP %s', async (status, kind) => {
    respond({}, Number(status));
    await expect(getWeather(DEFAULT_LOCATION, signal())).rejects.toMatchObject({ kind });
  });
  it('handles malformed JSON and network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>unavailable')));
    await expect(getWeather(DEFAULT_LOCATION, signal())).rejects.toMatchObject({ kind: 'invalid' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(getWeather(DEFAULT_LOCATION, signal())).rejects.toMatchObject({ kind: 'network' });
  });
  it('times out stalled requests and propagates caller cancellation distinctly', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, options: RequestInit) =>
          new Promise((_resolve, reject) =>
            options.signal?.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            ),
          ),
      ),
    );
    const result = expect(
      requestJson(new URL('https://example.com'), signal()),
    ).rejects.toMatchObject({ kind: 'timeout' });
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT);
    await result;
    const controller = new AbortController();
    const cancelled = expect(
      requestJson(new URL('https://example.com'), controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await cancelled;
    expect(vi.getTimerCount()).toBe(0);
  });
});
