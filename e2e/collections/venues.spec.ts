import { test, expect } from '@playwright/test';
import { captureScreenshot, generateUniqueId } from '../utils/test-helpers';
import {
  navigateToPayloadCollection,
  navigateToPayloadCollectionCreate,
  fillPayloadTextField,
  clickPayloadSave,
  waitForPayloadSave,
} from '../utils/payload-helpers';

/**
 * E2E Integration Test: Venues Collection
 *
 * Tests creating venues in Payload CMS and verifying they exist.
 * Venues are used by the Concerts collection to specify concert locations.
 *
 * Note: Authentication is handled by the setup project - tests run with saved session state.
 */

test.describe('Venues Collection', () => {
  test('should create venue via Payload UI and verify it exists in collection', async ({
    page,
  }, testInfo) => {
    const uniqueVenueName = `E2E Test Venue ${generateUniqueId()}`;
    const uniqueCity = 'Test City';

    await test.step('Navigate directly to create venue form', async () => {
      await navigateToPayloadCollectionCreate(page, 'venues');
      await captureScreenshot(page, testInfo, '01-Venues-Create-Form');
    });

    await test.step('Fill venue form', async () => {
      // Fill venue name (required field)
      await fillPayloadTextField(page, 'field-name', uniqueVenueName);

      // Fill city
      await fillPayloadTextField(page, 'field-city', uniqueCity);

      await captureScreenshot(page, testInfo, '02-Venues-Filled-Form');
    });

    await test.step('Save the venue', async () => {
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'venues');
      await captureScreenshot(page, testInfo, '03-Venues-Saved');
    });

    await test.step('Verify venue exists in Payload by revisiting collection', async () => {
      await navigateToPayloadCollection(page, 'venues');

      // The venue should appear in the list
      await expect(page.getByText(uniqueVenueName)).toBeVisible({ timeout: 10000 });

      await captureScreenshot(page, testInfo, '04-Venues-In-List');
    });
  });
});
