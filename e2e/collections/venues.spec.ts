import { test, expect } from '@playwright/test';
import { loginToPayload } from '../utils/payload-auth';
import { captureScreenshot, generateUniqueId } from '../utils/test-helpers';
import {
  navigateToPayloadCollection,
  clickPayloadCreateNew,
  fillPayloadTextField,
  clickPayloadSave,
  waitForPayloadSave,
} from '../utils/payload-helpers';

/**
 * E2E Integration Test: Venues Collection
 *
 * Tests creating venues in Payload CMS and verifying they exist.
 * Venues are used by the Concerts collection to specify concert locations.
 */

test.describe('Venues Collection', () => {
  test('should create venue via Payload UI and verify it exists in collection', async ({
    page,
  }, testInfo) => {
    const uniqueVenueName = `E2E Test Venue ${generateUniqueId()}`;
    const uniqueCity = 'Test City';

    await test.step('Log in to Payload CMS', async () => {
      await loginToPayload(page);
      await captureScreenshot(page, testInfo, '01-Venues-Dashboard');
    });

    await test.step('Navigate to Venues collection', async () => {
      await navigateToPayloadCollection(page, 'venues');
      await captureScreenshot(page, testInfo, '02-Venues-Collection-List');
    });

    await test.step('Create new venue', async () => {
      await clickPayloadCreateNew(page);
      await page.waitForURL('**/venues/create', { timeout: 30000 });

      // Wait for form to be ready
      await page.waitForSelector('form', { state: 'visible', timeout: 30000 });

      // Fill venue name (required field)
      await fillPayloadTextField(page, 'field-name', uniqueVenueName);

      // Fill city
      await fillPayloadTextField(page, 'field-city', uniqueCity);

      await captureScreenshot(page, testInfo, '03-Venues-Filled-Form');
    });

    await test.step('Save the venue', async () => {
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'venues');
      await captureScreenshot(page, testInfo, '04-Venues-Saved');
    });

    await test.step('Verify venue exists in Payload by revisiting collection', async () => {
      await navigateToPayloadCollection(page, 'venues');

      // The venue should appear in the list
      await expect(page.getByText(uniqueVenueName)).toBeVisible({ timeout: 10000 });

      await captureScreenshot(page, testInfo, '05-Venues-In-List');
    });
  });
});
