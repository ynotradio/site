import { test as setup } from '@playwright/test';
import path from 'path';
import { loginToPayload } from './utils/payload-auth';

/**
 * Authentication setup for Playwright tests
 *
 * This runs once before all tests and saves the authenticated session state.
 * All other tests can then reuse this state, avoiding repeated logins.
 *
 * @see https://playwright.dev/docs/auth
 */

const authFile = path.join(__dirname, '../.auth/payload-session.json');

setup('authenticate with Payload CMS', async ({ page }) => {
  // Log in to Payload CMS
  await loginToPayload(page);

  // Wait for the dashboard to be fully loaded
  await page.waitForURL('**/admin', { timeout: 30000 });

  // Save the authentication state to a file
  await page.context().storageState({ path: authFile });
});
