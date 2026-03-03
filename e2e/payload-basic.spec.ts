/**
 * Basic Payload CMS E2E Tests
 *
 * Simple smoke tests for Payload admin functionality.
 * Tests handle both fresh database (create-first-user) and existing users (login).
 */
import { test, expect, Page } from '@playwright/test';

const PAYLOAD_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

// Helper to navigate with retry logic for Docker networking flakiness
async function navigateWithRetry(page: Page, url: string, maxRetries = 5): Promise<void> {
  for (let i = 0; i < maxRetries; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      if (response?.status() === 200) return;
    } catch {
      // eslint-disable-next-line no-console
      console.log(`Navigation attempt ${i + 1}/${maxRetries} failed, retrying...`);
    }
    // eslint-disable-next-line no-await-in-loop
    await page.waitForTimeout(3000);
  }
  // Final attempt without catching
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
}

test.describe('Payload CMS Basic Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Allow server to stabilize between tests
    await page.waitForTimeout(2000);
  });

  test('admin page loads successfully', async ({ page }) => {
    await navigateWithRetry(page, `${PAYLOAD_BASE_URL}/admin`);

    // Should be on some Payload page (admin, login, or create-first-user)
    expect(page.url()).toContain('/admin');

    // Verify we're on Payload admin (has data-theme attribute)
    await expect(page.locator('html[data-theme]')).toBeAttached();
  });

  test('can create first admin user or login if user exists', async ({ page }) => {
    await navigateWithRetry(page, `${PAYLOAD_BASE_URL}/admin`);

    const currentUrl = page.url();

    if (currentUrl.includes('create-first-user')) {
      // Fresh database - create first user
      await page.fill('input[name="email"]', 'admin@example.com');
      await page.fill('input[name="password"]', 'testpassword123');
      await page.fill('input[name="confirm-password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/admin(?!\/create-first-user)/, { timeout: 30000 });
    } else if (currentUrl.includes('login')) {
      // User exists - login
      await page.fill('input[name="email"]', 'admin@example.com');
      await page.fill('input[name="password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/admin(?!\/login)/, { timeout: 30000 });
    }

    // Verify we see the dashboard with retry (server may restart during test)
    const dashboardHeading = page.getByRole('heading', { name: /y-not radio cms/i });
    try {
      await expect(dashboardHeading).toBeVisible({ timeout: 30000 });
    } catch {
      // Server may have restarted - reload and try again
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
      await expect(dashboardHeading).toBeVisible({ timeout: 30000 });
    }
  });

  test('dashboard shows expected collections', async ({ page }) => {
    await navigateWithRetry(page, `${PAYLOAD_BASE_URL}/admin`);

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
    const hasCollections = pageContent.includes('Concerts')
      || pageContent.includes('Artists')
      || pageContent.includes('Users')
      || pageContent.includes('Dashboard');

    expect(hasCollections).toBe(true);
  });
});
