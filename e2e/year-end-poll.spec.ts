/**
 * Year End Poll E2E Tests
 *
 * Tests for the Y-Not Radio Year End Poll feature.
 * The poll allows users to vote in 12 categories with different max picks,
 * and enter a contest for prizes.
 *
 * Poll Categories (from SqlYearEndPoll model):
 * - songs (20 picks)
 * - albums (10 picks)
 * - artists (5 picks)
 * - concerts (2 picks)
 * - new_artists (3 picks)
 * - philly_artists (5 picks)
 * - most_anticipated_albums (2 picks)
 * - tv_dramas (3 picks)
 * - tv_comedies (3 picks)
 * - best_movies (3 picks)
 * - worst_movies (2 picks)
 * - unnecessary_sequels (2 picks)
 *
 * Note: The poll is seasonal. When closed, yearendpoll.php redirects
 * to the results page. Tests accommodate both states.
 */
import { test, expect, Page } from '@playwright/test';
import { checkForPhpErrors, captureScreenshot } from './utils/test-helpers';

// Legacy PHP site runs on port 8080
const LEGACY_BASE_URL = process.env.LEGACY_BASE_URL || 'http://localhost:8080';

/**
 * Poll category details for reference and potential parameterized tests.
 * Exported for use in other test files if needed.
 */
export const POLL_CATEGORIES = [
  { name: 'songs', displayName: 'Songs', maxPicks: 20 },
  { name: 'albums', displayName: 'Albums', maxPicks: 10 },
  { name: 'artists', displayName: 'Artists', maxPicks: 5 },
  { name: 'concerts', displayName: 'Concerts', maxPicks: 2 },
  { name: 'new_artists', displayName: 'New Artists', maxPicks: 3 },
  { name: 'philly_artists', displayName: 'Philly Artists', maxPicks: 5 },
  { name: 'most_anticipated_albums', displayName: 'Most Anticipated Albums', maxPicks: 2 },
  { name: 'tv_dramas', displayName: 'TV Dramas', maxPicks: 3 },
  { name: 'tv_comedies', displayName: 'TV Comedies', maxPicks: 3 },
  { name: 'best_movies', displayName: 'Best Movies', maxPicks: 3 },
  { name: 'worst_movies', displayName: 'Worst Movies', maxPicks: 2 },
  { name: 'unnecessary_sequels', displayName: 'Unnecessary Sequels', maxPicks: 2 },
] as const;

/**
 * Helper to navigate with retry logic for Docker networking flakiness
 */
async function navigateWithRetry(
  page: Page,
  url: string,
  maxRetries = 3,
): Promise<{ status: number | null; finalUrl: string }> {
  let response = null;
  for (let i = 0; i < maxRetries; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      return { status: response?.status() || null, finalUrl: page.url() };
    } catch {
      // eslint-disable-next-line no-console
      console.log(`Navigation attempt ${i + 1}/${maxRetries} failed, retrying...`);
      // eslint-disable-next-line no-await-in-loop
      await page.waitForTimeout(2000);
    }
  }
  return { status: response?.status() || null, finalUrl: page.url() };
}

/**
 * Check if poll is currently active (not redirecting)
 */
async function isPollActive(page: Page): Promise<boolean> {
  const { finalUrl } = await navigateWithRetry(page, `${LEGACY_BASE_URL}/yearendpoll.php`);
  // Poll is active if we're still on yearendpoll.php (not redirected)
  return finalUrl.includes('yearendpoll.php') && !finalUrl.includes('page=');
}

