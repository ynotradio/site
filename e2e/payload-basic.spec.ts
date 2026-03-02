/**
 * Basic Payload CMS E2E Tests
 *
 * Simple smoke tests for Payload admin functionality.
 * Tests handle both fresh database (create-first-user) and existing users (login).
 */
import { test, expect } from '@playwright/test';

const PAYLOAD_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('Payload CMS Basic Tests', () => {
  test('admin page loads successfully', async ({ page }) => {
    await page.goto(`${PAYLOAD_BASE_URL}/admin`);

    // Should be on some Payload page (admin, login, or create-first-user)
    expect(page.url()).toContain('/admin');

    // Verify we're on Payload admin (has data-theme attribute)
    await expect(page.locator('html[data-theme]')).toBeAttached();
  });

  test('can create first admin user or login if user exists', async ({ page }) => {
    await page.goto(`${PAYLOAD_BASE_URL}/admin`);

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

    // Verify we see the dashboard
    await expect(page.getByRole('heading', { name: /y-not radio cms/i })).toBeVisible({
      timeout: 30000,
    });
  });

  test('dashboard shows expected collections', async ({ page }) => {
    await page.goto(`${PAYLOAD_BASE_URL}/admin`);

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
