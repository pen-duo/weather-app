import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  globalTimeout: 120_000,
  use: {
    baseURL: 'http://127.0.0.1:4188',
    trace: 'retain-on-failure',
    ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4188 --strictPort',
    url: 'http://127.0.0.1:4188',
    reuseExistingServer: !process.env.CI,
  },
});
