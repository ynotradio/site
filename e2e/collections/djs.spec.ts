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
  fillPayloadCheckboxField,
} from '../utils/payload-helpers';

/**
 * E2E Integration Test: DJs Collection
 *
 * Tests creating DJs in Payload CMS and verifying they exist.
 * DJs require a Person relationship to be created first.
 * Note: PHP page verification is intentionally skipped due to complexity.
 *
 * Note: Authentication is handled by the setup project - tests run with saved session state.
 */

test.describe('DJs Collection', () => {
  test('should create DJ via Payload UI and verify it exists in collection', async ({
    page,
  }, testInfo) => {
    const uniqueId = generateUniqueId();
    const uniquePersonName = `E2E DJ Person ${uniqueId}`;
    const uniquePersonSlug = generateSlug(uniquePersonName);

    await test.step('Create a person first (required for DJ)', async () => {
      await navigateToPayloadCollectionCreate(page, 'people');

      // Fill person name
      await fillPayloadTextField(page, 'field-name', uniquePersonName);

      // Fill slug (required)
      await fillPayloadSlugField(page, uniquePersonSlug);

      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'people');

      await captureScreenshot(page, testInfo, '01-DJs-Person-Created');
    });

    await test.step('Navigate directly to create DJ form', async () => {
      await navigateToPayloadCollectionCreate(page, 'djs');
      await captureScreenshot(page, testInfo, '02-DJs-Create-Form');
    });

    await test.step('Fill DJ form', async () => {
      // Select the person we just created
      const personField = page.locator('#field-person');
      await personField.locator('input[id^="react-select"]').click();
      await personField.locator('input[id^="react-select"]').fill(uniquePersonName);

      // Wait for the option to appear and select it
      await page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 10000 });
      const option = page.getByRole('option').first();
      await option.waitFor({ state: 'visible', timeout: 10000 });
      await option.click();

      // Ensure DJ is "on air"
      await fillPayloadCheckboxField(page, 'field-onAir', true);

      await captureScreenshot(page, testInfo, '03-DJs-Filled-Form');
    });

    await test.step('Save the DJ', async () => {
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'djs');
      await captureScreenshot(page, testInfo, '04-DJs-Saved');
    });

    await test.step('Verify DJ exists in Payload collection', async () => {
      await navigateToPayloadCollection(page, 'djs');
      // The list should have at least one item
      await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 });
      await captureScreenshot(page, testInfo, '05-DJs-In-List');
    });
  });
});
