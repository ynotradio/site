import { Page } from '@playwright/test';

// Base URL for Payload - uses env var in CI/Docker, localhost in local dev
const PAYLOAD_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

/**
 * Navigate with retry logic for Docker networking flakiness
 * Ported from old e2e-buildkite setup that worked reliably
 */
async function navigateWithRetry(page: Page, url: string, maxRetries = 5): Promise<number | null> {
  let response = null;
  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      if (response?.status() === 200) return response.status();
    } catch {
      // eslint-disable-next-line no-await-in-loop
      await page.waitForTimeout(5000);
    }
  }
  return response?.status() || null;
}

/**
 * Login to Payload CMS admin interface
 * Uses CSS selectors that worked reliably in old e2e-buildkite setup
 * @param page - Playwright page object
 * @param email - Admin email (default from env or test default)
 * @param password - Admin password (default from env or test default)
 */
export async function loginToPayload(
  page: Page,
  email: string = process.env.PAYLOAD_DEV_EMAIL || 'admin@ynotradio.net',
  password: string = process.env.PAYLOAD_DEV_PASSWORD || 'password',
): Promise<void> {
  // Navigate to Payload admin with retry logic (ported from old setup)
  const url = `${PAYLOAD_BASE_URL}/admin`;
  await navigateWithRetry(page, url);

  // Check if we're on a "create first user" page (URL-based check like old tests)
  const isCreateUserPage = page.url().includes('create-first-user');

  if (isCreateUserPage) {
    // Wait for create-first-user form (like old tests)
    await page.waitForURL(/create-first-user/, { timeout: 30000 });

    // Use CSS selectors that worked in old e2e-buildkite setup
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirm-password"]', password);

    // Submit the form and wait for URL change (not waitForNavigation)
    await page.click('button[type="submit"]');

    // Should redirect to dashboard after creating user
    await page.waitForURL(/\/admin(?!\/create-first-user)/, { timeout: 30000 });
  } else {
    // Regular login - use CSS selectors
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);

    // Submit and wait for URL change
    await page.click('button[type="submit"]');

    // Wait for redirect away from login page
    await page.waitForURL(/\/admin(?!\/login)/, { timeout: 30000 });
  }

  // Verify we're on the admin dashboard (not login page)
  const currentUrl = page.url();
  if (currentUrl.includes('/login') || currentUrl.includes('/create-first-user')) {
    throw new Error(`Login failed - still on login/create page: ${currentUrl}`);
  }
}
