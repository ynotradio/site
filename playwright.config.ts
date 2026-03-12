import { defineConfig, devices } from '@playwright/test';

const isCi = !!process.env.CI;
const authFile = isCi ? '/tmp/.auth/payload-session.json' : './e2e/.auth/payload-session.json';

/**
 * Playwright E2E Test Configuration
 *
 * CI: Runs a curated set of spec files that work with the mrm-fresh seed:
 *   payload-basic, mrm-postgres-fresh, mrm-postgres-extended, mrm-payload-admin
 * Local: Runs all tests with shared auth session
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: isCi
    ? /(payload-basic|mrm-postgres-fresh|mrm-postgres-extended|mrm-payload-admin)\.spec\.ts/
    : undefined,

  timeout: isCi ? 60_000 : 20_000,
  expect: { timeout: 10_000 },
  globalTimeout: 30 * 60_000,

  fullyParallel: false,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 1 : undefined,

  reporter: isCi ? [['html'], ['list'], ['github']] : [['html'], ['list']],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: isCi
    ? [
      {
        name: 'chromium',
        use: {
          ...devices['Desktop Chrome'],
          launchOptions: {
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
          },
        },
      },
    ]
    : [
      {
        name: 'setup',
        testMatch: /auth\.setup\.ts/,
      },
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'], storageState: authFile },
        testIgnore: /auth\.setup\.ts/,
        dependencies: ['setup'],
      },
    ],

  globalSetup: './e2e/global-setup.ts',

  webServer: isCi
    ? undefined
    : {
      command: 'yarn --ignore-engines dev',
      url: 'http://localhost:3000/admin',
      timeout: 180_000,
      reuseExistingServer: true,
      stdout: 'pipe',
      stderr: 'pipe',
    },
});
