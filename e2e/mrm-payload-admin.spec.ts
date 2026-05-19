/**
 * E2E Tests for Modern Rock Madness — Payload Admin Collections
 *
 * Tests that the MRM collections are accessible in the Payload admin UI
 * and that they contain the expected data seeded by seed:mrm:fresh.
 *
 * Authentication is handled inline (loginToPayload) rather than through
 * the global auth setup, so these tests can run in CI without the setup project.
 *
 * Prerequisites:
 *   - Payload running on PLAYWRIGHT_BASE_URL (default http://localhost:3000)
 *   - seed:mrm:fresh has run (creates 1 tournament, 64 groups, 63 matches)
 */
import {
  test as baseTest,
  expect,
  Page,
  APIRequestContext,
} from '@playwright/test';
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

async function getLatestTournamentFromApi(
  request: APIRequestContext,
): Promise<{ id: string | number; status?: string }> {
  const response = await request.get(
    `${PAYLOAD_BASE_URL}/api/modern-rock-madness-tournaments?limit=1&sort=-startDate`,
  );
  expect(response.ok()).toBeTruthy();

  const data = await response.json() as {
    docs?: Array<{ id?: string | number; name?: string; status?: string }>;
  };
  const tournament = data.docs?.[0];
  expect(tournament?.id).toBeTruthy();

  return {
    id: tournament!.id!,
    status: tournament!.status,
  };
}

async function openTournamentEditPage(page: Page, request: APIRequestContext) {
  const { id: tournamentId } = await getLatestTournamentFromApi(request);

  await page.goto(
    `${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-tournaments/${tournamentId}`,
    {
      waitUntil: 'networkidle',
      timeout: 30000,
    },
  );
  await page.waitForURL(`**/modern-rock-madness-tournaments/${tournamentId}**`, { timeout: 30000 });
}

