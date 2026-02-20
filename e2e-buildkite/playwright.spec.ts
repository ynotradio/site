// Minimal Playwright test for Buildkite verification
// Tests progress incrementally: external site → local Payload
import { test, expect } from '@playwright/test';

test.describe('playwright.dev (external)', () => {
  test('has title', async ({ page }) => {
    await page.goto('https://playwright.dev/');
    await expect(page).toHaveTitle(/Playwright/);
  });
});

test.describe('Payload CMS (local)', () => {
  test.beforeEach(async ({ page }) => {
    // Skip if PAYLOAD_URL is not set
    test.skip(!process.env.PAYLOAD_URL, 'PAYLOAD_URL not set - skipping local tests');
  });

  test('admin page loads', async ({ page }) => {
    // Navigate to admin - will either show login or "Create First User" form
    await page.goto(`${process.env.PAYLOAD_URL}/admin`);
    // Wait for any form to be visible (Payload uses forms for both login and create user)
    await page.waitForSelector('form', { timeout: 30000 });
    // Either Login heading or Create First User form should be visible
    const loginHeading = page.getByRole('heading', { name: /login/i });
    const createUserHeading = page.getByRole('heading', { name: /create first user/i });
    const hasLogin = await loginHeading.isVisible().catch(() => false);
    const hasCreateUser = await createUserHeading.isVisible().catch(() => false);
    // If neither found, log what we do see
    if (!hasLogin && !hasCreateUser) {
      const headings = await page.locator('h1, h2, h3').allTextContents();
      console.log('Found headings:', headings);
    }
    expect(hasLogin || hasCreateUser).toBe(true);
  });
});
