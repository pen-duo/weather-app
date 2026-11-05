import { localeTags, type Locale } from '../i18n/Language';
export function number(value: number | null, suffix = '') {
  return value === null ? '—' : `${Math.round(value)}${suffix}`;
}
export function weekdayLabel(value: string, locale: Locale = 'zh-CN') {
  return new Intl.DateTimeFormat(localeTags[locale], { weekday: 'short', timeZone: 'UTC' }).format(
    new Date(`${value}T12:00:00Z`),
  );
}
export function dateLabel(value: string, locale: Locale = 'zh-CN') {
  // API dates are calendar dates at the destination, not timestamps in the browser's timezone.
  const weekday = weekdayLabel(value, locale);
  return `${shortDateLabel(value, locale)} ${weekday}`;
}
export type WeatherIconKind =
  'sun' | 'moon' | 'cloud' | 'rain' | 'snow' | 'storm' | 'fog' | 'unknown';
export function condition(
  code: number | null,
  isDay: number | null = 1,
): { label: string; icon: WeatherIconKind } {
  if (code === 0) return { label: '晴朗', icon: isDay === 0 ? 'moon' : 'sun' };
  if (code === 1) return { label: '大部晴朗', icon: isDay === 0 ? 'moon' : 'sun' };
  if (code === 2) return { label: '局部多云', icon: 'cloud' };
  if (code === 3) return { label: '阴天', icon: 'cloud' };
  if (code === 45 || code === 48) return { label: code === 48 ? '雾凇' : '雾', icon: 'fog' };
  if ([51, 53, 55].includes(code ?? -1)) return { label: '毛毛雨', icon: 'rain' };
  if ([56, 57, 66, 67].includes(code ?? -1)) return { label: '冻雨', icon: 'rain' };
  if ([61, 63, 65].includes(code ?? -1)) return { label: '雨', icon: 'rain' };
  if ([80, 81, 82].includes(code ?? -1)) return { label: '阵雨', icon: 'rain' };
  if ([71, 73, 75, 77, 85, 86].includes(code ?? -1)) return { label: '雪', icon: 'snow' };
  if ([95, 96, 99].includes(code ?? -1))
    return { label: code === 95 ? '雷雨' : '雷雨伴冰雹', icon: 'storm' };
  return { label: '天气状况暂缺', icon: 'unknown' };
}

export function shortDateLabel(value: string, locale: Locale = 'zh-CN') {
  if (locale !== 'en') return `${Number(value.slice(5, 7))}月${Number(value.slice(8))}日`;
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`));
}
