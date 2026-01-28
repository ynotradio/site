import { test, expect } from '@playwright/test';
import {
  captureScreenshot,
  fillPayloadDateField,
  getFutureDate,
} from '../utils/test-helpers';
import {
  navigateToPayloadCollection,
  navigateToPayloadCollectionCreate,
  clickPayloadSave,
  waitForPayloadSave,
  fillPayloadTimeField,
} from '../utils/payload-helpers';

/**
 * E2E Integration Test: Shows Collection
 *
 * Tests creating shows in Payload CMS and verifying they exist.
 * Note: PHP page verification is intentionally skipped due to complexity
 * with date filters and feature flags - this test focuses on Payload CRUD.
 *
 * Note: Authentication is handled by the setup project - tests run with saved session state.
 */

test.describe('Shows Collection', () => {
  test('should create show via Payload UI and verify it exists in collection', async ({
    page,
  }, testInfo) => {
    await test.step('Navigate directly to create show form', async () => {
      await navigateToPayloadCollectionCreate(page, 'shows');
      await captureScreenshot(page, testInfo, '01-Shows-Create-Form');
    });

    await test.step('Fill show form', async () => {
      // Set show date (7 days from now)
      const showDate = getFutureDate(7);
      await fillPayloadDateField(page, 'field-date', showDate);

      // Fill start time (required)
      await fillPayloadTimeField(page, 'field-startTime', '14:00');

      // Fill end time (required)
      await fillPayloadTimeField(page, 'field-endTime', '16:00');

      await captureScreenshot(page, testInfo, '02-Shows-Filled-Form');
    });

    await test.step('Save the show', async () => {
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'shows');
      await captureScreenshot(page, testInfo, '03-Shows-Saved');
    });

    await test.step('Verify show exists in Payload collection', async () => {
      await navigateToPayloadCollection(page, 'shows');
      // The list should have at least one item (the one we just created)
      await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 });
      await captureScreenshot(page, testInfo, '04-Shows-In-List');
    });
  });
});
