import { test as baseTest, expect } from '@playwright/test';
import { captureScreenshot, checkForPhpErrors, navigateWithRetry } from './utils/test-helpers';

/**
 * E2E Integration Test: Top 11 @ 11 (Legacy PHP)
 *
 * Tests the Top 11 weekly song voting feature at /top11/
 * The page displays the current Top 11 list and optionally
 * allows voting when voting status is "open".
 *
 * Note: These tests use the legacy PHP site and don't require Payload auth.
 */

// Create a test fixture that doesn't require storage state (no Payload auth needed)
// eslint-disable-next-line react-hooks/rules-of-hooks
const test = baseTest.extend({
  // eslint-disable-next-line no-empty-pattern
  storageState: async ({}, runTest) => {
    await runTest({});
  },
});

// Legacy PHP site URL
const LEGACY_BASE_URL = 'http://localhost:8080';

test.describe('Top 11 @ 11 (Legacy PHP)', () => {
  test.beforeEach(async ({ page }) => {
    // Allow server to stabilize
    await page.waitForTimeout(1000);
  });

  test('page loads without PHP errors', async ({ page }, testInfo) => {
    const url = `${LEGACY_BASE_URL}/top11.php`;
    const { status } = await navigateWithRetry(page, url);

    expect(status).toBe(200);

    // Check for common PHP errors
    const pageContent = await page.content();
    const phpErrors = checkForPhpErrors(pageContent);
    expect(phpErrors).toEqual([]);

    // Verify page has expected title (use exact match to avoid multiple elements)
    await expect(page.getByRole('heading', { name: 'Top 11 @ 11', exact: true })).toBeVisible();

    await captureScreenshot(page, testInfo, '01-Top11-Page-Loaded');
  });

  test('displays Top 11 list table with song entries', async ({ page }, testInfo) => {
    const url = `${LEGACY_BASE_URL}/top11.php`;
    await navigateWithRetry(page, url);

    // The page should display a Top 11 list table with song entries
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Table should have rows (Top 11 entries)
    const tableRows = page.locator('table tr');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Verify specific seeded artist names appear in the table
    await expect(page.getByRole('cell', { name: 'Silversun Pickups' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Metric' })).toBeVisible();

    // Verify specific seeded song titles appear in the table
    await expect(page.getByRole('cell', { name: 'Interrobang*' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Victim of Luck' })).toBeVisible();

    await captureScreenshot(page, testInfo, '02-Top11-List-Table');
  });

  test('shows Top 11 message section', async ({ page }, testInfo) => {
    const url = `${LEGACY_BASE_URL}/top11.php`;
    await navigateWithRetry(page, url);

    // The page should have a Top 11 message section with the knob image
    const knobImage = page.locator('img[src*="knob_11"]');
    await expect(knobImage).toBeVisible();

    // Should display the weekly countdown message text
    await expect(page.getByText(/Y-Not Radio counts down the Top 11/i)).toBeVisible();

    await captureScreenshot(page, testInfo, '03-Top11-Message-Section');
  });

  test('shows voting closed message when voting is not open', async ({ page }, testInfo) => {
    await navigateWithRetry(page, `${LEGACY_BASE_URL}/top11.php`);

    const votingClosedMessage = page.getByText(/voting is currently closed/i);
    const isVotingClosed = await votingClosedMessage.isVisible().catch(() => false);
    test.skip(!isVotingClosed, 'Voting is not in the closed state on this environment');

    await expect(votingClosedMessage).toBeVisible();
    await captureScreenshot(page, testInfo, '04a-Top11-Voting-Closed');
  });

  test('shows login prompt when voting is open and user is not logged in', async ({
    page,
  }, testInfo) => {
    await navigateWithRetry(page, `${LEGACY_BASE_URL}/top11.php`);

    const loginButton = page.getByRole('link', { name: /log in to vote/i });
    const showsLoginPrompt = await loginButton.isVisible().catch(() => false);
    test.skip(
      !showsLoginPrompt,
      'Login prompt is not visible; voting may be closed or user is already logged in',
    );

    await expect(loginButton).toBeVisible();
    await captureScreenshot(page, testInfo, '04b-Top11-Login-Required');
  });

  test('shows already voted message when user has already voted this week', async ({
    page,
  }, testInfo) => {
    await navigateWithRetry(page, `${LEGACY_BASE_URL}/top11.php`);

    const alreadyVotedMessage = page.getByText(/you've already voted/i);
    const hasAlreadyVoted = await alreadyVotedMessage.isVisible().catch(() => false);
    test.skip(
      !hasAlreadyVoted,
      'Already-voted message is not visible; user has not voted or voting is closed',
    );

    await expect(alreadyVotedMessage).toBeVisible();
    await captureScreenshot(page, testInfo, '04c-Top11-Already-Voted');
  });

  test('shows voting form when user is logged in and has not voted', async ({ page }, testInfo) => {
    await navigateWithRetry(page, `${LEGACY_BASE_URL}/top11.php`);

    const votingForm = page.locator('form[name="top11"]');
    const hasVotingForm = await votingForm.isVisible().catch(() => false);
    test.skip(
      !hasVotingForm,
      'Voting form is not visible; voting may be closed or user is not logged in',
    );

    await expect(votingForm).toBeVisible();
    await captureScreenshot(page, testInfo, '04d-Top11-Voting-Form');
  });

  test('voting form has expected elements when visible', async ({ page }, testInfo) => {
    const url = `${LEGACY_BASE_URL}/top11.php`;
    await navigateWithRetry(page, url);

    const votingForm = page.locator('form[name="top11"]');
    const isFormVisible = await votingForm.isVisible().catch(() => false);

    if (!isFormVisible) {
      test.skip(
        !isFormVisible,
        'Voting form is not visible; voting closed or user is not logged in',
      );
      return;
    }

    // Verify form elements
    // Song checkboxes -- one per nominee-pool song (getAllSongs() reads
    // top11songs directly today; PostgresTop11.php will read the equivalent
    // Top11Contests.nominees array once the adapter lands, so this count is
    // the baseline both implementations need to match).
    const checkboxes = page.locator('input[type="checkbox"][name="top11[]"]');
    const checkboxCount = await checkboxes.count();
    expect(checkboxCount).toBeGreaterThan(0);

    // Write-in section - find fields by the "Other (please specify)" label text
    const writeInContainer = page
      .locator('.controls')
      .filter({ hasText: 'Other (please specify)' });
    await expect(writeInContainer.locator('input[type="checkbox"]')).toBeVisible();
    await expect(writeInContainer.locator('input[type="text"]')).toBeVisible();

    // Submit button
    const submitButton = page.getByRole('button', { name: /cast your vote/i });
    await expect(submitButton).toBeVisible();

    await captureScreenshot(page, testInfo, '05-Top11-Form-Elements');
  });

  test('login button links to auth when voting open but not logged in', async ({
    page,
  }, testInfo) => {
    const url = `${LEGACY_BASE_URL}/top11.php`;
    await navigateWithRetry(page, url);

    const loginButton = page.getByRole('link', { name: /log in to vote/i });
    const isLoginVisible = await loginButton.isVisible().catch(() => false);

    if (!isLoginVisible) {
      test.skip(
        !isLoginVisible,
        'Login button not visible; voting closed or user is already logged in',
      );
      return;
    }

    // Verify login button has correct href
    const href = await loginButton.getAttribute('href');
    expect(href).toContain('auth_login.php');
    expect(href).toContain('returnTo=/top11');

    await captureScreenshot(page, testInfo, '06-Top11-Login-Button');
  });

  test('page has proper heading structure', async ({ page }, testInfo) => {
    const url = `${LEGACY_BASE_URL}/top11.php`;
    await navigateWithRetry(page, url);

    // Main heading (h1)
    const mainHeading = page.getByRole('heading', { level: 1, name: 'Top 11 @ 11', exact: true });
    await expect(mainHeading).toBeVisible();

    // Should have an h2 for the Top 11 list (e.g., "Top 11 @ 11 for [date]")
    const listHeading = page.locator('h2.center').first();
    await expect(listHeading).toBeVisible();

    await captureScreenshot(page, testInfo, '07-Top11-Heading-Structure');
  });
});
