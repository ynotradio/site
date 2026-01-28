import { test, expect } from '@playwright/test';
import {
  captureScreenshot,
  fillPayloadDateField,
  getFutureDate,
  generateUniqueId,
} from '../utils/test-helpers';
import {
  navigateToPayloadCollection,
  navigateToPayloadCollectionCreate,
  fillPayloadTextField,
  fillPayloadRichTextField,
  clickPayloadPublish,
} from '../utils/payload-helpers';

/**
 * E2E Integration Test: Posts Collection
 *
 * Tests creating posts (stories) in Payload CMS and verifying they exist.
 * Note: PHP page verification is intentionally skipped due to complexity
 * with date filters and feature flags - this test focuses on Payload CRUD.
 *
 * Note: Authentication is handled by the setup project - tests run with saved session state.
 */

test.describe('Posts Collection', () => {
  test('should create post via Payload UI and verify it exists in collection', async ({
    page,
  }, testInfo) => {
    const uniqueId = generateUniqueId();
    const uniqueHeadline = `E2E Test Story ${uniqueId}`;
    const uniqueSlug = `e2e-test-story-${uniqueId}`;
    const uniqueContent = `This is test content created by E2E tests - ${uniqueId}`;

    await test.step('Navigate directly to create post form', async () => {
      await navigateToPayloadCollectionCreate(page, 'posts');
      await captureScreenshot(page, testInfo, '01-Posts-Create-Form');
    });

    await test.step('Fill post form', async () => {
      // Fill headline (required)
      await fillPayloadTextField(page, 'field-headline', uniqueHeadline);

      // Fill slug (required - must be URL-friendly)
      await fillPayloadTextField(page, 'field-slug', uniqueSlug);

      // Fill start date (today so it's immediately visible)
      const startDate = new Date();
      await fillPayloadDateField(page, 'field-startDate', startDate);

      // Fill end date (90 days from now)
      const endDate = getFutureDate(90);
      await fillPayloadDateField(page, 'field-endDate', endDate);

      // Fill content (required rich text field)
      await fillPayloadRichTextField(page, 'content', uniqueContent);

      await captureScreenshot(page, testInfo, '02-Posts-Filled-Form');
    });

    await test.step('Publish the post', async () => {
      // Posts collection has drafts enabled, so we need to publish
      await clickPayloadPublish(page, 'posts');
      await captureScreenshot(page, testInfo, '03-Posts-Published');
    });

    await test.step('Verify post exists in Payload collection', async () => {
      await navigateToPayloadCollection(page, 'posts');
      // The post should appear in the list
      await expect(page.getByText(uniqueHeadline)).toBeVisible({ timeout: 10000 });
      await captureScreenshot(page, testInfo, '04-Posts-In-List');
    });
  });
});
