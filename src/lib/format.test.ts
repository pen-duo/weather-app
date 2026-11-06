import { describe, expect, it } from 'vitest';
import { condition, dateLabel, weekdayLabel, number, utcOffsetLabel } from './format';
describe('presentation semantics', () => {
  it('preserves zero and negative values and distinguishes missing values', () => {
    expect(number(0, '%')).toBe('0%');
    expect(number(-3.4, '°')).toBe('-3°');
    expect(number(null, '°')).toBe('—');
  });
  it('formats calendar dates independently of browser timezone', () => {
    expect(dateLabel('2026-11-05')).toContain('11月5日');
    expect(dateLabel('2026-11-05')).toContain('周四');
    expect(weekdayLabel('2026-11-08')).toBe('周日');
  });
  it('maps clear nights, freezing rain, thunderstorms and unknown codes', () => {
    expect(condition(0, 0).icon).toBe('moon');
    expect(condition(67).label).toBe('冻雨');
    expect(condition(99).icon).toBe('storm');
    expect(condition(999).icon).toBe('unknown');
    expect(condition(null).label).toBe('天气状况暂缺');
  });
});

it('formats destination offsets without implying a different city', () => {
  expect(utcOffsetLabel(28800)).toBe('UTC+08:00');
  expect(utcOffsetLabel(-12600)).toBe('UTC-03:30');
  expect(utcOffsetLabel(20700)).toBe('UTC+05:45');
  expect(utcOffsetLabel(0)).toBe('UTC+00:00');
});
