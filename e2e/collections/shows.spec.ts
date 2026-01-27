import { test, expect } from '@playwright/test';
import { loginToPayload } from '../utils/payload-auth';
import {
  captureScreenshot,
  fillPayloadDateField,
  getFutureDate,
  generateUniqueId,
  checkForPhpErrors,
} from '../utils/test-helpers';
import {
  navigateToPayloadCollection,
  clickPayloadCreateNew,
  fillPayloadRelationshipField,
  clickPayloadSave,
  waitForPayloadSave,
  fillPayloadTimeField,
  fillPayloadRichTextField,
  navigateToLegacySiteWithPostgres,
} from '../utils/payload-helpers';

/**
 * E2E Integration Test: Shows Collection
 *
 * Tests creating shows in Payload CMS and verifying they appear on schedule.php.
 */

test.describe('Shows Collection', () => {
  test('should create show via Payload UI and verify it appears on schedule.php', async ({
    page,
  }, testInfo) => {
    const uniqueShowNote = `E2E Test Show ${generateUniqueId()}`;

    await test.step('Log in to Payload CMS', async () => {
      await loginToPayload(page);
      await captureScreenshot(page, testInfo, '01-Shows-Dashboard');
    });

    await test.step('Navigate to Shows collection', async () => {
      await navigateToPayloadCollection(page, 'shows');
      await captureScreenshot(page, testInfo, '02-Shows-Collection-List');
    });

    await test.step('Create new show', async () => {
      await clickPayloadCreateNew(page);
      await page.waitForURL('**/shows/create', { timeout: 30000 });

      // Wait for form to be ready
      await page.waitForSelector('form', { state: 'visible', timeout: 30000 });

      // Set show date (7 days from now to ensure it appears in upcoming schedule)
      const showDate = getFutureDate(7);
      await fillPayloadDateField(page, 'field-date', showDate);

      // Fill start time (required)
      await fillPayloadTimeField(page, 'field-startTime', '14:00');

      // Fill end time (required)
      await fillPayloadTimeField(page, 'field-endTime', '16:00');

      // Optionally select a host DJ (if seeded data exists)
      try {
        await fillPayloadRelationshipField(page, 'field-host', 0);
      } catch {
        // No DJs available, skip host selection
      }

      // Fill a unique note to identify this show
      await fillPayloadRichTextField(page, 'field-note', uniqueShowNote);

      await captureScreenshot(page, testInfo, '03-Shows-Filled-Form');
    });

    await test.step('Save the show', async () => {
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'shows');
      await captureScreenshot(page, testInfo, '04-Shows-Saved');
    });

    await test.step('Verify show appears on schedule.php', async () => {
      const response = await navigateToLegacySiteWithPostgres(
        page,
        'schedule.php',
        'use_postgres_schedule',
      );

      expect(response?.status()).toBe(200);

      const pageContent = await page.content();

      // Check for PHP errors
      const errors = checkForPhpErrors(pageContent);
      expect(errors).toHaveLength(0);

      // Verify the unique show note we just created appears on the page
      expect(pageContent).toContain(uniqueShowNote);

      await captureScreenshot(page, testInfo, '05-Shows-On-Schedule-Page');
    });
  });
});
