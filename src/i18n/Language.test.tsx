import { expect, it, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider, useLanguage, translate } from './Language';
import { messages } from './messages';
import { shortDateLabel, weekdayLabel } from '../lib/format';
afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
it('keeps interpolation placeholders complete in every translation', () => {
  for (const [key, values] of Object.entries(messages)) {
    const placeholders = key.match(/\{\w+\}/g)?.sort() ?? [];
    for (const text of Object.values(values))
      expect(text.match(/\{\w+\}/g)?.sort() ?? []).toEqual(placeholders);
  }
  expect(translate('yue', '正在获取{name}的天气…', { name: '香港' })).toBe('查緊香港嘅天氣…');
  expect(shortDateLabel('2026-11-08', 'en')).toBe('8 Nov');
  expect(weekdayLabel('2026-11-08', 'en')).toBe('Sun');
});
it('switches language when persistent storage is blocked', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  function Example() {
    const { t, setLocale } = useLanguage();
    return <button onClick={() => setLocale('yue')}>{t('搜索地点')}</button>;
  }
  render(
    <LanguageProvider>
      <Example />
    </LanguageProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: '搜索地点' }));
  expect(screen.getByRole('button', { name: '搵地點' })).toBeVisible();
  expect(document.documentElement.lang).toBe('yue-Hant');
});
