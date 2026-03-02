/**
 * Basic Payload CMS E2E Tests
 *
 * These tests are modeled after the old e2e-buildkite tests that worked reliably.
 * Tests are resilient to database state (may or may not have users).
 */
import { test, expect, Page } from '@playwright/test';

// Base URL for Payload - uses env var in CI/Docker, localhost in local dev
const PAYLOAD_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

// Helper to navigate with retry logic for Docker networking flakiness
async function navigateWithRetry(page: Page, url: string, maxRetries = 5): Promise<number | null> {
  let response = null;
  for (let i = 0; i < maxRetries; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      if (response?.status() === 200) return response.status();
    } catch {
      // eslint-disable-next-line no-console
      console.log(`Navigation attempt ${i + 1}/${maxRetries} failed, retrying...`);
      // Increase delay between retries
      // eslint-disable-next-line no-await-in-loop
      await page.waitForTimeout(5000);
    }
  }
  return response?.status() || null;
}

test.describe('Payload CMS Basic Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Allow server to stabilize between tests
    await page.waitForTimeout(2000);
  });

  test('admin page loads successfully', async ({ page }) => {
    const url = `${PAYLOAD_BASE_URL}/admin`;
    const status = await navigateWithRetry(page, url);

    expect(status).toBe(200);

    // Should be on some Payload page (admin, login, or create-first-user)
    const finalUrl = page.url();
    expect(finalUrl).toContain('/admin');

    // Verify we're on Payload admin (has data-theme attribute)
    const hasPayloadTheme = await page.locator('html[data-theme]').count();
    expect(hasPayloadTheme).toBeGreaterThan(0);
  });

  test('can create first admin user or login if user exists', async ({ page }) => {
    const url = `${PAYLOAD_BASE_URL}/admin`;
    await navigateWithRetry(page, url);

    // Check if we're on create-first-user or login page
    const currentUrl = page.url();
    const isCreateUserPage = currentUrl.includes('create-first-user');

    if (isCreateUserPage) {
      // Fill in the form to create first user
      await page.fill('input[name="email"]', 'admin@example.com');
      await page.fill('input[name="password"]', 'testpassword123');
      await page.fill('input[name="confirm-password"]', 'testpassword123');

      // Submit the form
      await page.click('button[type="submit"]');

      // Should redirect to dashboard after creating user
      await page.waitForURL(/\/admin(?!\/create-first-user)/, { timeout: 30000 });
    } else {
      // User exists - might be on login page or already on dashboard
      const isLoginPage = currentUrl.includes('login');
      if (isLoginPage) {
        // Login with expected credentials
        await page.fill('input[name="email"]', 'admin@example.com');
        await page.fill('input[name="password"]', 'testpassword123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/admin(?!\/login)/, { timeout: 30000 });
      }
      // If already on dashboard, that's fine too
    }

    // Verify we see the dashboard with retry (server may restart during test)
    const dashboardHeading = page.getByRole('heading', { name: /y-not radio cms/i });
    try {
      await expect(dashboardHeading).toBeVisible({ timeout: 30000 });
    } catch {
      // Server may have restarted - reload and try again
      await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
      await expect(dashboardHeading).toBeVisible({ timeout: 30000 });
    }
  });

  test('dashboard shows expected collections', async ({ page }) => {
    // Navigate to admin
    const url = `${PAYLOAD_BASE_URL}/admin`;
    await navigateWithRetry(page, url);

    // Handle create-first-user or login if needed
    const currentUrl = page.url();
    if (currentUrl.includes('create-first-user')) {
      await page.fill('input[name="email"]', 'admin2@example.com');
      await page.fill('input[name="password"]', 'testpassword123');
      await page.fill('input[name="confirm-password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/admin(?!\/create-first-user)/, { timeout: 30000 });
    } else if (currentUrl.includes('login')) {
      await page.fill('input[name="email"]', 'admin@example.com');
      await page.fill('input[name="password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/admin(?!\/login)/, { timeout: 30000 });
    }

    // Verify dashboard has expected content
    const pageContent = await page.content();

    // Dashboard should mention key collections
    const hasCollections = pageContent.includes('Concerts')
      || pageContent.includes('Artists')
      || pageContent.includes('Users')
      || pageContent.includes('Dashboard');

    expect(hasCollections).toBe(true);
  });
});
