/**
 * Year End Poll E2E Tests
 *
 * Tests for the Y-Not Radio Year End Poll feature.
 * The poll allows users to vote in 12 categories with different max picks,
 * and enter a contest for prizes.
 *
 * Poll Categories (from SqlYearEndPoll model):
 * - songs (20 picks), albums (10), artists (5), concerts (2),
 *   new_artists (3), philly_artists (5), most_anticipated_albums (2),
 *   tv_dramas (3), tv_comedies (3), best_movies (3),
 *   worst_movies (2), unnecessary_sequels (2)
 *
 * Note: The poll is seasonal. When closed, yearendpoll.php redirects.
 * Set FORCE_YEAR_END_POLL_OPEN=true in .env.local to test the active state.
 */
import { test, expect, Page } from '@playwright/test';
import { checkForPhpErrors, captureScreenshot, navigateWithRetry } from './utils/test-helpers';

const LEGACY_BASE_URL = process.env.LEGACY_BASE_URL || 'http://localhost:8080';

/**
 * Check if poll is currently active (not redirecting)
 */
async function isPollActive(page: Page): Promise<boolean> {
  const { finalUrl } = await navigateWithRetry(page, `${LEGACY_BASE_URL}/yearendpoll.php`);
  return finalUrl.includes('yearendpoll.php') && !finalUrl.includes('page=');
}

