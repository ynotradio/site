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
    const url = `${process.env.PAYLOAD_URL}/admin`;
    
    // Retry navigation up to 3 times since Chromium in Docker can be flaky
    let response = null;
    for (let i = 0; i < 3; i++) {
      try {
        response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        if (response?.status() === 200) break;
      } catch (e) {
        console.log(`Navigation attempt ${i + 1} failed:`, e);
        await page.waitForTimeout(2000);
      }
    }
    
    // Verify we got a successful response
    expect(response?.status()).toBe(200);
    
    // We should be redirected to create-first-user or login
    const finalUrl = page.url();
    expect(finalUrl).toMatch(/\/(create-first-user|login)/);
    
    // Wait for the form to be visible
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Verify we're on the Payload admin page
    const hasPayloadTheme = await page.locator('html[data-theme]').count();
    expect(hasPayloadTheme).toBeGreaterThan(0);
  });
});
