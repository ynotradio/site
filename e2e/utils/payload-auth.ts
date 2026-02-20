import { Page } from '@playwright/test';

// Base URL for Payload - uses env var in CI/Docker, localhost in local dev
const PAYLOAD_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

/**
 * Navigate to a URL with retry logic for CI network flakiness
 */
async function navigateWithRetry(
  page: Page,
  url: string,
  maxRetries = 5,
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 60000,
      });
      return; // Success
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(`Navigation attempt ${i + 1}/${maxRetries} failed:`, e);
      if (i < maxRetries - 1) {
        await page.waitForTimeout(5000);
      } else {
        throw e;
      }
    }
  }
}

/**
 * Login to Payload CMS admin interface
 * @param page - Playwright page object
 * @param email - Admin email (default from env or test default)
 * @param password - Admin password (default from env or test default)
 */
export async function loginToPayload(
  page: Page,
  email: string = process.env.PAYLOAD_DEV_EMAIL || 'admin@ynotradio.net',
  password: string = process.env.PAYLOAD_DEV_PASSWORD || 'password',
): Promise<void> {
  // Navigate to Payload admin with retry logic (it will redirect to login if not authenticated)
  await navigateWithRetry(page, `${PAYLOAD_BASE_URL}/admin`);

  // Check if we're on a "create first user" page (has "New Password" or "Confirm Password" field)
  const hasNewPasswordField = await page
    .getByLabel(/new password/i)
    .isVisible()
    .catch(() => false);
  const hasConfirmPasswordField = await page
    .getByLabel(/confirm password/i)
    .isVisible()
    .catch(() => false);
  const isCreateUserPage = hasNewPasswordField || hasConfirmPasswordField;

  if (isCreateUserPage) {
    // Creating first admin user
    await page.getByLabel(/email/i).fill(email);
    // Payload uses "New Password" for the first password field on create-first-user page
    await page.getByLabel(/new password/i).fill(password);
    await page.getByLabel(/confirm password/i).fill(password);

    // Click create account button
    const createButton = page.getByRole('button', { name: /create/i });
    await createButton.waitFor({ state: 'visible', timeout: 10000 });
    await Promise.all([page.waitForNavigation({ timeout: 30000 }), createButton.click()]);
  } else {
    // Regular login
    await page.getByLabel(/email/i).fill(email);
    // Use first() in case there are multiple password-related fields
    await page
      .getByLabel(/password/i)
      .first()
      .fill(password);

    // The Payload login button says "Login" (one word)
    const submitButton = page
      .getByRole('button', { name: 'Login' })
      .or(page.locator('button:has-text("Login")'))
      .or(page.locator('button[type="submit"]'));

    // Wait for button to be ready and click
    await submitButton.waitFor({ state: 'visible', timeout: 10000 });

    // Click and wait for navigation to complete
    await Promise.all([page.waitForNavigation({ timeout: 10000 }), submitButton.click()]);
  }

  // Verify we're on the admin dashboard (not login page)
  const currentUrl = page.url();
  if (currentUrl.includes('/login') || currentUrl.includes('/create-first-user')) {
    throw new Error(`Login failed - still on login/create page: ${currentUrl}`);
  }
}
