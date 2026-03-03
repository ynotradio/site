/**
 * Basic Payload CMS E2E Tests
 *
 * Simple smoke test to verify Payload admin is accessible.
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
  test('admin page loads successfully', async ({ page }) => {
    await navigateWithRetry(page, `${PAYLOAD_BASE_URL}/admin`);

    // Should be on some Payload page (admin, login, or create-first-user)
    expect(page.url()).toContain('/admin');

    // Verify we're on Payload admin (has data-theme attribute)
    await expect(page.locator('html[data-theme]')).toBeAttached();
  });
});
