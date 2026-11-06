import { expect, test, type Page } from '@playwright/test';
import { weatherFixture } from '../src/test/fixtures';
test('search → automatic weather update, retry and responsive layout', async ({ page }) => {
  let fail = false;
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({ status: fail ? 503 : 200, json: weatherFixture }),
  );
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: {
        results: [
          {
            id: 2643743,
            name: 'London',
            country: '英国',
            admin1: 'England',
            latitude: 51.5085,
            longitude: -0.1257,
          },
          {
            id: 6058560,
            name: 'London',
            country: '加拿大',
            admin1: 'Ontario',
            latitude: 42.98,
            longitude: -81.23,
          },
        ],
      },
    }),
  );
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '7 天天气预报' })).toBeVisible();
  await expect(page.locator('.forecast-card')).toHaveCount(7);
  await page.getByLabel('想了解哪里的天气？').fill('London');
  await page.getByLabel('想了解哪里的天气？').press('Enter');
  await expect(page.locator('.search-results')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /London.*英国/ })).toBeVisible();
  await expect(page.locator('.temperature')).toHaveText('24°');
  await expect(page.locator('.details-note')).toContainText('当地时间 · UTC+08:00');
  fail = true;
  await page.getByRole('button', { name: '刷新天气' }).click();
  await expect(page.getByRole('alert')).toContainText('天气服务暂时不可用');
  fail = false;
  await page.getByRole('button', { name: /重新尝试/ }).click();
  await expect(page.getByRole('heading', { name: '7 天天气预报' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: `test-results/weather-${test.info().project.name}.png`,
    fullPage: true,
  });
});
test('weather loading, search error and empty results', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('https://api.open-meteo.com/**', async (route) => {
    await gate;
    await route.fulfill({ json: weatherFixture });
  });
  let searchFails = true;
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ status: searchFails ? 429 : 200, json: {} }),
  );
  await page.goto('/');
  await expect(page.getByRole('status').filter({ hasText: '正在获取' })).toBeVisible();
  release();
  await expect(page.getByRole('heading', { name: '7 天天气预报' })).toBeVisible();
  await page.getByLabel('想了解哪里的天气？').fill('Anywhere');
  await page.getByRole('button', { name: /搜索地点/ }).click();
  await expect(page.getByRole('alert')).toContainText('查询过于频繁');
  searchFails = false;
  await page.getByRole('button', { name: /重新尝试/ }).click();
  await expect(page.getByText(/没有找到/)).toBeVisible();
});

test('switches all four languages, translates errors, and remembers Cantonese', async ({
  page,
}) => {
  let fail = false;
  let forecastRequests = 0;
  await page.route('https://api.open-meteo.com/**', (route) => {
    forecastRequests++;
    return route.fulfill({ status: fail ? 503 : 200, json: weatherFixture });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '7 天天气预报' })).toBeVisible();
  const requestsBeforeSwitch = forecastRequests;
  await chooseLanguage(page, 'English');
  await expect(page.getByRole('heading', { name: '7-day forecast' })).toBeVisible();
  await expect(page.locator('.forecast-day').nth(3)).toHaveText('Sun');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(forecastRequests).toBe(requestsBeforeSwitch);
  fail = true;
  await page.getByRole('button', { name: 'Refresh weather' }).click();
  await expect(page.getByRole('alert')).toContainText('temporarily unavailable');
  await chooseLanguage(page, '粵語');
  await expect(page.getByRole('alert')).toContainText('天氣服務暫時用唔到');
  fail = false;
  await page.getByRole('button', { name: /再試一次/ }).click();
  await expect(page.getByRole('heading', { name: '7 日天氣預報' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: '介面語言' }).click();
  await expect(page.getByRole('menuitemradio', { name: '粵語' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).toHaveAttribute('lang', 'yue-Hant');
  await expect(page.getByText('想睇邊度嘅天氣？')).toBeVisible();
  await chooseLanguage(page, '繁體中文');
  await expect(page.getByRole('heading', { name: '7 天天氣預報' })).toBeVisible();
  await chooseLanguage(page, '简体中文');
  await expect(page.getByRole('heading', { name: '7 天天气预报' })).toBeVisible();
});

async function chooseLanguage(page: Page, label: string) {
  await page.getByRole('button', { name: /^(界面语言|介面語言|Interface language)$/ }).click();
  await page.getByRole('menuitemradio', { name: label, exact: true }).click();
}

test('language menu stays centered inside narrow and short viewports and supports keyboard dismissal', async ({
  page,
}) => {
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({ json: weatherFixture }),
  );
  await page.goto('/');
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 568, height: 220 },
  ]) {
    await page.setViewportSize(viewport);
    const trigger = page.getByRole('button', { name: '界面语言' });
    await trigger.click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    const bounds = await menu.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(8);
    expect(bounds!.y).toBeGreaterThanOrEqual(8);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width - 8);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height - 8);
    expect(Math.abs(bounds!.x + bounds!.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(1);
    expect(Math.abs(bounds!.y + bounds!.height / 2 - viewport.height / 2)).toBeLessThanOrEqual(1);
    await page.keyboard.press('End');
    await expect(page.getByRole('menuitemradio', { name: 'English' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).not.toBeVisible();
    await expect(trigger).toBeFocused();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: '界面语言' }).click();
  await page.getByRole('heading', { level: 1 }).click();
  await expect(page.getByRole('menu')).not.toBeVisible();
});
