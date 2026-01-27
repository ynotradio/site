import { test, expect } from '@playwright/test';
import { captureScreenshot, generateUniqueId } from '../utils/test-helpers';
import {
  navigateToPayloadCollection,
  navigateToPayloadCollectionCreate,
  fillPayloadTextField,
  fillPayloadSlugField,
  generateSlug,
  clickPayloadSave,
  waitForPayloadSave,
} from '../utils/payload-helpers';

/**
 * E2E Integration Test: Artists Collection
 *
 * Tests creating artists in Payload CMS and verifying they exist.
 * Artists are used by Songs, Records, and Concerts collections.
 *
 * Note: Authentication is handled by the setup project - tests run with saved session state.
 */

test.describe('Artists Collection', () => {
  test('should create artist via Payload UI and verify it exists in collection', async ({
    page,
  }, testInfo) => {
    const uniqueId = generateUniqueId();
    const uniqueArtistName = `E2E Test Artist ${uniqueId}`;
    const uniqueSlug = generateSlug(uniqueArtistName);

    await test.step('Navigate directly to create artist form', async () => {
      await navigateToPayloadCollectionCreate(page, 'artists');
      await captureScreenshot(page, testInfo, '01-Artists-Create-Form');
    });

    await test.step('Fill artist form', async () => {
      // Fill artist name (required field)
      await fillPayloadTextField(page, 'field-name', uniqueArtistName);

      // Fill slug (required - unlock and fill)
      await fillPayloadSlugField(page, uniqueSlug);

      await captureScreenshot(page, testInfo, '02-Artists-Filled-Form');
    });

    await test.step('Save the artist', async () => {
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'artists');
      await captureScreenshot(page, testInfo, '03-Artists-Saved');
    });

    await test.step('Verify artist exists in Payload by revisiting collection', async () => {
      await navigateToPayloadCollection(page, 'artists');

      // The artist should appear in the list
      await expect(page.getByText(uniqueArtistName)).toBeVisible({ timeout: 10000 });

      await captureScreenshot(page, testInfo, '04-Artists-In-List');
    });
  });
});
