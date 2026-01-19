import { test, expect } from '@playwright/test';
import { loginToPayload } from './utils/payload-auth';
import {
  captureScreenshot,
  fillPayloadDateField,
  getFutureDate,
  generateUniqueId,
  checkForPhpErrors,
} from './utils/test-helpers';
import {
  navigateToPayloadCollection,
  clickPayloadCreateNew,
  fillPayloadRelationshipField,
  fillPayloadTextField,
  clickPayloadSave,
  waitForPayloadSave,
} from './utils/payload-helpers';

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
      await captureScreenshot(page, testInfo, '01-Payload Dashboard');
    });

    await test.step('Navigate to Concerts collection', async () => {
      await navigateToPayloadCollection(page, 'concerts');
      await captureScreenshot(page, testInfo, '02-Concerts Collection List');
    });

    await test.step('Open create concert form', async () => {
      await clickPayloadCreateNew(page);
      await page.waitForURL('**/concerts/create', { timeout: 30000 });
      await captureScreenshot(page, testInfo, '03-Create Concert Form');
    });

    await test.step('Fill out concert form', async () => {
      // Wait for form to be ready
      await page.waitForSelector('form', { state: 'visible', timeout: 30000 });

      // Set concert date (3 days from now to avoid month boundary issues)
      const concertDate = getFutureDate(3);
      await fillPayloadDateField(page, 'field-date', concertDate);

      // Select an artist
      await fillPayloadRelationshipField(page, 'field-artists', 0);

      // Select a venue
      await fillPayloadRelationshipField(page, 'field-venue', 0);

      // Fill in UNIQUE ticket info to distinguish this concert from seeded data
      const uniqueTicketInfo = `E2E Test Concert ${generateUniqueId()} - Tickets $30`;
      const uniqueTicketUrl = `https://tickets.example.com/e2e-${generateUniqueId()}`;
      
      await fillPayloadTextField(page, 'field-ticketInfo', uniqueTicketInfo);
      await fillPayloadTextField(page, 'field-ticketUrl', uniqueTicketUrl);

      // Store these for later verification
      // eslint-disable-next-line no-param-reassign
      (testInfo as any).uniqueTicketInfo = uniqueTicketInfo;

      await captureScreenshot(page, testInfo, '04-Filled Concert Form');
    });

    await test.step('Save the concert', async () => {
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'concerts');
      await captureScreenshot(page, testInfo, '05-Concert Saved');
    });

    await test.step('Verify concert appears on legacy PHP site', async () => {
      const response = await page.goto('http://localhost:8080/concerts.php', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      expect(response?.status()).toBe(200);

      const pageContent = await page.content();

      // Check for PHP errors
      const errors = checkForPhpErrors(pageContent);
      expect(errors).toHaveLength(0);

      // Verify the UNIQUE concert we just created appears on the page
      // This ensures we're not just seeing seeded data
      const uniqueTicketInfo = (testInfo as any).uniqueTicketInfo;
      expect(pageContent).toContain(uniqueTicketInfo);

      await captureScreenshot(page, testInfo, '06-Legacy Site with New Concert');
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
      // The Payload login button says "Login" (one word)
      const submitButton = page
        .getByRole('button', { name: 'Login' })
        .or(page.locator('button:has-text("Login")'));

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();

      await captureScreenshot(page, testInfo, 'Payload Login Page');
    });
  });
});
