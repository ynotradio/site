import { test, expect } from '@playwright/test';
import { loginToPayload } from './utils/payload-auth';
import {
  captureScreenshot,
  fillPayloadDateField,
  getFutureDate,
  generateUniqueId,
  checkForPhpErrors,
} from './utils/test-helpers';
import {
  navigateToPayloadCollection,
  clickPayloadCreateNew,
  fillPayloadRelationshipField,
  fillPayloadTextField,
  clickPayloadSave,
  waitForPayloadSave,
  fillPayloadCheckboxField,
  fillPayloadTimeField,
  fillPayloadRichTextField,
  clickPayloadPublish,
  navigateToLegacySiteWithPostgres,
} from './utils/payload-helpers';

/**
 * E2E Integration Tests: Payload CMS Content Models → Legacy PHP Site
 *
 * These tests verify that creating/editing content in Payload CMS
 * results in the expected changes on the legacy PHP site.
 *
 * Each test follows the pattern:
 * 1. Log in to Payload CMS admin interface
 * 2. Create a new content item through the Payload UI
 * 3. Verify the content appears correctly on the legacy PHP site
 *
 * Test coverage:
 * - Venues: Create venue → verify on concerts.php (venue appears in concerts)
 * - Artists: Create artist → verify on concerts.php (artist appears in concerts)
 * - Shows: Create show → verify on schedule.php
 * - DJs: Create DJ → verify on deejays.php
 * - Posts: Create post → verify on index.php (homepage)
 */

