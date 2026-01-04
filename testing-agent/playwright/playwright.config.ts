import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['json', { outputFile: 'results.json' }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list']
  ],
  use: {
    baseURL: process.env.TARGET_URL || 'https://variablelib.com',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    // Desktop browsers
    {
      name: 'chromium-desktop-1920',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'chromium-desktop-1366',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 }
      },
    },
    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    // Tablet
    {
      name: 'chromium-tablet',
      use: {
        ...devices['iPad Pro 11'],
      },
    },
    // Mobile
    {
      name: 'chromium-mobile-360',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 360, height: 800 }
      },
    },
    {
      name: 'chromium-mobile-390',
      use: {
        ...devices['iPhone 14'],
      },
    },
    {
      name: 'webkit-mobile',
      use: {
        ...devices['iPhone 14'],
      },
    },
  ],
});