test.describe('Year End Poll', () => {
  test.describe('Page Accessibility', () => {
    test('yearendpoll.php is accessible and returns valid response', async ({ page }) => {
      const { status } = await navigateWithRetry(page, `${LEGACY_BASE_URL}/yearendpoll.php`);

      expect(status).toBe(200);

      const pageContent = await page.content();
      const errors = checkForPhpErrors(pageContent);
      expect(errors).toHaveLength(0);
    });

    test('staff picks page loads correctly', async ({ page }) => {
      const { status } = await navigateWithRetry(page, `${LEGACY_BASE_URL}/yearendstaffpicks.php`);

      expect(status).toBe(200);

      const pageContent = await page.content();
      const errors = checkForPhpErrors(pageContent);
      expect(errors).toHaveLength(0);

      await expect(page.getByRole('heading', { name: /Y-Not Staff Favorites/i })).toBeVisible();
    });
  });

  test.describe('Poll Active State', () => {
    test.beforeEach(async ({ page }) => {
      const active = await isPollActive(page);
      test.skip(
        !active,
        'Poll is currently closed/redirecting — set FORCE_YEAR_END_POLL_OPEN=true to test',
      );
    });

    test('poll dashboard displays all 12 categories', async ({ page }, testInfo) => {
      await navigateWithRetry(page, `${LEGACY_BASE_URL}/yearendpoll.php`);

      await captureScreenshot(page, testInfo, 'poll-dashboard');

      await expect(page.getByRole('link', { name: 'songs' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'albums' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'artists' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'concerts' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'new artists' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'philly artists' })).toBeVisible();
      await expect(page.getByRole('link', { name: /most anticipated/i })).toBeVisible();
      await expect(page.getByRole('link', { name: 'tv dramas' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'tv comedies' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'best movies' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'worst movies' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'unnecessary sequels' })).toBeVisible();
    });

    test('albums voting form is visible when category selected', async ({ page }, testInfo) => {
      await navigateWithRetry(page, `${LEGACY_BASE_URL}/yearendpoll.php?poll=albums`);

      await captureScreenshot(page, testInfo, 'poll-albums-form');

      const form = page.locator('form[name*="year_end"]');
      await expect(form).toBeVisible({ timeout: 10000 });
    });

    test('albums voting form has checkbox options', async ({ page }) => {
      await navigateWithRetry(page, `${LEGACY_BASE_URL}/yearendpoll.php?poll=albums`);

      const checkboxes = page.locator('input[type="checkbox"][name="year_end_votes[]"]');
      const checkboxCount = await checkboxes.count();
      expect(checkboxCount).toBeGreaterThan(0);
    });

    test('albums voting form shows seeded artist and album names', async ({ page }) => {
      await navigateWithRetry(page, `${LEGACY_BASE_URL}/yearendpoll.php?poll=albums`);

      // These are seeded in bin/seed-legacy.sh
      await expect(page.getByText('Franz Ferdinand')).toBeVisible();
      await expect(page.getByText('The Human Fear')).toBeVisible();
      await expect(page.getByText('Wet Leg')).toBeVisible();
    });

    test('submit button is initially disabled', async ({ page }) => {
      await navigateWithRetry(page, `${LEGACY_BASE_URL}/yearendpoll.php?poll=albums`);

      const submitButton = page.locator('#vote');
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeDisabled();
    });

    test('submit button shows remaining pick count', async ({ page }) => {
      await navigateWithRetry(page, `${LEGACY_BASE_URL}/yearendpoll.php?poll=concerts`);

      const submitButton = page.locator('#vote');
      await expect(submitButton).toHaveText(/Pick 2 more!/i);
    });

    test('submit button decrements count after selecting a checkbox', async ({ page }) => {
      await navigateWithRetry(page, `${LEGACY_BASE_URL}/yearendpoll.php?poll=concerts`);

      const checkboxes = page.locator('input[type="checkbox"][name="year_end_votes[]"]');
      await checkboxes.first().check();

      const submitButton = page.locator('#vote');
      await expect(submitButton).toHaveText(/Pick 1 more!/i);
    });

    test('checkbox selection respects max picks limit', async ({ page }, testInfo) => {
      // artists category has max 5 picks
      await navigateWithRetry(page, `${LEGACY_BASE_URL}/yearendpoll.php?poll=artists`);

      const checkboxes = page.locator('input[type="checkbox"][name="year_end_votes[]"]');
      const checkboxCount = await checkboxes.count();
      expect(checkboxCount).toBeGreaterThan(0);

      for (let i = 0; i < Math.min(5, checkboxCount); i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await checkboxes.nth(i).check();
      }

      await captureScreenshot(page, testInfo, 'poll-artists-max-selected');

      const submitButton = page.locator('#vote');
      await expect(submitButton).not.toBeDisabled({ timeout: 5000 });

      const checkedCount = await page
        .locator('input[type="checkbox"][name="year_end_votes[]"]:checked')
        .count();
      expect(checkedCount).toBe(5);
    });

    test('write-in field is disabled until checkbox is checked', async ({ page }) => {
      await navigateWithRetry(page, `${LEGACY_BASE_URL}/yearendpoll.php?poll=songs`);

      const writeInArea = page.locator('.control-group:has(.form-other)');
      const writeInCheckbox = writeInArea.locator('input[type="checkbox"]');
      const writeInField = writeInArea.locator('input[type="text"]');

      const hasWriteIn = (await writeInCheckbox.count()) > 0;
      test.skip(!hasWriteIn, 'This poll category does not have write-in option');

      await expect(writeInField).toBeDisabled();
      await writeInCheckbox.check();
      await expect(writeInField).toBeEnabled();
    });

    test('all 12 poll category links are present on dashboard', async ({ page }) => {
      await navigateWithRetry(page, `${LEGACY_BASE_URL}/yearendpoll.php`);

      const allPollLinks = page.locator('a.poll');
      await expect(allPollLinks).toHaveCount(12);
    });
  });

  test.describe('Poll Closed State', () => {
    test('closed poll redirects away from yearendpoll.php', async ({ page }, testInfo) => {
      const { finalUrl } = await navigateWithRetry(page, `${LEGACY_BASE_URL}/yearendpoll.php`);

      const isActive = finalUrl.includes('yearendpoll.php') && !finalUrl.includes('page=');
      test.skip(isActive, 'Poll is currently active — this test requires the poll to be closed');

      await captureScreenshot(page, testInfo, 'poll-closed-redirect');

      expect(finalUrl).toMatch(/pages\.php|top\d+/i);

      const pageContent = await page.content();
      const errors = checkForPhpErrors(pageContent);
      expect(errors).toHaveLength(0);
    });
  });

  test.describe('Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      const active = await isPollActive(page);
      test.skip(!active, 'Poll is closed — error handling tests require active poll');
    });

    test('invalid poll parameter is handled gracefully', async ({ page }) => {
      const { status } = await navigateWithRetry(
        page,
        `${LEGACY_BASE_URL}/yearendpoll.php?poll=invalid_poll_name`,
      );

      expect(status).toBe(200);

      const pageContent = await page.content();
      const errors = checkForPhpErrors(pageContent);
      expect(errors).toHaveLength(0);
    });

    test('empty poll param loads dashboard', async ({ page }) => {
      const { status } = await navigateWithRetry(page, `${LEGACY_BASE_URL}/yearendpoll.php?poll=`);

      expect(status).toBe(200);

      const pageContent = await page.content();
      const errors = checkForPhpErrors(pageContent);
      expect(errors).toHaveLength(0);
    });
  });
});