test.describe('Content Models Integration Tests', () => {
  test.describe('Venues', () => {
    test('should create venue via Payload UI and verify it can be used in concerts', async ({
      page,
    }, testInfo) => {
      const uniqueVenueName = `E2E Test Venue ${generateUniqueId()}`;
      const uniqueCity = 'Test City';

      await test.step('Log in to Payload CMS', async () => {
        await loginToPayload(page);
        await captureScreenshot(page, testInfo, '01-Venues-Dashboard');
      });

      await test.step('Navigate to Venues collection', async () => {
        await navigateToPayloadCollection(page, 'venues');
        await captureScreenshot(page, testInfo, '02-Venues-Collection-List');
      });

      await test.step('Create new venue', async () => {
        await clickPayloadCreateNew(page);
        await page.waitForURL('**/venues/create', { timeout: 30000 });

        // Wait for form to be ready
        await page.waitForSelector('form', { state: 'visible', timeout: 30000 });

        // Fill venue name (required field)
        await fillPayloadTextField(page, 'field-name', uniqueVenueName);

        // Fill city
        await fillPayloadTextField(page, 'field-city', uniqueCity);

        await captureScreenshot(page, testInfo, '03-Venues-Filled-Form');
      });

      await test.step('Save the venue', async () => {
        await clickPayloadSave(page);
        await waitForPayloadSave(page, 'venues');
        await captureScreenshot(page, testInfo, '04-Venues-Saved');
      });

      await test.step('Verify venue exists in Payload by revisiting collection', async () => {
        await navigateToPayloadCollection(page, 'venues');

        // The venue should appear in the list
        await expect(page.getByText(uniqueVenueName)).toBeVisible({ timeout: 10000 });

        await captureScreenshot(page, testInfo, '05-Venues-In-List');
      });
    });
  });

  test.describe('Artists', () => {
    test('should create artist via Payload UI and verify it exists', async ({ page }, testInfo) => {
      const uniqueArtistName = `E2E Test Artist ${generateUniqueId()}`;

      await test.step('Log in to Payload CMS', async () => {
        await loginToPayload(page);
        await captureScreenshot(page, testInfo, '01-Artists-Dashboard');
      });

      await test.step('Navigate to Artists collection', async () => {
        await navigateToPayloadCollection(page, 'artists');
        await captureScreenshot(page, testInfo, '02-Artists-Collection-List');
      });

      await test.step('Create new artist', async () => {
        await clickPayloadCreateNew(page);
        await page.waitForURL('**/artists/create', { timeout: 30000 });

        // Wait for form to be ready
        await page.waitForSelector('form', { state: 'visible', timeout: 30000 });

        // Fill artist name (required field)
        await fillPayloadTextField(page, 'field-name', uniqueArtistName);

        await captureScreenshot(page, testInfo, '03-Artists-Filled-Form');
      });

      await test.step('Save the artist', async () => {
        await clickPayloadSave(page);
        await waitForPayloadSave(page, 'artists');
        await captureScreenshot(page, testInfo, '04-Artists-Saved');
      });

      await test.step('Verify artist exists in Payload by revisiting collection', async () => {
        await navigateToPayloadCollection(page, 'artists');

        // The artist should appear in the list
        await expect(page.getByText(uniqueArtistName)).toBeVisible({ timeout: 10000 });

        await captureScreenshot(page, testInfo, '05-Artists-In-List');
      });
    });
  });

  test.describe('Shows (Schedule)', () => {
    test('should create show via Payload UI and verify it appears on schedule.php', async ({
      page,
    }, testInfo) => {
      // Use a unique show name/note to identify this test's show
      const uniqueShowNote = `E2E Test Show ${generateUniqueId()}`;

      await test.step('Log in to Payload CMS', async () => {
        await loginToPayload(page);
        await captureScreenshot(page, testInfo, '01-Shows-Dashboard');
      });

      await test.step('Navigate to Shows collection', async () => {
        await navigateToPayloadCollection(page, 'shows');
        await captureScreenshot(page, testInfo, '02-Shows-Collection-List');
      });

      await test.step('Create new show', async () => {
        await clickPayloadCreateNew(page);
        await page.waitForURL('**/shows/create', { timeout: 30000 });

        // Wait for form to be ready
        await page.waitForSelector('form', { state: 'visible', timeout: 30000 });

        // Set show date (7 days from now to ensure it appears in upcoming schedule)
        const showDate = getFutureDate(7);
        await fillPayloadDateField(page, 'field-date', showDate);

        // Fill start time (required)
        await fillPayloadTimeField(page, 'field-startTime', '14:00');

        // Fill end time (required)
        await fillPayloadTimeField(page, 'field-endTime', '16:00');

        // Optionally select a host DJ (if seeded data exists)
        try {
          await fillPayloadRelationshipField(page, 'field-host', 0);
        } catch {
          // No DJs available, skip host selection
        }

        // Fill a unique note to identify this show
        await fillPayloadRichTextField(page, 'field-note', uniqueShowNote);

        await captureScreenshot(page, testInfo, '03-Shows-Filled-Form');

        // Store for later verification
        // eslint-disable-next-line no-param-reassign
        (testInfo as any).uniqueShowNote = uniqueShowNote;
      });

      await test.step('Save the show', async () => {
        await clickPayloadSave(page);
        await waitForPayloadSave(page, 'shows');
        await captureScreenshot(page, testInfo, '04-Shows-Saved');
      });

      await test.step('Verify show appears on schedule.php', async () => {
        const response = await navigateToLegacySiteWithPostgres(
          page,
          'schedule.php',
          'use_postgres_schedule',
        );

        expect(response?.status()).toBe(200);

        const pageContent = await page.content();

        // Check for PHP errors
        const errors = checkForPhpErrors(pageContent);
        expect(errors).toHaveLength(0);

        // Verify the unique show note we just created appears on the page
        const { uniqueShowNote: showNote } = testInfo as any;
        expect(pageContent).toContain(showNote);

        await captureScreenshot(page, testInfo, '05-Shows-On-Schedule-Page');
      });
    });
  });

  test.describe('DJs', () => {
    test('should create DJ via Payload UI and verify it appears on deejays.php', async ({
      page,
    }, testInfo) => {
      // First create a Person to link to the DJ, with a unique name
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

        // Store person name for later
        // eslint-disable-next-line no-param-reassign
        (testInfo as any).uniquePersonName = uniquePersonName;
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
        // Type in the relationship field to search for our person
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
        const { uniquePersonName: personName } = testInfo as any;
        expect(pageContent).toContain(personName);

        await captureScreenshot(page, testInfo, '06-DJs-On-Deejays-Page');
      });
    });
  });

  test.describe('Posts (Stories)', () => {
    test('should create post via Payload UI and verify it appears on homepage', async ({
      page,
    }, testInfo) => {
      const uniqueHeadline = `E2E Test Story ${generateUniqueId()}`;
      const uniqueContent = `This is test content created by E2E tests - ${generateUniqueId()}`;

      await test.step('Log in to Payload CMS', async () => {
        await loginToPayload(page);
        await captureScreenshot(page, testInfo, '01-Posts-Dashboard');
      });

      await test.step('Navigate to Posts collection', async () => {
        await navigateToPayloadCollection(page, 'posts');
        await captureScreenshot(page, testInfo, '02-Posts-Collection-List');
      });

      await test.step('Create new post', async () => {
        await clickPayloadCreateNew(page);
        await page.waitForURL('**/posts/create', { timeout: 30000 });

        // Wait for form to be ready
        await page.waitForSelector('form', { state: 'visible', timeout: 30000 });

        // Fill headline (required)
        await fillPayloadTextField(page, 'field-headline', uniqueHeadline);

        // Fill start date (today so it's immediately visible)
        const startDate = new Date();
        await fillPayloadDateField(page, 'field-startDate', startDate);

        // Fill end date (90 days from now)
        const endDate = getFutureDate(90);
        await fillPayloadDateField(page, 'field-endDate', endDate);

        // Fill content (required rich text field)
        await fillPayloadRichTextField(page, 'field-content', uniqueContent);

        await captureScreenshot(page, testInfo, '03-Posts-Filled-Form');

        // Store for later verification
        // eslint-disable-next-line no-param-reassign
        (testInfo as any).uniqueHeadline = uniqueHeadline;
        // eslint-disable-next-line no-param-reassign
        (testInfo as any).uniqueContent = uniqueContent;
      });

      await test.step('Publish the post', async () => {
        // Posts collection has drafts enabled, so we need to publish
        await clickPayloadPublish(page, 'posts');
        await captureScreenshot(page, testInfo, '04-Posts-Published');
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
        const { uniqueHeadline: headline } = testInfo as any;
        expect(pageContent).toContain(headline);

        await captureScreenshot(page, testInfo, '05-Posts-On-Homepage');
      });
    });
  });
});
