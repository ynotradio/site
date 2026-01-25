import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E tests
 * Tests spin up Payload CMS and legacy PHP site with containerized/seeded databases
 */
export default defineConfig({
  testDir: './e2e',

  // Maximum time one test can run for
  timeout: 20 * 1000,

  // Maximum time for test fixtures (beforeAll, afterAll)
  expect: {
    timeout: 10 * 1000,
  },

  // Maximum time for the entire test suite
  globalTimeout: 30 * 60 * 1000, // 30 minutes

  // Run tests in files in parallel
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: process.env.CI ? [['html'], ['list'], ['github']] : [['html'], ['list']],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure - manual screenshots will be attached separately
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run global setup before all tests (start Docker services, seed databases)
  globalSetup: './e2e/global-setup.ts',

  // Run global teardown after all tests (stop Docker services)
  globalTeardown: './e2e/global-teardown.ts',

  // Web server configuration
  webServer: {
    command: 'yarn dev',
    url: 'http://localhost:3000/admin',
    timeout: 180 * 1000, // 3 minutes for slow Payload initialization
    reuseExistingServer: !process.env.CI, // Reuse existing server in local dev
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
