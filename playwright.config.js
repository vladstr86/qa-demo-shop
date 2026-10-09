import { defineConfig } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173/';
const selectedURL = new URL(baseURL);
const isLocalSite = ['localhost', '127.0.0.1'].includes(selectedURL.hostname);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  metadata: {
    targetURL: `${selectedURL.origin}${selectedURL.pathname}`,
    targetType: isLocalSite ? 'local' : 'deployed',
  },
  reporter: [['list'], ['html', { open: 'always' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium-desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } } },
    {
      name: 'chromium-mobile',
      testIgnore: '**/*.desktop.spec.js',
      use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
  ...(isLocalSite ? {
    webServer: {
      command: 'node scripts/serve.mjs',
      url: selectedURL.origin,
      env: { PORT: selectedURL.port || (selectedURL.protocol === 'https:' ? '443' : '80') },
      reuseExistingServer: !process.env.CI,
      timeout: 10000,
    },
  } : {}),
});
