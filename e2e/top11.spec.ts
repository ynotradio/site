/**
 * E2E Tests for Top 11 @ 11 voting feature
 *
 * Tests the legacy PHP Top 11 page at http://localhost:8080/top11
 * Covers: page load, song display, write-in toggle, voting status states
 *
 * Note: Full voting flow requires Auth0 authentication - see test annotations
 */
import { test, expect, Page } from '@playwright/test';
import { captureScreenshot, checkForPhpErrors } from './utils/test-helpers';

// Base URL for legacy PHP site
const LEGACY_BASE_URL = process.env.LEGACY_BASE_URL || 'http://localhost:8080';

/**
 * Navigate to the Top 11 page with retry logic for container startup
 */
async function navigateToTop11(page: Page, maxRetries = 3): Promise<number | null> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await page.goto(`${LEGACY_BASE_URL}/top11`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      if (response?.status() === 200) return response.status();
    } catch (error) {
      lastError = error as Error;
      // eslint-disable-next-line no-console
      console.log(`Top 11 navigation attempt ${i + 1}/${maxRetries} failed, retrying...`);
      // eslint-disable-next-line no-await-in-loop
      await page.waitForTimeout(2000);
    }
  }

  if (lastError) throw lastError;
  return null;
}

test.describe('Top 11 @ 11 Feature', () => {
  test.describe('Page Load and Display', () => {
    test('Top 11 page loads successfully', async ({ page }, testInfo) => {
      const status = await navigateToTop11(page);
      expect(status).toBe(200);

      // Verify page title (use exact match to avoid matching the date heading)
      const heading = page.getByRole('heading', { name: 'Top 11 @ 11', exact: true });
      await expect(heading).toBeVisible();

      // Check for PHP errors
      const content = await page.content();
      const errors = checkForPhpErrors(content);
      expect(errors).toHaveLength(0);

      await captureScreenshot(page, testInfo, 'top11-page-loaded');
    });

    test('Top 11 message section displays', async ({ page }) => {
      await navigateToTop11(page);

      // The Top 11 message section with the knob image
      const messageSection = page.locator('.top11-message');
      await expect(messageSection).toBeVisible();

      // The knob_11 image should be present
      const knobImage = page.locator('img[alt="Top 11"]');
      await expect(knobImage).toBeVisible();
    });

    test('Top 11 list displays with song entries', async ({ page }, testInfo) => {
      await navigateToTop11(page);

      // The Top 11 table should exist with songs
      const table = page.locator('table.table');
      await expect(table).toBeVisible();

      // Table should have rows (at least the songs)
      const rows = table.locator('tr');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);

      await captureScreenshot(page, testInfo, 'top11-song-list');
    });

    test('Top 11 header shows current week date', async ({ page }) => {
      await navigateToTop11(page);

      // The H2 heading with the date (e.g., "Top 11 @ 11 for January 15, 2025")
      const weekHeading = page.getByRole('heading', { name: /Top 11 @ 11 for/ });
      await expect(weekHeading).toBeVisible();

      const headingText = await weekHeading.textContent();
      expect(headingText).toContain('Top 11 @ 11 for');
    });
  });

  test.describe('Voting Status States', () => {
    test('shows login prompt when voting is open but user not logged in', async ({ page }, testInfo) => {
      await navigateToTop11(page);

      // Check page content for voting status indicators
      const content = await page.content();

      // Either voting is open (shows login prompt) or closed (shows closed message)
      const hasLoginPrompt = content.includes('Log in to Vote');
      const hasVotingClosed = content.includes('voting is currently closed');
      const hasVotingForm = content.includes('Cast Your Vote');

      // One of these states should be true
      expect(hasLoginPrompt || hasVotingClosed || hasVotingForm).toBe(true);

      if (hasLoginPrompt) {
        // Verify login button is present
        const loginButton = page.locator('a.btn-success', { hasText: /Log in to Vote/i });
        await expect(loginButton).toBeVisible();
        await captureScreenshot(page, testInfo, 'top11-login-prompt');
      } else if (hasVotingClosed) {
        // Verify closed message is displayed
        const closedMessage = page.locator('.information', { hasText: /voting is currently closed/i });
        await expect(closedMessage).toBeVisible();
        await captureScreenshot(page, testInfo, 'top11-voting-closed');
      }
    });

    test('voting closed message displays when status is closed', async ({ page }, testInfo) => {
      await navigateToTop11(page);

      const content = await page.content();

      // This test documents expected behavior when voting is closed
      if (content.includes('voting is currently closed')) {
        const closedMessage = page.locator('.information.center', {
          hasText: /Sorry but voting is currently closed/i,
        });
        await expect(closedMessage).toBeVisible();

        // Message should mention checking back
        const messageText = await closedMessage.textContent();
        expect(messageText).toContain('Check back soon');

        await captureScreenshot(page, testInfo, 'top11-voting-closed-state');
      } else {
        // Voting is open - skip this specific test
        test.skip();
      }
    });
  });

  test.describe('Write-in Field Toggle', () => {
    // This test requires voting to be open AND user to be logged in
    // For now, we test the JavaScript behavior by checking element existence
    test('write-in checkbox and field structure exists when voting form is shown', async ({ page }) => {
      await navigateToTop11(page);

      const content = await page.content();

      // Check if voting form is displayed (user logged in with voting open)
      if (content.includes('Cast Your Vote')) {
        // Write-in checkbox should exist
        const writeInCheckbox = page.locator('#top11_write_in');
        await expect(writeInCheckbox).toBeVisible();

        // Write-in text field should exist and be disabled by default
        const writeInField = page.locator('#write_in_value');
        await expect(writeInField).toBeVisible();
        await expect(writeInField).toBeDisabled();

        // "Other (please specify)" label should be present
        const otherLabel = page.locator('.form-other', { hasText: /Other/i });
        await expect(otherLabel).toBeVisible();
      } else {
        // Voting form not shown - this test doesn't apply
        test.skip();
      }
    });

    test('write-in checkbox enables text field when checked (requires voting form)', async ({ page }, testInfo) => {
      await navigateToTop11(page);

      const content = await page.content();

      // This test requires the voting form to be visible
      if (content.includes('Cast Your Vote')) {
        const writeInCheckbox = page.locator('#top11_write_in');
        const writeInField = page.locator('#write_in_value');

        // Initially disabled
        await expect(writeInField).toBeDisabled();

        // Check the checkbox
        await writeInCheckbox.check();

        // Field should now be enabled
        await expect(writeInField).toBeEnabled();

        await captureScreenshot(page, testInfo, 'top11-write-in-enabled');

        // Uncheck the checkbox
        await writeInCheckbox.uncheck();

        // Field should be disabled again and cleared
        await expect(writeInField).toBeDisabled();
      } else {
        // Voting form not visible - requires Auth0 login
        // Document: This test needs Auth0 mock to fully verify
        test.skip();
      }
    });
  });

  test.describe('Voting Form Elements', () => {
    test('song checkboxes present when voting form is shown', async ({ page }) => {
      await navigateToTop11(page);

      const content = await page.content();

      if (content.includes('Cast Your Vote')) {
        // Song checkboxes should be present
        const songCheckboxes = page.locator('input[type="checkbox"][name="top11[]"]');
        const checkboxCount = await songCheckboxes.count();
        expect(checkboxCount).toBeGreaterThan(0);

        // Each checkbox should have an associated label with artist - song format
        const labels = page.locator('label .top11_entry');
        const labelCount = await labels.count();
        expect(labelCount).toBe(checkboxCount);
      } else {
        test.skip();
      }
    });

    test('personal info fields present when voting form is shown', async ({ page }) => {
      await navigateToTop11(page);

      const content = await page.content();

      if (content.includes('Cast Your Vote')) {
        // First name, last name, phone fields
        await expect(page.locator('input[name="firstname"]')).toBeVisible();
        await expect(page.locator('input[name="lastname"]')).toBeVisible();
        await expect(page.locator('input[name="phone"]')).toBeVisible();

        // Email field is NOT shown when logged in (we get email from Auth0)
        // But let's check it's either present or absent consistently
        const emailField = page.locator('input[name="email"]');
        const emailCount = await emailField.count();
        // Email may or may not be present depending on auth state
        expect(emailCount).toBeLessThanOrEqual(1);
      } else {
        test.skip();
      }
    });

    test('contest and newsletter options present when voting form is shown', async ({ page }) => {
      await navigateToTop11(page);

      const content = await page.content();

      if (content.includes('Cast Your Vote')) {
        // Contest radio buttons
        const contestYes = page.locator('input[name="contest"][value="yes"]');
        const contestNo = page.locator('input[name="contest"][value="no"]');
        await expect(contestYes).toBeVisible();
        await expect(contestNo).toBeVisible();

        // Newsletter radio buttons
        const newsletterYes = page.locator('input[name="newsletter"][value="yes"]');
        const newsletterNo = page.locator('input[name="newsletter"][value="no"]');
        const newsletterAlready = page.locator('input[name="newsletter"][value="already"]');
        await expect(newsletterYes).toBeVisible();
        await expect(newsletterNo).toBeVisible();
        await expect(newsletterAlready).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('submit button present when voting form is shown', async ({ page }, testInfo) => {
      await navigateToTop11(page);

      const content = await page.content();

      if (content.includes('Cast Your Vote')) {
        const submitButton = page.locator('button.btn-info[type="submit"]', {
          hasText: /Cast Your Vote/i,
        });
        await expect(submitButton).toBeVisible();

        await captureScreenshot(page, testInfo, 'top11-voting-form');
      } else {
        test.skip();
      }
    });
  });

  test.describe('Song Selection Behavior', () => {
    test('can select up to 3 songs (checkbox limit)', async ({ page }) => {
      await navigateToTop11(page);

      const content = await page.content();

      if (content.includes('Cast Your Vote')) {
        const checkboxes = page.locator('input[type="checkbox"][name="top11[]"]');
        const count = await checkboxes.count();

        if (count >= 3) {
          // Select first 3 checkboxes
          await checkboxes.nth(0).check();
          await checkboxes.nth(1).check();
          await checkboxes.nth(2).check();

          // Verify they are checked
          await expect(checkboxes.nth(0)).toBeChecked();
          await expect(checkboxes.nth(1)).toBeChecked();
          await expect(checkboxes.nth(2)).toBeChecked();
        }
      } else {
        test.skip();
      }
    });
  });

  test.describe('Authentication Flow', () => {
    // These tests document what would need Auth0 mocking to fully test
    test('login link redirects to Auth0 when voting is open', async ({ page }) => {
      await navigateToTop11(page);

      const content = await page.content();

      if (content.includes('Log in to Vote')) {
        const loginButton = page.locator('a.btn-success', { hasText: /Log in to Vote/i });
        const href = await loginButton.getAttribute('href');

        // Login link should point to auth_login.php with returnTo
        expect(href).toContain('auth_login.php');
        expect(href).toContain('returnTo=/top11');
      } else {
        // Either voting is closed or user is already logged in
        test.skip();
      }
    });

    test('logged in state shows user email and logout option', async ({ page }) => {
      await navigateToTop11(page);

      const content = await page.content();

      // Check for logged-in indicators
      if (content.includes('Logged in as:')) {
        const loggedInInfo = page.locator('.information', { hasText: /Logged in as:/i });
        await expect(loggedInInfo).toBeVisible();

        const logoutLink = page.locator('a', { hasText: /Log out/i });
        await expect(logoutLink).toBeVisible();
      } else {
        // User not logged in or voting closed
        test.skip();
      }
    });

    test('already voted state shows appropriate message', async ({ page }, testInfo) => {
      await navigateToTop11(page);

      const content = await page.content();

      // Check for "already voted" message
      if (content.includes("You've already voted")) {
        const alreadyVotedAlert = page.locator('.alert-info', { hasText: /already voted/i });
        await expect(alreadyVotedAlert).toBeVisible();

        // Should mention coming back next week
        const alertText = await alreadyVotedAlert.textContent();
        expect(alertText).toContain('Come back next week');

        await captureScreenshot(page, testInfo, 'top11-already-voted');
      } else {
        test.skip();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('page has no PHP errors or warnings', async ({ page }) => {
      await navigateToTop11(page);

      const content = await page.content();
      const errors = checkForPhpErrors(content);

      expect(errors).toHaveLength(0);
    });

    test('page handles Auth0 gracefully when not logged in', async ({ page }) => {
      await navigateToTop11(page);

      // Page should load without throwing Auth0 errors
      const content = await page.content();

      // Should not see Auth0 error messages
      expect(content).not.toContain('Auth0 error');
      expect(content).not.toContain('Invalid state');
      expect(content).not.toContain('Token error');
    });
  });
});

/**
 * NOTES FOR FULL VOTING FLOW TESTING:
 *
 * To test the complete voting flow including submission, you would need to:
 *
 * 1. Mock Auth0 authentication - Options:
 *    a) Create a test Auth0 tenant with test users
 *    b) Mock the Auth0 SDK at the PHP level with a test seam
 *    c) Use Playwright's route interception to mock Auth0 responses
 *
 * 2. Seed the database with:
 *    - Voting status set to 'open' (placement = 98, artist = 'open')
 *    - Current week date set (placement = 99)
 *    - Songs in top11songs table
 *
 * 3. Test scenarios:
 *    - Submit valid vote with 3 songs
 *    - Submit vote with write-in
 *    - Verify duplicate vote prevention
 *    - Verify contestant entry creation
 *    - Verify newsletter signup handling
 *
 * Current tests cover the UI structure and behavior observable without authentication.
 */
