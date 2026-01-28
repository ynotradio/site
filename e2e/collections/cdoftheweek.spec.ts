import { test, expect } from '@playwright/test';
import {
  captureScreenshot,
  fillPayloadDateField,
  generateUniqueId,
} from '../utils/test-helpers';
import {
  navigateToPayloadCollection,
  navigateToPayloadCollectionCreate,
  fillPayloadTextField,
  fillPayloadSlugField,
  generateSlug,
  clickPayloadSave,
  waitForPayloadSave,
  fillPayloadRichTextField,
  clickPayloadPublish,
} from '../utils/payload-helpers';

/**
 * E2E Integration Test: CD of the Week Collection
 *
 * Tests creating CD of the Week reviews in Payload CMS and verifying they exist.
 * CD of the Week requires a Record (which requires an Artist) to be created first.
 * Note: PHP page verification is intentionally skipped due to complexity.
 *
 * Note: Authentication is handled by the setup project - tests run with saved session state.
 */

test.describe('CD of the Week Collection', () => {
  test('should create CD of the Week review and verify it exists in collection', async ({
    page,
  }, testInfo) => {
    const uniqueId = generateUniqueId();
    const uniqueArtistName = `E2E COTW Artist ${uniqueId}`;
    const uniqueArtistSlug = generateSlug(uniqueArtistName);
    const uniqueAlbumTitle = `E2E Test Album ${uniqueId}`;
    const uniqueAlbumSlug = generateSlug(uniqueAlbumTitle);
    const uniqueReview = `This is an E2E test review - ${uniqueId}`;

    await test.step('Create an artist first (required for record)', async () => {
      await navigateToPayloadCollectionCreate(page, 'artists');

      await fillPayloadTextField(page, 'field-name', uniqueArtistName);
      await fillPayloadSlugField(page, uniqueArtistSlug);

      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'artists');

      await captureScreenshot(page, testInfo, '01-COTW-Artist-Created');
    });

    await test.step('Create a record (album) for the artist', async () => {
      await navigateToPayloadCollectionCreate(page, 'records');

      // Fill album title (required)
      await fillPayloadTextField(page, 'field-title', uniqueAlbumTitle);

      // Fill slug (required)
      await fillPayloadSlugField(page, uniqueAlbumSlug);

      // Select the artist we just created
      const artistField = page.locator('#field-artist');
      await artistField.locator('input[id^="react-select"]').click();
      await artistField.locator('input[id^="react-select"]').fill(uniqueArtistName);

      await page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 10000 });
      const option = page.getByRole('option').first();
      await option.waitFor({ state: 'visible', timeout: 10000 });
      await option.click();

      // Fill label
      await fillPayloadTextField(page, 'field-label', 'E2E Test Label');

      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'records');

      await captureScreenshot(page, testInfo, '02-COTW-Record-Created');
    });

    await test.step('Navigate directly to create CD of the Week form', async () => {
      await navigateToPayloadCollectionCreate(page, 'cdoftheweek');
      await captureScreenshot(page, testInfo, '03-COTW-Create-Form');
    });

    await test.step('Fill CD of the Week form', async () => {
      // Select the record we just created
      const recordField = page.locator('#field-record');
      await recordField.locator('input[id^="react-select"]').click();
      await recordField.locator('input[id^="react-select"]').fill(uniqueAlbumTitle);

      await page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 10000 });
      const recordOption = page.getByRole('option').first();
      await recordOption.waitFor({ state: 'visible', timeout: 10000 });
      await recordOption.click();

      // Fill review content (required rich text)
      await fillPayloadRichTextField(page, 'review', uniqueReview);

      // Fill date (required)
      const reviewDate = new Date();
      await fillPayloadDateField(page, 'field-date', reviewDate);

      await captureScreenshot(page, testInfo, '04-COTW-Filled-Form');
    });

    await test.step('Publish the CD of the Week', async () => {
      // CD of the Week has drafts enabled
      await clickPayloadPublish(page, 'cdoftheweek');
      await captureScreenshot(page, testInfo, '05-COTW-Published');
    });

    await test.step('Verify CD of the Week exists in Payload collection', async () => {
      await navigateToPayloadCollection(page, 'cdoftheweek');
      // Verify the album we created appears in the list
      await expect(page.getByText(uniqueAlbumTitle)).toBeVisible({ timeout: 10000 });
      await captureScreenshot(page, testInfo, '06-COTW-In-List');
    });
  });
});
