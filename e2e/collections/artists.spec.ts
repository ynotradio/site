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
 * E2E Integration Test: Artists Collection
 *
 * Tests creating artists in Payload CMS and verifying they exist.
 * Artists are used by Songs, Records, and Concerts collections.
 */

test.describe('Artists Collection', () => {
  test('should create artist via Payload UI and verify it exists in collection', async ({
    page,
  }, testInfo) => {
    const uniqueArtistName = `E2E Test Artist ${generateUniqueId()}`;

    await test.step('Log in to Payload CMS', async () => {
      await loginToPayload(page);
      await captureScreenshot(page, testInfo, '01-Artists-Dashboard');
    });

    await test.step('Navigate to Artists collection', async () => {
      await navigateToPayloadCollection(page, 'artists');
      await captureScreenshot(page, testInfo, '02-Artists-Collection-List');
    });

    await test.step('Create new artist', async () => {
      await clickPayloadCreateNew(page);
      await page.waitForURL('**/artists/create', { timeout: 30000 });

      // Wait for form to be ready
      await page.waitForSelector('form', { state: 'visible', timeout: 30000 });

      // Fill artist name (required field)
      await fillPayloadTextField(page, 'field-name', uniqueArtistName);

      await captureScreenshot(page, testInfo, '03-Artists-Filled-Form');
    });

    await test.step('Save the artist', async () => {
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'artists');
      await captureScreenshot(page, testInfo, '04-Artists-Saved');
    });

    await test.step('Verify artist exists in Payload by revisiting collection', async () => {
      await navigateToPayloadCollection(page, 'artists');

      // The artist should appear in the list
      await expect(page.getByText(uniqueArtistName)).toBeVisible({ timeout: 10000 });

      await captureScreenshot(page, testInfo, '05-Artists-In-List');
    });
  });
});
