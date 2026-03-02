import { test as setup } from '@playwright/test';
import path from 'path';
import { mkdir } from 'fs/promises';
import { loginToPayload } from './utils/payload-auth';

/**
 * Authentication setup for Playwright tests
 *
 * This runs once before all tests and saves the authenticated session state.
 * All other tests can then reuse this state, avoiding repeated logins.
 *
 * @see https://playwright.dev/docs/auth
 */

// In CI, use /tmp since e2e directory is mounted read-only
const authDir = process.env.CI ? '/tmp/.auth' : path.join(__dirname, '.auth');
const authFile = path.join(authDir, 'payload-session.json');

setup('authenticate with Payload CMS', async ({ page }) => {
  // Ensure auth directory exists
  await mkdir(authDir, { recursive: true });

  // Log in to Payload CMS
  await loginToPayload(page);

  // Wait for the dashboard to be fully loaded
  await page.waitForURL('**/admin', { timeout: 30000 });

  // Save the authentication state to a file
  await page.context().storageState({ path: authFile });
});
