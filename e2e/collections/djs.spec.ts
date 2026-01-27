import { test, expect } from '@playwright/test';
import { loginToPayload } from '../utils/payload-auth';
import { captureScreenshot, generateUniqueId, checkForPhpErrors } from '../utils/test-helpers';
import {
  navigateToPayloadCollection,
  clickPayloadCreateNew,
  fillPayloadTextField,
  clickPayloadSave,
  waitForPayloadSave,
  fillPayloadCheckboxField,
  navigateToLegacySiteWithPostgres,
} from '../utils/payload-helpers';

/**
 * E2E Integration Test: DJs Collection
 *
 * Tests creating DJs in Payload CMS and verifying they appear on deejays.php.
 * DJs require a Person relationship to be created first.
 */

test.describe('DJs Collection', () => {
  test('should create DJ via Payload UI and verify it appears on deejays.php', async ({
    page,
  }, testInfo) => {
    const uniquePersonName = `E2E DJ Person ${generateUniqueId()}`;

    await test.step('Log in to Payload CMS', async () => {
      await loginToPayload(page);
      await captureScreenshot(page, testInfo, '01-DJs-Dashboard');
    });

    await test.step('Create a person first (required for DJ)', async () => {
      await navigateToPayloadCollection(page, 'people');
      await clickPayloadCreateNew(page);
      await page.waitForURL('**/people/create', { timeout: 30000 });

      await page.waitForSelector('form', { state: 'visible', timeout: 30000 });

      // Fill person name
      await fillPayloadTextField(page, 'field-name', uniquePersonName);

      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'people');

      await captureScreenshot(page, testInfo, '02-DJs-Person-Created');
    });

    await test.step('Navigate to DJs collection', async () => {
      await navigateToPayloadCollection(page, 'djs');
      await captureScreenshot(page, testInfo, '03-DJs-Collection-List');
    });

    await test.step('Create new DJ', async () => {
      await clickPayloadCreateNew(page);
      await page.waitForURL('**/djs/create', { timeout: 30000 });

      // Wait for form to be ready
      await page.waitForSelector('form', { state: 'visible', timeout: 30000 });

      // Select the person we just created
      const personField = page.locator('#field-person');
      await personField.locator('input[id^="react-select"]').click();
      await personField.locator('input[id^="react-select"]').fill(uniquePersonName);

      // Wait for the option to appear and select it
      await page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 10000 });
      const option = page.getByRole('option').first();
      await option.waitFor({ state: 'visible', timeout: 10000 });
      await option.click();

      // Ensure DJ is "on air" so it appears on the page
      await fillPayloadCheckboxField(page, 'field-onAir', true);

      await captureScreenshot(page, testInfo, '04-DJs-Filled-Form');
    });

    await test.step('Save the DJ', async () => {
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'djs');
      await captureScreenshot(page, testInfo, '05-DJs-Saved');
    });

    await test.step('Verify DJ appears on deejays.php', async () => {
      const response = await navigateToLegacySiteWithPostgres(
        page,
        'deejays.php',
        'use_postgres_deejays',
      );

      expect(response?.status()).toBe(200);

      const pageContent = await page.content();

      // Check for PHP errors
      const errors = checkForPhpErrors(pageContent);
      expect(errors).toHaveLength(0);

      // Verify the DJ (person name) appears on the page
      expect(pageContent).toContain(uniquePersonName);

      await captureScreenshot(page, testInfo, '06-DJs-On-Deejays-Page');
    });
  });
});
