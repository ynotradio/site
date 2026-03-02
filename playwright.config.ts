import { defineConfig, devices } from '@playwright/test';

// Path to store authenticated session state
// In CI, use /tmp since e2e directory is mounted read-only
const authFile = process.env.CI
  ? '/tmp/.auth/payload-session.json'
  : './e2e/.auth/payload-session.json';

/**
 * Playwright configuration for E2E tests
 * Tests spin up Payload CMS and legacy PHP site with containerized/seeded databases
 *
 * CI Configuration:
 * - Uses simplified tests (payload-basic.spec.ts) that don't depend on auth.setup
 * - This matches the old e2e-buildkite approach that worked reliably
 *
 * Local Development:
 * - Uses auth.setup.ts for shared authentication state
 * - Runs more complex integration tests
 */

// In CI, use basic tests only (no auth setup dependency)
// In local, use auth setup for shared session
const isCi = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',

  // In CI, only run basic tests that don't depend on auth.setup
  testMatch: isCi ? /payload-basic\.spec\.ts/ : undefined,

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
    // In CI/Docker: use PLAYWRIGHT_BASE_URL (http://payload:3000)
    // Locally: default to http://localhost:3000
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure - manual screenshots will be attached separately
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: isCi
    ? [
      // CI: Single project running basic tests without auth.setup
      {
        name: 'chromium',
        use: {
          ...devices['Desktop Chrome'],
          launchOptions: {
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-web-security',
              '--disable-features=IsolateOrigins,site-per-process',
            ],
          },
        },
      },
    ]
    : [
      // Local dev: Full auth.setup flow
      {
        name: 'setup',
        testMatch: /auth\.setup\.ts/,
        use: {},
      },
      {
        name: 'chromium',
        use: {
          ...devices['Desktop Chrome'],
          storageState: authFile,
        },
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
