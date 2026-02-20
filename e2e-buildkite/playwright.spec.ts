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

  test('admin login page loads', async ({ page }) => {
    await page.goto(`${process.env.PAYLOAD_URL}/admin/login`);
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  });
});
