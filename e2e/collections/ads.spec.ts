import { test, expect } from '@playwright/test';
import { loginToPayload } from '../utils/payload-auth';
import {
  captureScreenshot,
  fillPayloadDateField,
  getFutureDate,
  generateUniqueId,
} from '../utils/test-helpers';
import {
  navigateToPayloadCollection,
  clickPayloadCreateNew,
  fillPayloadTextField,
  clickPayloadPublish,
} from '../utils/payload-helpers';

/**
 * E2E Integration Test: Ads Collection
 *
 * Tests creating advertisements in Payload CMS and verifying they exist.
 * Ads appear in the sidebar of the legacy PHP site when active.
 */

test.describe('Ads Collection', () => {
  test('should create ad via Payload UI and verify it exists in collection', async ({
    page,
  }, testInfo) => {
    const uniqueAdName = `E2E Test Ad ${generateUniqueId()}`;
    const uniqueWebUrl = `https://example.com/e2e-ad-${generateUniqueId()}`;

    await test.step('Log in to Payload CMS', async () => {
      await loginToPayload(page);
      await captureScreenshot(page, testInfo, '01-Ads-Dashboard');
    });

    await test.step('Navigate to Ads collection', async () => {
      await navigateToPayloadCollection(page, 'ads');
      await captureScreenshot(page, testInfo, '02-Ads-Collection-List');
    });

    await test.step('Create new ad', async () => {
      await clickPayloadCreateNew(page);
      await page.waitForURL('**/ads/create', { timeout: 30000 });

      // Wait for form to be ready
      await page.waitForSelector('form', { state: 'visible', timeout: 30000 });

      // Fill ad name (required field)
      await fillPayloadTextField(page, 'field-name', uniqueAdName);

      // Fill start date (today so it's active)
      const startDate = new Date();
      await fillPayloadDateField(page, 'field-startDate', startDate);

      // Fill end date (90 days from now)
      const endDate = getFutureDate(90);
      await fillPayloadDateField(page, 'field-endDate', endDate);

      // Fill web URL
      await fillPayloadTextField(page, 'field-webUrl', uniqueWebUrl);

      await captureScreenshot(page, testInfo, '03-Ads-Filled-Form');
    });

    await test.step('Publish the ad', async () => {
      // Ads collection has drafts enabled
      await clickPayloadPublish(page, 'ads');
      await captureScreenshot(page, testInfo, '04-Ads-Published');
    });

    await test.step('Verify ad exists in Payload by revisiting collection', async () => {
      await navigateToPayloadCollection(page, 'ads');

      // The ad should appear in the list
      await expect(page.getByText(uniqueAdName)).toBeVisible({ timeout: 10000 });

      await captureScreenshot(page, testInfo, '05-Ads-In-List');
    });
  });
});
