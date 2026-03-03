import { test as baseTest, expect, Page } from '@playwright/test';
import { captureScreenshot, checkForPhpErrors } from './utils/test-helpers';

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

// Helper to navigate with retry logic for Docker networking
async function navigateWithRetry(page: Page, url: string, maxRetries = 5): Promise<number | null> {
  let response = null;
  for (let i = 0; i < maxRetries; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      if (response?.status() === 200) return response.status();
    } catch {
      // eslint-disable-next-line no-console
      console.log(`Navigation attempt ${i + 1}/${maxRetries} failed, retrying...`);
      // eslint-disable-next-line no-await-in-loop
      await page.waitForTimeout(5000);
    }
  }
  return response?.status() || null;
}

test.describe('Top 11 @ 11 (Legacy PHP)', () => {
  test.beforeEach(async ({ page }) => {
    // Allow server to stabilize
    await page.waitForTimeout(1000);
  });

  test('page loads without PHP errors', async ({ page }, testInfo) => {
    const url = `${LEGACY_BASE_URL}/top11.php`;
    const status = await navigateWithRetry(page, url);

    expect(status).toBe(200);

    // Check for common PHP errors
    const pageContent = await page.content();
    const phpErrors = checkForPhpErrors(pageContent);
    expect(phpErrors).toEqual([]);

    // Verify page has expected title (use exact match to avoid multiple elements)
    await expect(page.getByRole('heading', { name: 'Top 11 @ 11', exact: true })).toBeVisible();

    await captureScreenshot(page, testInfo, '01-Top11-Page-Loaded');
  });

  test('displays Top 11 list table', async ({ page }, testInfo) => {
    const url = `${LEGACY_BASE_URL}/top11.php`;
    await navigateWithRetry(page, url);

    // The page should display a Top 11 list table with song entries
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Table should have rows (Top 11 entries)
    const tableRows = page.locator('table tr');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(0);

    await captureScreenshot(page, testInfo, '02-Top11-List-Table');
  });

  test('shows Top 11 message section', async ({ page }, testInfo) => {
    const url = `${LEGACY_BASE_URL}/top11.php`;
    await navigateWithRetry(page, url);

    // The page should have a Top 11 message section with the knob image
    const knobImage = page.locator('img[src*="knob_11"]');
    await expect(knobImage).toBeVisible();

    // Should have the top11-message div
    const messageSection = page.locator('.top11-message');
    await expect(messageSection).toBeVisible();

    await captureScreenshot(page, testInfo, '03-Top11-Message-Section');
  });

  test('handles voting closed state gracefully', async ({ page }, testInfo) => {
    const url = `${LEGACY_BASE_URL}/top11.php`;
    await navigateWithRetry(page, url);

    // Check for either voting form or voting closed message
    const votingClosedMessage = page.getByText(/voting is currently closed/i);
    const loginButton = page.getByRole('link', { name: /log in to vote/i });
    const alreadyVotedMessage = page.getByText(/you've already voted/i);
    const votingForm = page.locator('form[name="top11"]');

    // One of these states should be true
    const isVotingClosed = await votingClosedMessage.isVisible().catch(() => false);
    const showsLoginPrompt = await loginButton.isVisible().catch(() => false);
    const hasAlreadyVoted = await alreadyVotedMessage.isVisible().catch(() => false);
    const hasVotingForm = await votingForm.isVisible().catch(() => false);

    // Page should show one of these states
    const hasValidState = isVotingClosed || showsLoginPrompt || hasAlreadyVoted || hasVotingForm;
    expect(hasValidState).toBe(true);

    if (isVotingClosed) {
      // Voting closed - verify the message
      await expect(votingClosedMessage).toBeVisible();
      await captureScreenshot(page, testInfo, '04-Top11-Voting-Closed');
    } else if (showsLoginPrompt) {
      // Voting open but not logged in
      await expect(loginButton).toBeVisible();
      await captureScreenshot(page, testInfo, '04-Top11-Login-Required');
    } else if (hasAlreadyVoted) {
      // Logged in but already voted
      await expect(alreadyVotedMessage).toBeVisible();
      await captureScreenshot(page, testInfo, '04-Top11-Already-Voted');
    } else {
      // Voting form visible
      await expect(votingForm).toBeVisible();
      await captureScreenshot(page, testInfo, '04-Top11-Voting-Form');
    }
  });

  test('voting form has expected elements when visible', async ({ page }, testInfo) => {
    const url = `${LEGACY_BASE_URL}/top11.php`;
    await navigateWithRetry(page, url);

    const votingForm = page.locator('form[name="top11"]');
    const isFormVisible = await votingForm.isVisible().catch(() => false);

    if (!isFormVisible) {
      // Skip if voting form is not visible (voting closed or not logged in)
      test.skip();
      return;
    }

    // Verify form elements
    // Song checkboxes
    const checkboxes = page.locator('input[type="checkbox"][name="top11[]"]');
    const checkboxCount = await checkboxes.count();
    expect(checkboxCount).toBeGreaterThan(0);

    // Write-in checkbox
    const writeInCheckbox = page.locator('#top11_write_in');
    await expect(writeInCheckbox).toBeVisible();

    // Write-in text field
    const writeInField = page.locator('#write_in_value');
    await expect(writeInField).toBeVisible();

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
      // Skip if login button not visible (voting closed or already logged in)
      test.skip();
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
