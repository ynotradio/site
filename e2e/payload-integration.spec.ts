import { test, expect } from '@playwright/test';
import { loginToPayload } from './utils/payload-auth';

/**
 * E2E Integration Test: Payload CMS → Legacy PHP Site
 *
 * This test demonstrates end-to-end data flow using real user interactions:
 * 1. Log in to Payload CMS admin interface
 * 2. Create a new concert through the Payload UI
 * 3. Verify the concert appears on the legacy PHP site (concerts.php)
 *
 * The test assumes:
 * - Docker Compose has started PostgreSQL, MySQL, and Apache services
 * - PostgreSQL database has Payload schema (via migrations)
 * - Payload server is running on port 3000
 * - Legacy PHP site is configured to read from PostgreSQL
 * - Apache is serving the legacy PHP site on port 8080
 */

test.describe('Payload CMS Integration with Legacy PHP Site', () => {
  test('should create concert via Payload UI and verify it appears on legacy site', async ({
    page,
  }, testInfo) => {
    await test.step('Log in to Payload CMS', async () => {
      await loginToPayload(page);

      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach('01-Payload Dashboard', {
        body: screenshot,
        contentType: 'image/png',
      });
    });

    await test.step('Navigate to Concerts collection', async () => {
      await page.goto('http://localhost:3000/admin/collections/concerts', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach('02-Concerts Collection List', {
        body: screenshot,
        contentType: 'image/png',
      });
    });

    await test.step('Open create concert form', async () => {
      // Use getByRole to find the "Create New" link
      await page.getByRole('link', { name: /create new/i }).click();
      await page.waitForURL('**/concerts/create', { timeout: 30000 });

      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach('03-Create Concert Form', {
        body: screenshot,
        contentType: 'image/png',
      });
    });

    await test.step('Fill out concert form', async () => {
      // Set concert date (7 days from now)
      const concertDate = new Date();
      concertDate.setDate(concertDate.getDate() + 7);
      const concertDateString = concertDate.toISOString().split('T')[0];

      // Fill in the date field using label
      await page.getByLabel(/date/i).fill(concertDateString);

      // Select an artist - use getByRole for button
      await page.getByRole('button', { name: /add artist/i }).click();
      // Wait for dropdown and select first option
      const artistOption = page.locator('[role="option"]').first();
      await artistOption.waitFor({ state: 'visible', timeout: 10000 });
      await artistOption.click();

      // Select a venue
      await page.getByRole('button', { name: /select.*venue/i }).click();
      // Wait for dropdown and select first option
      const venueOption = page.locator('[role="option"]').first();
      await venueOption.waitFor({ state: 'visible', timeout: 10000 });
      await venueOption.click();

      // Fill in ticket info using labels or names
      await page.getByLabel(/ticket.*info/i).fill('E2E Test Tickets $30');
      await page.getByLabel(/ticket.*url/i).fill('https://tickets.example.com/e2e-playwright-test');

      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach('04-Filled Concert Form', {
        body: screenshot,
        contentType: 'image/png',
      });
    });

    await test.step('Save the concert', async () => {
      // Use getByRole for the Save button - flexible pattern to match variations
      await page.getByRole('button', { name: /save/i }).click();

      // Wait for save success - look for URL change or success message
      await Promise.race([
        page.waitForURL('**/concerts/**', { timeout: 30000 }),
        page.getByText(/saved successfully|successfully saved/i).waitFor({ timeout: 30000 }),
      ]).catch(() => {
        return page.waitForLoadState('networkidle', { timeout: 10000 });
      });

      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach('05-Concert Saved', {
        body: screenshot,
        contentType: 'image/png',
      });
    });

    await test.step('Verify concert appears on legacy PHP site', async () => {
      const response = await page.goto('http://localhost:8080/concerts.php', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      expect(response?.status()).toBe(200);

      const pageContent = await page.content();

      // Check for PHP errors
      expect(pageContent).not.toContain('Fatal error');
      expect(pageContent).not.toContain('Parse error');
      expect(pageContent).not.toContain('Warning:');

      // Verify the concert appears
      expect(pageContent).toContain('E2E Test Tickets $30');

      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach('06-Legacy Site with New Concert', {
        body: screenshot,
        contentType: 'image/png',
      });
    });
  });

  test('should verify Payload admin UI loads correctly', async ({ page }, testInfo) => {
    await test.step('Verify login page loads', async () => {
      await page.goto('http://localhost:3000/admin', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Use Playwright best practices - getByLabel for form fields
      const emailInput = page.getByLabel(/email/i);
      const passwordInput = page.getByLabel(/password/i);
      const submitButton = page.getByRole('button', { name: /log in|sign in|submit/i });

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();

      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach('Payload Login Page', {
        body: screenshot,
        contentType: 'image/png',
      });
    });
  });
});
