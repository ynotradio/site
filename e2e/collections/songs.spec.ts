import { test, expect } from '@playwright/test';
import {
  captureScreenshot,
  generateUniqueId,
  fillPayloadDateField,
} from '../utils/test-helpers';
import {
  navigateToPayloadCollection,
  navigateToPayloadCollectionCreate,
  fillPayloadTextField,
  fillPayloadSlugField,
  generateSlug,
  clickPayloadSave,
  waitForPayloadSave,
  fillPayloadCheckboxField,
} from '../utils/payload-helpers';

/**
 * E2E Integration Test: Songs Collection (New Music)
 *
 * Tests creating songs in Payload CMS and verifying they exist.
 * Songs require an artist.
 * Note: PHP page verification is intentionally skipped due to complexity.
 *
 * Note: Authentication is handled by the setup project - tests run with saved session state.
 */

test.describe('Songs Collection (New Music)', () => {
  test('should create song with artist and verify it exists in collection', async ({
    page,
  }, testInfo) => {
    const uniqueId = generateUniqueId();
    const uniqueArtistName = `E2E Music Artist ${uniqueId}`;
    const uniqueArtistSlug = generateSlug(uniqueArtistName);
    const uniqueSongTitle = `E2E Test Song ${uniqueId}`;
    const uniqueSongSlug = generateSlug(uniqueSongTitle);

    await test.step('Create an artist first (required for song)', async () => {
      await navigateToPayloadCollectionCreate(page, 'artists');

      // Fill artist name
      await fillPayloadTextField(page, 'field-name', uniqueArtistName);

      // Fill slug (required)
      await fillPayloadSlugField(page, uniqueArtistSlug);

      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'artists');

      await captureScreenshot(page, testInfo, '01-Songs-Artist-Created');
    });

    await test.step('Navigate directly to create song form', async () => {
      await navigateToPayloadCollectionCreate(page, 'songs');
      await captureScreenshot(page, testInfo, '02-Songs-Create-Form');
    });

    await test.step('Fill song form', async () => {
      // Fill song title (required)
      await fillPayloadTextField(page, 'field-title', uniqueSongTitle);

      // Fill slug (required)
      await fillPayloadSlugField(page, uniqueSongSlug);

      // Set release date (today)
      await fillPayloadDateField(page, 'field-releaseDate', new Date());

      // Select the artist we just created
      const artistField = page.locator('#field-artist');
      await artistField.locator('input[id^="react-select"]').click();
      await artistField.locator('input[id^="react-select"]').fill(uniqueArtistName);

      await page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 10000 });
      const option = page.getByRole('option').first();
      await option.waitFor({ state: 'visible', timeout: 10000 });
      await option.click();

      // Enable "Feature on New Music" checkbox
      await fillPayloadCheckboxField(page, 'field-featureOnNewMusic', true);

      await captureScreenshot(page, testInfo, '03-Songs-Filled-Form');
    });

    await test.step('Save the song', async () => {
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'songs');
      await captureScreenshot(page, testInfo, '04-Songs-Saved');
    });

    await test.step('Verify song exists in Payload collection', async () => {
      await navigateToPayloadCollection(page, 'songs');
      // The song should appear in the list
      await expect(page.getByText(uniqueSongTitle)).toBeVisible({ timeout: 10000 });
      await captureScreenshot(page, testInfo, '05-Songs-In-List');
    });
  });
});
