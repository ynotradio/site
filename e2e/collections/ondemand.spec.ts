import { test, expect } from '@playwright/test';
import {
  captureScreenshot,
  fillPayloadDateField,
  generateUniqueId,
  checkForPhpErrors,
} from '../utils/test-helpers';
import {
  navigateToPayloadCollectionCreate,
  fillPayloadTextField,
  fillPayloadRelationshipField,
  clickPayloadSave,
  waitForPayloadSave,
  fillPayloadRichTextField,
  clickPayloadPublish,
  navigateToLegacySiteWithPostgres,
} from '../utils/payload-helpers';

/**
 * E2E Integration Test: On Demand Collection
 *
 * Tests creating On Demand recordings in Payload CMS and verifying they appear on ondemand.php.
 * On Demand recordings can be associated with DJs, artists, and songs.
 *
 * Note: Authentication is handled by the setup project - tests run with saved session state.
 */

test.describe('On Demand Collection', () => {
  test('should create On Demand recording and verify it appears on ondemand.php', async ({
    page,
  }, testInfo) => {
    const uniqueHeadline = `E2E On Demand Recording ${generateUniqueId()}`;
    const uniqueDescription = `This is an E2E test on-demand description - ${generateUniqueId()}`;

    await test.step('Navigate directly to create On Demand form', async () => {
      await navigateToPayloadCollectionCreate(page, 'ondemand');
      await captureScreenshot(page, testInfo, '01-OnDemand-Create-Form');
    });

    await test.step('Fill On Demand form', async () => {
      // Fill date (required)
      const recordingDate = new Date();
      await fillPayloadDateField(page, 'field-date', recordingDate);

      // Fill headline (required)
      await fillPayloadTextField(page, 'field-headline', uniqueHeadline);

      // Fill description (rich text)
      await fillPayloadRichTextField(page, 'field-description', uniqueDescription);

      // Optionally associate with DJs (if seeded data exists)
      try {
        await fillPayloadRelationshipField(page, 'field-djs', 0);
      } catch {
        // No DJs available, skip
      }

      // Optionally associate with artists (if seeded data exists)
      try {
        await fillPayloadRelationshipField(page, 'field-artists', 0);
      } catch {
        // No artists available, skip
      }

      await captureScreenshot(page, testInfo, '02-OnDemand-Filled-Form');
    });

    await test.step('Publish the On Demand recording', async () => {
      // On Demand has drafts enabled
      await clickPayloadPublish(page, 'ondemand');
      await captureScreenshot(page, testInfo, '03-OnDemand-Published');
    });

    await test.step('Verify On Demand recording appears on ondemand.php', async () => {
      const response = await navigateToLegacySiteWithPostgres(
        page,
        'ondemand.php',
        'use_postgres_ondemand',
      );

      expect(response?.status()).toBe(200);

      const pageContent = await page.content();

      // Check for PHP errors
      const errors = checkForPhpErrors(pageContent);
      expect(errors).toHaveLength(0);

      // Verify the headline appears on the page
      expect(pageContent).toContain(uniqueHeadline);

      await captureScreenshot(page, testInfo, '04-OnDemand-On-Page');
    });
  });

  test('should create On Demand with associated artist/songs and verify on page', async ({
    page,
  }, testInfo) => {
    const uniqueArtistName = `E2E OnDemand Artist ${generateUniqueId()}`;
    const uniqueSongTitle = `E2E OnDemand Song ${generateUniqueId()}`;
    const uniqueHeadline = `E2E On Demand with Assoc ${generateUniqueId()}`;

    await test.step('Create an artist', async () => {
      await navigateToPayloadCollectionCreate(page, 'artists');

      await fillPayloadTextField(page, 'field-name', uniqueArtistName);

      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'artists');

      await captureScreenshot(page, testInfo, '01-OnDemand-Artist-Created');
    });

    await test.step('Create a song for the artist', async () => {
      await navigateToPayloadCollectionCreate(page, 'songs');

      await fillPayloadTextField(page, 'field-title', uniqueSongTitle);

      // Select the artist we just created
      const artistField = page.locator('#field-artist');
      await artistField.locator('input[id^="react-select"]').click();
      await artistField.locator('input[id^="react-select"]').fill(uniqueArtistName);

      await page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 10000 });
      const option = page.getByRole('option').first();
      await option.waitFor({ state: 'visible', timeout: 10000 });
      await option.click();

      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'songs');

      await captureScreenshot(page, testInfo, '02-OnDemand-Song-Created');
    });

    await test.step('Navigate directly to create On Demand form', async () => {
      await navigateToPayloadCollectionCreate(page, 'ondemand');
    });

    await test.step('Fill On Demand form with associations', async () => {
      // Fill date
      const recordingDate = new Date();
      await fillPayloadDateField(page, 'field-date', recordingDate);

      // Fill headline
      await fillPayloadTextField(page, 'field-headline', uniqueHeadline);

      // Associate with the artist we created
      const artistsField = page.locator('#field-artists');
      await artistsField.locator('input[id^="react-select"]').click();
      await artistsField.locator('input[id^="react-select"]').fill(uniqueArtistName);

      await page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 10000 });
      const artistOption = page.getByRole('option').first();
      await artistOption.waitFor({ state: 'visible', timeout: 10000 });
      await artistOption.click();

      // Associate with the song we created
      const songsField = page.locator('#field-songs');
      await songsField.locator('input[id^="react-select"]').click();
      await songsField.locator('input[id^="react-select"]').fill(uniqueSongTitle);

      await page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 10000 });
      const songOption = page.getByRole('option').first();
      await songOption.waitFor({ state: 'visible', timeout: 10000 });
      await songOption.click();

      await captureScreenshot(page, testInfo, '03-OnDemand-With-Associations');
    });

    await test.step('Publish the On Demand recording', async () => {
      await clickPayloadPublish(page, 'ondemand');
      await captureScreenshot(page, testInfo, '04-OnDemand-Assoc-Published');
    });

    await test.step('Verify On Demand recording with associations on page', async () => {
      const response = await navigateToLegacySiteWithPostgres(
        page,
        'ondemand.php',
        'use_postgres_ondemand',
      );

      expect(response?.status()).toBe(200);

      const pageContent = await page.content();

      // Check for PHP errors
      const errors = checkForPhpErrors(pageContent);
      expect(errors).toHaveLength(0);

      // Verify the headline appears on the page
      expect(pageContent).toContain(uniqueHeadline);

      await captureScreenshot(page, testInfo, '05-OnDemand-Assoc-On-Page');
    });
  });
});
