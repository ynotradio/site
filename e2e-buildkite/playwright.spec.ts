// Playwright E2E tests for Buildkite
// Tests progress incrementally: external site → Payload CMS
import { test, expect, Page } from '@playwright/test';

// Helper to navigate with retry logic for Docker networking flakiness
async function navigateWithRetry(page: Page, url: string, maxRetries = 3): Promise<number | null> {
  let response = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      if (response?.status() === 200) return response.status();
    } catch (e) {
      console.log(`Navigation attempt ${i + 1} failed:`, e);
      await page.waitForTimeout(2000);
    }
  }
  return response?.status() || null;
}

test.describe('playwright.dev (external)', () => {
  test('has title', async ({ page }) => {
    await page.goto('https://playwright.dev/');
    await expect(page).toHaveTitle(/Playwright/);
  });
});

test.describe('Payload CMS (local)', () => {
  test.beforeEach(async () => {
    // Skip if PAYLOAD_URL is not set
    test.skip(!process.env.PAYLOAD_URL, 'PAYLOAD_URL not set - skipping local tests');
  });

  test('admin page loads and shows create-first-user form', async ({ page }) => {
    const url = `${process.env.PAYLOAD_URL}/admin`;
    const status = await navigateWithRetry(page, url);
    
    expect(status).toBe(200);
    
    // Should redirect to create-first-user (fresh database)
    const finalUrl = page.url();
    expect(finalUrl).toContain('create-first-user');
    
    // Verify form is visible
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Verify we're on Payload admin
    const hasPayloadTheme = await page.locator('html[data-theme]').count();
    expect(hasPayloadTheme).toBeGreaterThan(0);
  });

  test('can create first admin user', async ({ page }) => {
    const url = `${process.env.PAYLOAD_URL}/admin`;
    await navigateWithRetry(page, url);
    
    // Wait for create-first-user form
    await page.waitForURL(/create-first-user/, { timeout: 30000 });
    
    // Fill in the form
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.fill('input[name="confirm-password"]', 'testpassword123');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard after creating user
    await page.waitForURL(/\/admin(?!\/create-first-user)/, { timeout: 30000 });
    
    // Verify we see the dashboard
    const dashboardHeading = page.getByRole('heading', { name: /y-not radio cms/i });
    await expect(dashboardHeading).toBeVisible({ timeout: 10000 });
  });

  test('dashboard shows expected collections', async ({ page }) => {
    // First create a user to get past first-time setup
    const url = `${process.env.PAYLOAD_URL}/admin`;
    await navigateWithRetry(page, url);
    
    // If on create-first-user, create user first
    if (page.url().includes('create-first-user')) {
      await page.fill('input[name="email"]', 'admin2@example.com');
      await page.fill('input[name="password"]', 'testpassword123');
      await page.fill('input[name="confirm-password"]', 'testpassword123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/admin(?!\/create-first-user)/, { timeout: 30000 });
    }
    
    // Verify dashboard has expected content
    const pageContent = await page.content();
    
    // Dashboard should mention key collections
    const hasCollections = 
      pageContent.includes('Concerts') ||
      pageContent.includes('Artists') ||
      pageContent.includes('Users') ||
      pageContent.includes('Dashboard');
    
    expect(hasCollections).toBe(true);
  });
});