async function openTournamentListPage(page: Page) {
  await page.goto(`${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-tournaments`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
}

// ---------------------------------------------------------------------------
// MRM Tournament collection
// ---------------------------------------------------------------------------

test.describe('MRM Payload Admin — Tournaments', () => {
  test.beforeEach(async ({ page }) => {
    await loginToPayload(page);
  });

  test('Tournaments collection list page is accessible', async ({ page }, testInfo) => {
    await page.goto(`${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-tournaments`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Should still be in admin (not redirected to login)
    expect(page.url()).toContain('/admin');
    await expect(page.locator('html[data-theme]')).toBeAttached();

    await captureScreenshot(page, testInfo, '10-Admin-MRM-Tournaments-List');
  });

  test('seeded tournament appears in the list', async ({ page, request }) => {
    const tournament = await getLatestTournamentFromApi(request);
    await openTournamentListPage(page);

    const editLink = page.locator(
      `a[href*="/admin/collections/modern-rock-madness-tournaments/${tournament.id}"]`,
    );
    await expect(editLink).toHaveCount(1, { timeout: 30000 });
  });

  test('tournament row shows active status', async ({ page, request }) => {
    const tournament = await getLatestTournamentFromApi(request);
    await openTournamentListPage(page);

    const editLink = page.locator(
      `a[href*="/admin/collections/modern-rock-madness-tournaments/${tournament.id}"]`,
    );
    await expect(editLink).toHaveCount(1, { timeout: 30000 });

    const row = editLink.locator('xpath=ancestor::tr[1]');
    await expect(row).toHaveCount(1, { timeout: 30000 });
    await expect(row).toContainText(/active/i);
  });

  test('clicking a tournament opens the edit page', async ({ page, request }, testInfo) => {
    await openTournamentEditPage(page, request);

    expect(page.url()).toContain('/modern-rock-madness-tournaments/');
    await captureScreenshot(page, testInfo, '11-Admin-MRM-Tournament-Edit');
  });

  test('tournament edit page has a Bracket tab', async ({ page, request }, testInfo) => {
    await openTournamentEditPage(page, request);

    // Payload can render custom tabs as link, tab, or button depending on version/layout.
    const bracketTab = page
      .locator('a, button, [role="tab"]')
      .filter({ hasText: /bracket/i })
      .first();
    await expect(bracketTab).toBeVisible({ timeout: 30000 });

    await captureScreenshot(page, testInfo, '12-Admin-MRM-Tournament-BracketTab');
  });

  test('Bracket tab loads without errors', async ({ page, request }, testInfo) => {
    await openTournamentEditPage(page, request);

    const bracketTab = page
      .locator('a, button, [role="tab"]')
      .filter({ hasText: /bracket/i })
      .first();
    await expect(bracketTab).toBeVisible({ timeout: 30000 });
    await bracketTab.click();
    await page.waitForURL('**/bracket**', { timeout: 30000 });

    // Page should still be in the admin (no crash redirect).
    expect(page.url()).toContain('/admin');
    await expect(page.locator('html[data-theme]')).toBeAttached();

    await captureScreenshot(page, testInfo, '13-Admin-MRM-Tournament-Bracket-View');
  });
});

// ---------------------------------------------------------------------------
// MRM Groups (bands) collection
// ---------------------------------------------------------------------------

test.describe('MRM Payload Admin — Groups (Bands)', () => {
  test.beforeEach(async ({ page }) => {
    await loginToPayload(page);
  });

  test('Groups collection list page is accessible', async ({ page }, testInfo) => {
    await page.goto(`${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-groups`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    expect(page.url()).toContain('/admin');
    await expect(page.locator('html[data-theme]')).toBeAttached();

    await captureScreenshot(page, testInfo, '14-Admin-MRM-Groups-List');
  });

  test('seeded band "Japanese Breakfast" appears in the Groups list', async ({ page }) => {
    // Use limit=100 so all 64 groups are visible on one page (default limit=10).
    await page.goto(`${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-groups?limit=100`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await expect(page.getByText('Japanese Breakfast')).toBeVisible({ timeout: 15000 });
  });

  test('Groups list page content indicates 64 total groups', async ({ page }) => {
    await page.goto(`${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-groups`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Payload displays "1-10 of 64" in the pagination area.
    await expect(page.getByText(/of 64/)).toBeVisible({ timeout: 15000 });
  });
});

// ---------------------------------------------------------------------------
// MRM Matches collection
// ---------------------------------------------------------------------------

test.describe('MRM Payload Admin — Matches', () => {
  test.beforeEach(async ({ page }) => {
    await loginToPayload(page);
  });

  test('Matches collection list page is accessible', async ({ page }, testInfo) => {
    await page.goto(`${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-matches`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    expect(page.url()).toContain('/admin');
    await expect(page.locator('html[data-theme]')).toBeAttached();

    await captureScreenshot(page, testInfo, '15-Admin-MRM-Matches-List');
  });

  test('Matches list page content indicates 63 total matches', async ({ page }) => {
    await page.goto(`${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-matches`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Payload displays "1-10 of 63" in the pagination area.
    await expect(page.getByText(/of 63/)).toBeVisible({ timeout: 15000 });
  });

  test('clicking a match link opens the match edit page', async ({ page }, testInfo) => {
    await page.goto(`${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-matches`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Click the first link in the table body (the name cell link).
    const firstLink = page.locator('table tbody tr td a').first();
    await expect(firstLink).toBeVisible({ timeout: 15000 });
    await firstLink.click();

    await page.waitForURL('**/modern-rock-madness-matches/**', { timeout: 15000 });
    expect(page.url()).toContain('/modern-rock-madness-matches/');

    await captureScreenshot(page, testInfo, '16-Admin-MRM-Match-Edit');
  });

  test('match edit page has a Match Controls tab', async ({ page }, testInfo) => {
    await page.goto(`${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-matches`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    const firstLink = page.locator('table tbody tr td a').first();
    await expect(firstLink).toBeVisible({ timeout: 15000 });
    await firstLink.click();

    await page.waitForURL('**/modern-rock-madness-matches/**', { timeout: 15000 });

    // The Match Controls custom tab should be visible.
    const controlsTab = page.getByRole('link', { name: /match controls/i });
    await expect(controlsTab).toBeVisible({ timeout: 15000 });

    await captureScreenshot(page, testInfo, '17-Admin-MRM-Match-ControlsTab');
  });

  test('Match Controls tab loads without errors', async ({ page }, testInfo) => {
    await page.goto(`${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-matches`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    const firstLink = page.locator('table tbody tr td a').first();
    await expect(firstLink).toBeVisible({ timeout: 15000 });
    await firstLink.click();

    await page.waitForURL('**/modern-rock-madness-matches/**', { timeout: 15000 });

    await page.getByRole('link', { name: /match controls/i }).click();
    await page.waitForURL('**/controls**', { timeout: 15000 });

    expect(page.url()).toContain('/admin');
    await expect(page.locator('html[data-theme]')).toBeAttached();

    await captureScreenshot(page, testInfo, '18-Admin-MRM-Match-Controls-View');
  });
});

// ---------------------------------------------------------------------------
// Shows collection — date filter
// ---------------------------------------------------------------------------

/**
 * These tests verify that the admin list date filter returns the correct shows
 * when filtering by date.  They rely on 3 shows seeded by seed:mrm:fresh:
 *   - 2030-06-15: startTime 06:11 and 10:22
 *   - 2030-06-22: startTime 14:33
 *
 * The Shows collection stores dates at noon UTC (via the normalizeShowDate hook
 * + pickerAppearance: 'dayOnly'), so the filter URL uses T12:00:00.000Z.
 */
test.describe('Shows Collection — Date Filter', () => {
  const SHOW_DATE_A = '2030-06-15T12:00:00.000Z';
  const SHOW_DATE_B = '2030-06-22T12:00:00.000Z';
  const SHOW_DATE_EMPTY = '2030-01-01T12:00:00.000Z';

  test.beforeEach(async ({ page }) => {
    await loginToPayload(page);
  });

  test('unfiltered Shows list shows all seeded shows', async ({ page }, testInfo) => {
    await page.goto(`${PAYLOAD_BASE_URL}/admin/collections/shows`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // All three seeded show times should be visible in the list
    await expect(page.getByText('06:11')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('10:22')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('14:33')).toBeVisible({ timeout: 15000 });

    await captureScreenshot(page, testInfo, '20-Shows-Unfiltered-List');
  });

  test('date filter returns only shows for the selected date (2 shows)', async ({
    page,
  }, testInfo) => {
    await page.goto(
      `${PAYLOAD_BASE_URL}/admin/collections/shows?where[date][equals]=${SHOW_DATE_A}`,
      { waitUntil: 'networkidle', timeout: 30000 },
    );

    // Both shows for date A should be visible
    await expect(page.getByText('06:11')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('10:22')).toBeVisible({ timeout: 15000 });

    // Show for date B must NOT appear
    await expect(page.getByText('14:33')).not.toBeVisible({ timeout: 5000 });

    await captureScreenshot(page, testInfo, '21-Shows-Filtered-DateA');
  });

  test('date filter returns only shows for a different date (1 show)', async ({
    page,
  }, testInfo) => {
    await page.goto(
      `${PAYLOAD_BASE_URL}/admin/collections/shows?where[date][equals]=${SHOW_DATE_B}`,
      { waitUntil: 'networkidle', timeout: 30000 },
    );

    // Only the show for date B should be visible
    await expect(page.getByText('14:33')).toBeVisible({ timeout: 15000 });

    // Shows for date A must NOT appear
    await expect(page.getByText('06:11')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('10:22')).not.toBeVisible({ timeout: 5000 });

    await captureScreenshot(page, testInfo, '22-Shows-Filtered-DateB');
  });

  test('date filter returns empty result for a date with no shows', async ({
    page,
  }, testInfo) => {
    await page.goto(
      `${PAYLOAD_BASE_URL}/admin/collections/shows?where[date][equals]=${SHOW_DATE_EMPTY}`,
      { waitUntil: 'networkidle', timeout: 30000 },
    );

    // None of the seeded show times should be visible
    await expect(page.getByText('06:11')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('10:22')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('14:33')).not.toBeVisible({ timeout: 5000 });

    await captureScreenshot(page, testInfo, '23-Shows-Filtered-Empty');
  });
});
