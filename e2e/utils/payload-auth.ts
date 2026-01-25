import { Page } from '@playwright/test';

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
  // Navigate to Payload admin (it will redirect to login if not authenticated)
  await page.goto('http://localhost:3000/admin', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  // Use Playwright best practices: getByLabel for form fields
  // Payload uses standard HTML labels for accessibility
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);

  // The Payload login button says "Login" (one word)
  const submitButton = page
    .getByRole('button', { name: 'Login' })
    .or(page.locator('button:has-text("Login")'))
    .or(page.locator('button[type="submit"]'));

  // Wait for button to be ready and click
  await submitButton.waitFor({ state: 'visible', timeout: 10000 });

  // Click and wait for navigation to complete
  await Promise.all([page.waitForNavigation({ timeout: 10000 }), submitButton.click()]);

  // Verify we're on the admin dashboard (not login page)
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    throw new Error(`Login failed - still on login page: ${currentUrl}`);
  }
}
