import { test, expect } from '@playwright/test';
import {
  captureScreenshot,
  generateUniqueId,
  checkForPhpErrors,
} from '../utils/test-helpers';
import {
  navigateToPayloadCollectionCreate,
  fillPayloadTextField,
  clickPayloadSave,
  waitForPayloadSave,
  fillPayloadCheckboxField,
  navigateToLegacySiteWithPostgres,
} from '../utils/payload-helpers';

/**
 * E2E Integration Test: Songs Collection (New Music)
 *
 * Tests creating songs in Payload CMS and verifying they appear on music.php.
 * Songs require an artist and must have featureOnNewMusic enabled to appear.
 *
 * Note: Authentication is handled by the setup project - tests run with saved session state.
 */

test.describe('Songs Collection (New Music)', () => {
  test('should create song with artist and verify it appears on music.php', async ({
    page,
  }, testInfo) => {
    const uniqueArtistName = `E2E Music Artist ${generateUniqueId()}`;
    const uniqueSongTitle = `E2E Test Song ${generateUniqueId()}`;

    await test.step('Create an artist first (required for song)', async () => {
      await navigateToPayloadCollectionCreate(page, 'artists');

      // Fill artist name
      await fillPayloadTextField(page, 'field-name', uniqueArtistName);

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

      // Select the artist we just created
      const artistField = page.locator('#field-artist');
      await artistField.locator('input[id^="react-select"]').click();
      await artistField.locator('input[id^="react-select"]').fill(uniqueArtistName);

      await page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 10000 });
      const option = page.getByRole('option').first();
      await option.waitFor({ state: 'visible', timeout: 10000 });
      await option.click();

      // Enable "Feature on New Music" checkbox so it appears on music.php
      await fillPayloadCheckboxField(page, 'field-featureOnNewMusic', true);

      await captureScreenshot(page, testInfo, '03-Songs-Filled-Form');
    });

    await test.step('Save the song', async () => {
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'songs');
      await captureScreenshot(page, testInfo, '04-Songs-Saved');
    });

    await test.step('Verify song appears on music.php', async () => {
      const response = await navigateToLegacySiteWithPostgres(
        page,
        'music.php',
        'use_postgres_music',
      );

      expect(response?.status()).toBe(200);

      const pageContent = await page.content();

      // Check for PHP errors
      const errors = checkForPhpErrors(pageContent);
      expect(errors).toHaveLength(0);

      // Verify the song title appears on the page
      expect(pageContent).toContain(uniqueSongTitle);

      // Verify the artist name appears on the page
      expect(pageContent).toContain(uniqueArtistName);

      await captureScreenshot(page, testInfo, '05-Songs-On-Music-Page');
    });
  });
});
