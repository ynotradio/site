import { test, expect } from '@playwright/test';
import {
  captureScreenshot,
  fillPayloadDateField,
  getFutureDate,
  generateUniqueId,
  checkForPhpErrors,
} from '../utils/test-helpers';
import {
  navigateToPayloadCollectionCreate,
  fillPayloadTextField,
  fillPayloadRichTextField,
  clickPayloadPublish,
  navigateToLegacySiteWithPostgres,
} from '../utils/payload-helpers';

/**
 * E2E Integration Test: Posts Collection
 *
 * Tests creating posts (stories) in Payload CMS and verifying they appear:
 * 1. On the homepage (index.php)
 * 2. As standalone pages via their slug
 *
 * Note: Authentication is handled by the setup project - tests run with saved session state.
 */

test.describe('Posts Collection', () => {
  test('should create post via Payload UI and verify it appears on homepage', async ({
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
      await fillPayloadRichTextField(page, 'field-content', uniqueContent);

      await captureScreenshot(page, testInfo, '02-Posts-Filled-Form');
    });

    await test.step('Publish the post', async () => {
      // Posts collection has drafts enabled, so we need to publish
      await clickPayloadPublish(page, 'posts');
      await captureScreenshot(page, testInfo, '03-Posts-Published');
    });

    await test.step('Verify post appears on homepage (index.php)', async () => {
      const response = await navigateToLegacySiteWithPostgres(
        page,
        'index.php',
        'use_postgres_stories',
      );

      expect(response?.status()).toBe(200);

      const pageContent = await page.content();

      // Check for PHP errors
      const errors = checkForPhpErrors(pageContent);
      expect(errors).toHaveLength(0);

      // Verify the unique headline we just created appears on the page
      expect(pageContent).toContain(uniqueHeadline);

      await captureScreenshot(page, testInfo, '04-Posts-On-Homepage');
    });
  });

  test('should create post with custom slug and verify standalone page loads', async ({
    page,
  }, testInfo) => {
    const uniqueId = generateUniqueId();
    const uniqueSlug = `e2e-test-post-${uniqueId}`;
    const uniqueHeadline = `E2E Standalone Page ${uniqueId}`;
    const uniqueContent = `This is standalone page content - ${uniqueId}`;

    await test.step('Navigate directly to create post form', async () => {
      await navigateToPayloadCollectionCreate(page, 'posts');
    });

    await test.step('Fill post form with custom slug', async () => {
      // Fill headline
      await fillPayloadTextField(page, 'field-headline', uniqueHeadline);

      // Fill custom slug
      await fillPayloadTextField(page, 'field-slug', uniqueSlug);

      // Fill dates
      const startDate = new Date();
      await fillPayloadDateField(page, 'field-startDate', startDate);
      const endDate = getFutureDate(90);
      await fillPayloadDateField(page, 'field-endDate', endDate);

      // Fill content
      await fillPayloadRichTextField(page, 'field-content', uniqueContent);

      await captureScreenshot(page, testInfo, '01-Posts-Slug-Form');
    });

    await test.step('Publish the post', async () => {
      await clickPayloadPublish(page, 'posts');
      await captureScreenshot(page, testInfo, '02-Posts-Slug-Published');
    });

    await test.step('Verify standalone page loads via slug', async () => {
      // Navigate to the standalone page using the slug
      const response = await navigateToLegacySiteWithPostgres(
        page,
        `pages.php?page=${uniqueSlug}`,
        'use_postgres_customtext',
      );

      expect(response?.status()).toBe(200);

      const pageContent = await page.content();

      // Check for PHP errors
      const errors = checkForPhpErrors(pageContent);
      expect(errors).toHaveLength(0);

      // Verify the content appears on the standalone page
      expect(pageContent).toContain(uniqueHeadline);

      await captureScreenshot(page, testInfo, '03-Posts-Standalone-Page');
    });
  });
});
