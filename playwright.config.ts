import { defineConfig, devices } from '@playwright/test';

// Path to store authenticated session state
const authFile = './e2e/.auth/payload-session.json';

/**
 * Playwright configuration for E2E tests
 * Tests spin up Payload CMS and legacy PHP site with containerized/seeded databases
 *
 * Authentication Strategy:
 * - The 'setup' project logs in once and saves session state
 * - All other projects reuse this state, avoiding repeated logins
 * @see https://playwright.dev/docs/auth
 */
export default defineConfig({
  testDir: './e2e',

  // Maximum time one test can run for
  // Increased for CI where Payload compilation can be slow
  timeout: process.env.CI ? 60 * 1000 : 20 * 1000,

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
    // Setup project - runs first to authenticate and save session
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // Main test project - uses saved authentication state
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use saved authentication state from setup project
        storageState: authFile,
      },
      // Don't run setup tests again, and depend on setup completing first
      testIgnore: /auth\.setup\.ts/,
      dependencies: ['setup'],
    },
  ],

  // Run global setup before all tests (start Docker services, seed databases)
  globalSetup: './e2e/global-setup.ts',

  // Note: No globalTeardown needed.
  // - In CI: The workflow cleanup step handles `docker compose down -v`
  // - In local dev: Containers are left running for faster re-runs

  // Web server configuration
  // In CI, the dev server is started externally before Playwright runs
  webServer: process.env.CI
    ? undefined
    : {
      command: 'yarn --ignore-engines dev',
      url: 'http://localhost:3000/admin',
      timeout: 180 * 1000, // 3 minutes for slow Payload initialization
      reuseExistingServer: true, // Always reuse if already running (started by setup script)
      stdout: 'pipe',
      stderr: 'pipe',
    },
});
