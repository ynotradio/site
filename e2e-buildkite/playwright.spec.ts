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
    // Navigate to admin
    const url = `${process.env.PAYLOAD_URL}/admin`;
    console.log('Navigating to:', url);
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    console.log('Response status:', response?.status());
    console.log('Final URL:', page.url());
    
    // Wait a bit for JS to render
    await page.waitForTimeout(5000);
    
    // Log the page content for debugging
    const html = await page.content();
    console.log('Page HTML length:', html.length);
    console.log('First 500 chars:', html.substring(0, 500));
    
    // Screenshot for debugging
    await page.screenshot({ path: 'payload-admin.png' });
    
    // Find any text on the page
    const bodyText = await page.locator('body').textContent();
    console.log('Body text:', bodyText?.substring(0, 200));
    
    // The test passes if we got a 200 response and some content
    expect(response?.status()).toBe(200);
    expect(html.length).toBeGreaterThan(100);
  });
});
