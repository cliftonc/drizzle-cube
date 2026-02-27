import { defineConfig, devices } from '@playwright/test'

/**
 * E2E test configuration for drizzle-cube dev site.
 *
 * Tests run against the Vite dev server (port 5173). The dev server proxies
 * /cubejs-api and /api to localhost:3001, but individual tests intercept
 * those requests via page.route() so no real backend is required.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  /** Fail fast in CI on any unexpected test.only() calls */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  /** Start the Vite dev server before running tests. Re-uses a running server
   *  outside CI so local development doesn't need to restart it. */
  webServer: {
    command: 'npm run dev:client',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 60_000,
  },
})
