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
    await page.goto(`${process.env.PAYLOAD_URL}/admin`);
    // Wait for any form or main content
    await page.waitForSelector('form, main, [class*="login"], [class*="welcome"]', { timeout: 30000 });
    
    // Find any major headings to understand what page we're on
    const h1Texts = await page.locator('h1').allTextContents();
    console.log('h1 headings:', h1Texts);
    
    // Check for various expected states
    const welcomeVisible = await page.getByRole('heading', { name: /welcome/i }).isVisible().catch(() => false);
    const loginVisible = await page.getByRole('heading', { name: /login/i }).isVisible().catch(() => false);
    const createUserVisible = await page.getByRole('heading', { name: /create/i }).isVisible().catch(() => false);
    
    // Any of these indicates Payload is serving content correctly
    expect(welcomeVisible || loginVisible || createUserVisible).toBe(true);
  });
});
