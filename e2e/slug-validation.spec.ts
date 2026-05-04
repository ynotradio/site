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
import { captureScreenshot } from './utils/test-helpers';
import { loginToPayload } from './utils/payload-auth';

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

  test('Unlock button remains clickable when slug validation error is shown', async ({
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
