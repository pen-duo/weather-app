import { z } from 'zod';

export interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}
export const DEFAULT_LOCATION: Location = {
  id: 1819729,
  name: '香港',
  latitude: 22.27832,
  longitude: 114.17469,
  country: '中国香港',
};
const measurement = z.number().finite().nullable();
const locationSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  country: z.string().optional(),
  admin1: z.string().optional(),
});
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const weatherSchema = z.object({
  timezone: z.string().min(1),
  current: z.object({
    time: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
    temperature_2m: measurement,
    apparent_temperature: measurement,
    relative_humidity_2m: z.number().min(0).max(100).nullable(),
    wind_speed_10m: z.number().nonnegative().nullable(),
    weather_code: z.number().int().nullable(),
    is_day: z.union([z.literal(0), z.literal(1)]).nullable(),
  }),
  daily: z
    .object({
      time: z.array(date).min(1).max(7),
      weather_code: z.array(z.number().int().nullable()),
      temperature_2m_max: z.array(measurement),
      temperature_2m_min: z.array(measurement),
      precipitation_probability_max: z.array(z.number().min(0).max(100).nullable()),
    })
    .superRefine((d, ctx) => {
      for (const key of [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_probability_max',
      ] as const) {
        if (d[key].length !== d.time.length)
          ctx.addIssue({ code: 'custom', message: 'Forecast array lengths differ', path: [key] });
      }
      if (d.time.some((value, i) => i > 0 && value <= d.time[i - 1]))
        ctx.addIssue({ code: 'custom', message: 'Dates must be increasing' });
    }),
});
export type Weather = z.infer<typeof weatherSchema>;
export class ApiError extends Error {
  constructor(public readonly kind: 'network' | 'timeout' | 'rate-limit' | 'server' | 'invalid') {
    super(
      {
        network: '无法连接天气服务，请检查网络后重试。',
        timeout: '请求超时，请稍后重试。',
        'rate-limit': '查询过于频繁，请稍等片刻后重试。',
        server: '天气服务暂时不可用，请稍后重试。',
        invalid: '天气服务返回的数据不完整，请重试。',
      }[kind],
    );
    this.name = 'ApiError';
  }
}
export const REQUEST_TIMEOUT = 12_000;
export async function requestJson(url: URL, signal: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new ApiError(response.status === 429 ? 'rate-limit' : 'server');
    try {
      return await response.json();
    } catch (error) {
      if (controller.signal.aborted) throw error;
      throw new ApiError('invalid');
    }
  } catch (error) {
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    if (timedOut) throw new ApiError('timeout');
    if (error instanceof ApiError) throw error;
    throw new ApiError('network');
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
  }
}
export async function searchLocations(
  query: string,
  signal: AbortSignal,
  language: 'zh' | 'en' = 'zh',
): Promise<Location[]> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.search = new URLSearchParams({
    name: query.trim(),
    count: '8',
    language,
    format: 'json',
  }).toString();
  const parsed = z
    .object({ results: z.array(locationSchema).optional(), error: z.literal(false).optional() })
    .safeParse(await requestJson(url, signal));
  if (!parsed.success) throw new ApiError('invalid');
  return parsed.data.results ?? [];
}
export async function getWeather(location: Location, signal: AbortSignal): Promise<Weather> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current:
      'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '7',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
  }).toString();
  const parsed = weatherSchema.safeParse(await requestJson(url, signal));
  if (!parsed.success) throw new ApiError('invalid');
  return parsed.data;
}
