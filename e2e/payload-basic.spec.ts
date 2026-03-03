/**
 * Basic Payload CMS E2E Tests
 *
 * Simple smoke tests for Payload admin functionality.
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

  test('admin UI renders correctly', async ({ page }) => {
    await navigateWithRetry(page, `${PAYLOAD_BASE_URL}/admin`);

    // Should have form elements (login or create-first-user page)
    const hasForm = await page.locator('form').count();
    expect(hasForm).toBeGreaterThan(0);

    // Should have Payload branding or navigation
    const pageContent = await page.content();
    const hasPayloadContent = pageContent.includes('Payload')
      || pageContent.includes('admin')
      || pageContent.includes('email')
      || pageContent.includes('password');

    expect(hasPayloadContent).toBe(true);
  });
});
