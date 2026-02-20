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
    // Either Login heading or Create First User form should be visible
    const hasLogin = await page.getByRole('heading', { name: /login/i }).isVisible().catch(() => false);
    const hasCreateUser = await page.getByRole('heading', { name: /create first user/i }).isVisible().catch(() => false);
    expect(hasLogin || hasCreateUser).toBe(true);
  });
});
