// Minimal Playwright test for Buildkite verification
// Tests external site (playwright.dev) to validate Playwright runs in CI
import { test, expect } from '@playwright/test';

test.describe('playwright.dev (external)', () => {
  test('has title', async ({ page }) => {
    await page.goto('https://playwright.dev/');
    await expect(page).toHaveTitle(/Playwright/);
  });

  test('get started link works', async ({ page }) => {
    await page.goto('https://playwright.dev/');
    await page.getByRole('link', { name: 'Get started' }).click();
    await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
  });
});
