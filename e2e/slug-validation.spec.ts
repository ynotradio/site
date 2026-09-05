/**
 * E2E Tests: Slug Field Validation UX
 *
 * Verifies that when a required slug field shows a validation error, the Unlock
 * button in the label-wrapper remains visible and clickable (not blocked by the
 * absolute-positioned error tooltip). Regression test for ynotradio/site#591.
 *
 * Authentication is handled inline so these tests can run in CI without the
 * global auth setup project.
 */
import { test as baseTest, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { captureScreenshot, generateUniqueId } from './utils/test-helpers';
import { loginToPayload } from './utils/payload-auth';
import {
  navigateToPayloadCollectionCreate,
  fillPayloadTextField,
  clickPayloadSave,
  waitForPayloadSave,
  generateSlug,
} from './utils/payload-helpers';

const PAYLOAD_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

// Override storageState so these tests handle their own auth.
const test = baseTest.extend({
  // eslint-disable-next-line no-empty-pattern
  storageState: async ({}, runTest) => {
    await runTest({});
  },
});

test.describe('Slug field validation UX', () => {
  test.beforeEach(async ({ page }) => {
    await loginToPayload(page);
  });

  // The original premise (click Save on empty form → per-field tooltip appears
  // → verify Unlock button isn't blocked) only works in `next dev`. In Payload's
  // production build the form short-circuits client validation and submits to
  // the server, which returns a generic 400 with no per-field info, so the
  // `.field-error.tooltip--show` element never renders. The CSS fix from
  // PR #622 is what guards the actual user bug; this test is left here as a
  // skipped reminder until we have a robust way to deterministically render the
  // per-field tooltip in production builds.
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  test.skip('Unlock button remains clickable when slug validation error is shown', async ({
    page,
  }, testInfo) => {
    await test.step('Navigate to song create form', async () => {
      await page.goto(`${PAYLOAD_BASE_URL}/admin/collections/songs/create`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      await page.waitForSelector('form', { state: 'visible', timeout: 30000 });
    });

    await test.step('Attempt save without filling required fields to trigger validation', async () => {
      // Touch the Title field (type then clear) so the client-side useField
      // validator runs and marks Title (and the auto-generated slug) invalid.
      // In production builds the initial form state has `valid: undefined`,
      // so without first dirtying a required field, validateForm() short-circuits
      // and the form submits to the server, which returns a generic 400 with no
      // per-field error info — no tooltip would appear.
      const titleInput = page.locator('#field-title');
      await titleInput.click();
      await titleInput.fill('x');
      await titleInput.fill('');
      await titleInput.blur();

      await page.getByRole('button', { name: /save/i }).click();
      // Wait for the validation error to appear on the slug field
      await page.waitForSelector('.field-error.tooltip--show', {
        state: 'visible',
        timeout: 15000,
      });
      await captureScreenshot(page, testInfo, '01-validation-errors-shown');
    });

    await test.step('Verify Unlock button is visible and not obscured by the error', async () => {
      const unlockButton = page.getByRole('button', { name: /unlock/i });
      await expect(unlockButton).toBeVisible({ timeout: 10000 });

      // Verify the button is within the expected slug label-wrapper and is
      // pointer-interactive (i.e., it is not covered by the error tooltip).
      await captureScreenshot(page, testInfo, '02-unlock-button-visible');
    });

    await test.step('Click Unlock button successfully despite validation error', async () => {
      const unlockButton = page.getByRole('button', { name: /unlock/i });

      // This click would fail if the error tooltip had pointer-events blocking the button.
      await unlockButton.click();

      // After unlocking, the slug input should become editable (not read-only).
      const slugInput = page.locator('#field-slug');
      await expect(slugInput).toBeEnabled({ timeout: 5000 });
      await expect(slugInput).not.toHaveAttribute('readOnly', { timeout: 5000 });

      await captureScreenshot(page, testInfo, '03-slug-field-unlocked');
    });

    await test.step('Editor can type in the slug field after unlocking', async () => {
      const slugInput = page.locator('#field-slug');
      await slugInput.fill('e2e-test-slug-validation');
      await expect(slugInput).toHaveValue('e2e-test-slug-validation');

      await captureScreenshot(page, testInfo, '04-slug-field-filled');
    });
  });
});

/**
 * Regression tests for ynotradio/site#866 — slug generation must never block a
 * save. A Song's slug is generated server-side from artist + title; the editor
 * never types it. Previously that generation could yield an empty or unresolved
 * (Promise) value and the required slug field rejected the save with a generic
 * "invalid slug". These tests create a Song WITHOUT touching the slug field and
 * assert the save succeeds with a valid, non-empty slug and no field error.
 */
test.describe('Slug generation never blocks a save (#866)', () => {
  test.beforeEach(async ({ page }) => {
    await loginToPayload(page);
  });

  async function createArtist(page: Page, name: string): Promise<void> {
    await navigateToPayloadCollectionCreate(page, 'artists');
    await fillPayloadTextField(page, 'field-name', name);
    await clickPayloadSave(page);
    await waitForPayloadSave(page, 'artists');
  }

  async function selectArtist(page: Page, artistName: string): Promise<void> {
    const artistField = page.locator('#field-artist');
    await artistField.locator('input[id^="react-select"]').click();
    await artistField.locator('input[id^="react-select"]').fill(artistName);
    await page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 10000 });
    await page.getByRole('option').first().click();
  }

  test('auto-generates a valid artist--title slug and saves without an error', async ({
    page,
  }, testInfo) => {
    const id = generateUniqueId();
    const artistName = `E2E Slug Artist ${id}`;
    const songTitle = `E2E Slug Song ${id}`;
    const expectedSlug = `${generateSlug(artistName)}--${generateSlug(songTitle)}`;

    await test.step('Create the artist', async () => {
      await createArtist(page, artistName);
    });

    await test.step('Create a song without touching the slug field', async () => {
      await navigateToPayloadCollectionCreate(page, 'songs');
      await fillPayloadTextField(page, 'field-title', songTitle);
      await selectArtist(page, artistName);
      await captureScreenshot(page, testInfo, '01-song-filled-no-slug');
    });

    await test.step('Save succeeds — no invalid-slug error, valid slug generated', async () => {
      await clickPayloadSave(page);
      // Resolves only if the save actually went through (times out if blocked).
      await waitForPayloadSave(page, 'songs');
      // No per-field validation error tooltip is shown.
      await expect(page.locator('.field-error.tooltip--show')).toHaveCount(0);
      // The slug was generated server-side into the expected artist--title form.
      await expect(page.locator('#field-slug')).toHaveValue(expectedSlug);
      await captureScreenshot(page, testInfo, '02-song-saved-with-slug');
    });
  });

  test('saves a song whose title has slug-hostile characters', async ({ page }, testInfo) => {
    const id = generateUniqueId();
    const artistName = `E2E Symbol Artist ${id}`;
    // A title dominated by characters that strip away when slugified; the unique
    // id keeps the resulting slug valid AND unique so the run is repeatable.
    const songTitle = `♪♫★ & / ? ${id}`;

    await test.step('Create the artist', async () => {
      await createArtist(page, artistName);
    });

    await test.step('Create the song with a slug-hostile title', async () => {
      await navigateToPayloadCollectionCreate(page, 'songs');
      await fillPayloadTextField(page, 'field-title', songTitle);
      await selectArtist(page, artistName);
      await captureScreenshot(page, testInfo, '01-symbol-song-filled');
    });

    await test.step('Save still succeeds with a valid, non-empty slug', async () => {
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'songs');
      await expect(page.locator('.field-error.tooltip--show')).toHaveCount(0);
      // Slug is non-empty and URL-safe (lowercase alphanumerics + hyphens).
      await expect(page.locator('#field-slug')).toHaveValue(/^[a-z0-9]+(?:-+[a-z0-9]+)*$/);
      await captureScreenshot(page, testInfo, '02-symbol-song-saved');
    });
  });
});
