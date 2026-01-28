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
  clickPayloadPublish,
} from '../utils/payload-helpers';

/**
 * E2E Integration Test: On Demand Collection
 *
 * Tests creating On Demand recordings in Payload CMS and verifying they exist.
 * Note: PHP page verification is intentionally skipped due to complexity.
 *
 * Note: Authentication is handled by the setup project - tests run with saved session state.
 */

test.describe('On Demand Collection', () => {
  test('should create On Demand recording and verify it exists in collection', async ({
    page,
  }, testInfo) => {
    const uniqueId = generateUniqueId();
    const uniqueHeadline = `E2E On Demand Recording ${uniqueId}`;

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

      await captureScreenshot(page, testInfo, '02-OnDemand-Filled-Form');
    });

    await test.step('Publish the On Demand recording', async () => {
      // On Demand has drafts enabled
      await clickPayloadPublish(page, 'ondemand');
      await captureScreenshot(page, testInfo, '03-OnDemand-Published');
    });

    await test.step('Verify On Demand recording exists in Payload collection', async () => {
      await navigateToPayloadCollection(page, 'ondemand');
      // The headline should appear in the list
      await expect(page.getByText(uniqueHeadline)).toBeVisible({ timeout: 10000 });
      await captureScreenshot(page, testInfo, '04-OnDemand-In-List');
    });
  });
});