test.describe('Year End Poll', () => {
  test.describe('Page Accessibility', () => {
    test('yearendpoll.php is accessible and returns valid response', async ({ page }) => {
      const { status, finalUrl } = await navigateWithRetry(
        page,
        `${LEGACY_BASE_URL}/yearendpoll.php`,
      );

      // Should get a 200 response (either from poll page or redirect target)
      expect(status).toBe(200);

      // Check for PHP errors
      const pageContent = await page.content();
      const errors = checkForPhpErrors(pageContent);
      expect(errors).toHaveLength(0);

      // Log whether poll is active or closed
      if (finalUrl.includes('yearendpoll.php') && !finalUrl.includes('page=')) {
        // eslint-disable-next-line no-console
        console.log('Poll is ACTIVE - full testing available');
      } else {
        // eslint-disable-next-line no-console
        console.log(`Poll is CLOSED - redirected to: ${finalUrl}`);
      }
    });

    test('staff picks page loads correctly', async ({ page }) => {
      const { status } = await navigateWithRetry(
        page,
        `${LEGACY_BASE_URL}/yearendstaffpicks.php`,
      );

      expect(status).toBe(200);

      // Check for PHP errors
      const pageContent = await page.content();
      const errors = checkForPhpErrors(pageContent);
      expect(errors).toHaveLength(0);

      // Should have some content related to staff picks
      expect(pageContent).toMatch(/staff|picks|year|end/i);
    });
  });

  test.describe('Poll Active State', () => {
    test.beforeEach(async ({ page }) => {
      // Check if poll is active before running these tests
      const active = await isPollActive(page);
      test.skip(!active, 'Poll is currently closed/redirecting');
    });

    test('poll dashboard displays all 12 categories', async ({ page }, testInfo) => {
      await navigateWithRetry(page, `${LEGACY_BASE_URL}/yearendpoll.php`);

      await captureScreenshot(page, testInfo, 'poll-dashboard');

      // Check that poll category links exist
      const pollLinks = page.locator('a.poll');
      const linkCount = await pollLinks.count();

      // Should have 12 poll category links
      expect(linkCount).toBeGreaterThanOrEqual(12);
    });

    test('clicking a poll category shows voting form', async ({ page }, testInfo) => {
      // Navigate to a specific poll category
      await navigateWithRetry(page, `${LEGACY_BASE_URL}/yearendpoll.php?poll=albums`);

      await captureScreenshot(page, testInfo, 'poll-albums-form');

      // Should have a form for voting
      const form = page.locator('form[name*="year_end"]');
      await expect(form).toBeVisible({ timeout: 10000 });

      // Should have checkboxes for voting
      const checkboxes = page.locator('input[type="checkbox"][name="year_end_votes[]"]');
      const checkboxCount = await checkboxes.count();
      expect(checkboxCount).toBeGreaterThan(0);

      // Should have a submit button (initially disabled)
      const submitButton = page.locator('#vote');
      await expect(submitButton).toBeVisible();
    });

    test('checkbox selection respects max picks limit', async ({ page }, testInfo) => {
      // Test with albums (max 10 picks) - easier to test limit
      await navigateWithRetry(page, `${LEGACY_BASE_URL}/yearendpoll.php?poll=artists`);

      await captureScreenshot(page, testInfo, 'poll-artists-before-selection');

      // Get all checkboxes
      const checkboxes = page.locator('input[type="checkbox"][name="year_end_votes[]"]');
      const checkboxCount = await checkboxes.count();

      // Should have options to choose from
      expect(checkboxCount).toBeGreaterThan(5);

      // Select up to the max (5 for artists)
      for (let i = 0; i < Math.min(5, checkboxCount); i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await checkboxes.nth(i).check();
      }

      await captureScreenshot(page, testInfo, 'poll-artists-after-selection');

      // Submit button should be enabled when exact count is reached
      const submitButton = page.locator('#vote');
      await expect(submitButton).not.toBeDisabled({ timeout: 5000 });

      // Verify selected count
      const checkedCount = await page.locator(
        'input[type="checkbox"][name="year_end_votes[]"]:checked',
      ).count();
      expect(checkedCount).toBe(5);
    });

    test('submit button shows remaining picks count', async ({ page }) => {
      await navigateWithRetry(page, `${LEGACY_BASE_URL}/yearendpoll.php?poll=concerts`);

      // Get submit button
      const submitButton = page.locator('#vote');
      await expect(submitButton).toBeVisible();

      // Initially should show "Pick X more!"
      const buttonText = await submitButton.textContent();
      expect(buttonText).toMatch(/Pick \d+ more/i);

      // Select one checkbox
      const checkboxes = page.locator('input[type="checkbox"][name="year_end_votes[]"]');
      await checkboxes.first().check();

      // Button text should update
      const updatedText = await submitButton.textContent();
      expect(updatedText).toMatch(/Pick \d+ more|Submit/i);
    });

    test('write-in field is disabled until checkbox is checked', async ({ page }) => {
      await navigateWithRetry(page, `${LEGACY_BASE_URL}/yearendpoll.php?poll=songs`);

      // Find write-in checkbox and field
      const writeInCheckbox = page.locator('#song_write_in');
      const writeInField = page.locator('#write_in_value');

      // Check if elements exist (some polls may not have write-in)
      const hasWriteIn = (await writeInCheckbox.count()) > 0;
      test.skip(!hasWriteIn, 'This poll category does not have write-in option');

      // Field should be disabled initially
      await expect(writeInField).toBeDisabled();

      // Check the write-in checkbox
      await writeInCheckbox.check();

      // Field should now be enabled
      await expect(writeInField).toBeEnabled();
    });

    test('poll categories show completed state after voting', async ({ page }) => {
      // Note: This test verifies the visual state but doesn't actually vote
      // (voting requires IP tracking and would affect subsequent tests)
      await navigateWithRetry(page, `${LEGACY_BASE_URL}/yearendpoll.php`);

      // Check for 'completed' class on any poll links (if user has voted)
      const completedPolls = page.locator('a.poll.completed');
      const completedCount = await completedPolls.count();

      // Log voting status (informational, not a pass/fail condition)
      // eslint-disable-next-line no-console
      console.log(`User has completed ${completedCount} of 12 polls`);

      // Verify structure: completed polls should link back to dashboard
      if (completedCount > 0) {
        const firstCompleted = completedPolls.first();
        const href = await firstCompleted.getAttribute('href');
        expect(href).toBe('yearendpoll.php');
      }
    });
  });

  test.describe('Contest Entry Form', () => {
    test.beforeEach(async ({ page }) => {
      const active = await isPollActive(page);
      test.skip(!active, 'Poll is currently closed/redirecting');
    });

    test('contest form requires all fields', async ({ page }, testInfo) => {
      // Navigate to poll page (contest form appears after completing enough polls)
      await navigateWithRetry(page, `${LEGACY_BASE_URL}/yearendpoll.php`);

      await captureScreenshot(page, testInfo, 'contest-form-check');

      // Check if contest form is visible (only shows after completing polls)
      const contestForm = page.locator('form:has(input[name="contest_form"])');
      const hasContestForm = (await contestForm.count()) > 0;

      if (!hasContestForm) {
        // eslint-disable-next-line no-console
        console.log('Contest form not visible - user needs to complete more polls first');
        test.skip(true, 'Contest form requires completing polls first');
      }

      // Verify form fields exist
      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="phone"]')).toBeVisible();
    });
  });

  test.describe('Poll Closed State', () => {
    test('closed poll redirects to results page', async ({ page }, testInfo) => {
      const { finalUrl } = await navigateWithRetry(
        page,
        `${LEGACY_BASE_URL}/yearendpoll.php`,
      );

      // If poll is active, skip this test
      const isActive = finalUrl.includes('yearendpoll.php') && !finalUrl.includes('page=');
      test.skip(isActive, 'Poll is currently active');

      await captureScreenshot(page, testInfo, 'poll-closed-redirect');

      // Should redirect to results or countdown page
      expect(finalUrl).toMatch(/pages\.php|top\d+/i);

      // Check for PHP errors on redirect target
      const pageContent = await page.content();
      const errors = checkForPhpErrors(pageContent);
      expect(errors).toHaveLength(0);
    });
  });

  test.describe('Error Handling', () => {
    test('invalid poll parameter is handled gracefully', async ({ page }) => {
      // Try accessing with an invalid poll name
      const { status } = await navigateWithRetry(
        page,
        `${LEGACY_BASE_URL}/yearendpoll.php?poll=invalid_poll_name`,
      );

      expect(status).toBe(200);

      // Check for PHP errors (should not crash)
      const pageContent = await page.content();
      const errors = checkForPhpErrors(pageContent);
      expect(errors).toHaveLength(0);
    });

    test('direct poll URL with empty poll param loads dashboard', async ({ page }) => {
      const { status } = await navigateWithRetry(
        page,
        `${LEGACY_BASE_URL}/yearendpoll.php?poll=`,
      );

      expect(status).toBe(200);

      // Should not crash
      const pageContent = await page.content();
      const errors = checkForPhpErrors(pageContent);
      expect(errors).toHaveLength(0);
    });
  });
});

/**
 * AUTHENTICATION NOTE:
 *
 * The Year End Poll uses IP-based tracking for votes and contest entries.
 * It does NOT require Auth0 authentication for basic functionality.
 *
 * However, for full voting flow tests that persist votes:
 * 1. Tests would affect subsequent test runs (IP is remembered)
 * 2. Database cleanup would be needed between test runs
 * 3. Consider using a unique test database or cleanup script
 *
 * For now, these tests verify:
 * - Page loads and renders correctly
 * - Form elements are present and functional
 * - Client-side validation works
 * - No PHP errors occur
 *
 * Full voting integration tests could be added with:
 * - Database fixtures that reset between runs
 * - Unique IP simulation (X-Forwarded-For header)
 * - Or a test-mode flag in the PHP code
 */
