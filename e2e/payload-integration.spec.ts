import { test, expect } from '@playwright/test';
import {
  captureScreenshot,
  fillPayloadDateField,
  getFutureDate,
  generateUniqueId,
  checkForPhpErrors,
} from './utils/test-helpers';
import {
  navigateToPayloadCollectionCreate,
  fillPayloadRelationshipField,
  fillPayloadTextField,
  clickPayloadSave,
  waitForPayloadSave,
} from './utils/payload-helpers';

/**
 * E2E Integration Test: Payload CMS → Legacy PHP Site
 *
 * This test demonstrates end-to-end data flow using real user interactions:
 * 1. Create a new concert through the Payload UI (using saved session state)
 * 2. Verify the concert appears on the legacy PHP site (concerts.php)
 *
 * Note: Authentication is handled by the setup project - tests run with saved session state.
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
    // Store unique ticket info for later verification
    const uniqueTicketInfo = `E2E Test Concert ${generateUniqueId()} - Tickets $30`;
    const uniqueTicketUrl = `https://tickets.example.com/e2e-${generateUniqueId()}`;

    await test.step('Navigate directly to create concert form', async () => {
      await navigateToPayloadCollectionCreate(page, 'concerts');
      await captureScreenshot(page, testInfo, '01-Create Concert Form');
    });

    await test.step('Fill out concert form', async () => {
      // Set concert date (3 days from now to avoid month boundary issues)
      const concertDate = getFutureDate(3);
      await fillPayloadDateField(page, 'field-date', concertDate);

      // Select an artist
      await fillPayloadRelationshipField(page, 'field-artists', 0);

      // Select a venue
      await fillPayloadRelationshipField(page, 'field-venue', 0);

      // Fill in UNIQUE ticket info to distinguish this concert from seeded data
      await fillPayloadTextField(page, 'field-ticketInfo', uniqueTicketInfo);
      await fillPayloadTextField(page, 'field-ticketUrl', uniqueTicketUrl);

      await captureScreenshot(page, testInfo, '02-Filled Concert Form');
    });

    await test.step('Save the concert', async () => {
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'concerts');
      await captureScreenshot(page, testInfo, '03-Concert Saved');
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
      expect(pageContent).toContain(uniqueTicketInfo);

      await captureScreenshot(page, testInfo, '04-Legacy Site with New Concert');
    });
  });

  test('should verify Payload admin UI loads correctly', async ({ page }, testInfo) => {
    await test.step('Verify dashboard loads (already authenticated)', async () => {
      await page.goto('http://localhost:3000/admin', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Since we're authenticated via setup, we should see the dashboard, not login
      // Look for dashboard elements instead of login form
      const dashboardHeading = page.getByRole('heading', { name: /dashboard/i });
      await expect(dashboardHeading).toBeVisible({ timeout: 10000 });

      await captureScreenshot(page, testInfo, 'Payload Dashboard');
    });
  });
});
