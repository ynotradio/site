import { Page } from '@playwright/test';

/**
 * Login to Payload CMS admin interface
 * @param page - Playwright page object
 * @param email - Admin email (default from env or test default)
 * @param password - Admin password (default from env or test default)
 */
export async function loginToPayload(
  page: Page,
  email: string = 'admin@ynotradio.net',
  password: string = 'password',
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

  await submitButton.click();

  // Wait for successful login - dashboard should load
  await page.waitForURL('**/admin', { timeout: 30000 });
}
