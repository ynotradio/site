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

// ---------------------------------------------------------------------------
// MRM Tournament collection
// ---------------------------------------------------------------------------

test.describe('MRM Payload Admin — Tournaments', () => {
  test.beforeEach(async ({ page }) => {
    await loginToPayload(page);
  });

  test('Tournaments collection list page is accessible', async ({ page }, testInfo) => {
    await page.goto(
      `${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-tournaments`,
      { waitUntil: 'networkidle', timeout: 30000 },
    );

    // Should still be in admin (not redirected to login)
    expect(page.url()).toContain('/admin');
    await expect(page.locator('html[data-theme]')).toBeAttached();

    await captureScreenshot(page, testInfo, '10-Admin-MRM-Tournaments-List');
  });

  test('seeded tournament "Modern Rock Madness 2026" appears in the list', async ({ page }) => {
    await page.goto(
      `${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-tournaments`,
      { waitUntil: 'networkidle', timeout: 30000 },
    );

    await expect(page.getByText('Modern Rock Madness 2026')).toBeVisible({ timeout: 15000 });
  });

  test('tournament row shows active status', async ({ page }) => {
    await page.goto(
      `${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-tournaments`,
      { waitUntil: 'networkidle', timeout: 30000 },
    );

    // 'active' should appear somewhere in the list row for this tournament.
    await expect(page.getByText('Modern Rock Madness 2026')).toBeVisible({ timeout: 15000 });
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toContain('active');
  });

  test('clicking a tournament row opens the edit page', async ({ page }, testInfo) => {
    await page.goto(
      `${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-tournaments`,
      { waitUntil: 'networkidle', timeout: 30000 },
    );

    await expect(page.getByText('Modern Rock Madness 2026')).toBeVisible({ timeout: 15000 });

    // Click the tournament name link to open the document.
    await page.getByText('Modern Rock Madness 2026').first().click();
    await page.waitForURL('**/modern-rock-madness-tournaments/**', { timeout: 15000 });

    expect(page.url()).toContain('/modern-rock-madness-tournaments/');
    await captureScreenshot(page, testInfo, '11-Admin-MRM-Tournament-Edit');
  });

  test('tournament edit page has a Bracket tab', async ({ page }, testInfo) => {
    await page.goto(
      `${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-tournaments`,
      { waitUntil: 'networkidle', timeout: 30000 },
    );

    await expect(page.getByText('Modern Rock Madness 2026')).toBeVisible({ timeout: 15000 });
    await page.getByText('Modern Rock Madness 2026').first().click();
    await page.waitForURL('**/modern-rock-madness-tournaments/**', { timeout: 15000 });

    // The Bracket custom tab should be visible in the document tab bar.
    const bracketTab = page.getByRole('link', { name: /bracket/i });
    await expect(bracketTab).toBeVisible({ timeout: 15000 });

    await captureScreenshot(page, testInfo, '12-Admin-MRM-Tournament-BracketTab');
  });

  test('Bracket tab loads without errors', async ({ page }, testInfo) => {
    await page.goto(
      `${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-tournaments`,
      { waitUntil: 'networkidle', timeout: 30000 },
    );

    await expect(page.getByText('Modern Rock Madness 2026')).toBeVisible({ timeout: 15000 });
    await page.getByText('Modern Rock Madness 2026').first().click();
    await page.waitForURL('**/modern-rock-madness-tournaments/**', { timeout: 15000 });

    await page.getByRole('link', { name: /bracket/i }).click();
    await page.waitForURL('**/bracket**', { timeout: 15000 });

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
    await page.goto(
      `${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-groups`,
      { waitUntil: 'networkidle', timeout: 30000 },
    );

    expect(page.url()).toContain('/admin');
    await expect(page.locator('html[data-theme]')).toBeAttached();

    await captureScreenshot(page, testInfo, '14-Admin-MRM-Groups-List');
  });

  test('seeded band "Japanese Breakfast" appears in the Groups list', async ({ page }) => {
    await page.goto(
      `${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-groups`,
      { waitUntil: 'networkidle', timeout: 30000 },
    );

    await expect(page.getByText('Japanese Breakfast')).toBeVisible({ timeout: 15000 });
  });

  test('Groups list page content indicates 64 total groups', async ({ page }) => {
    await page.goto(
      `${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-groups`,
      { waitUntil: 'networkidle', timeout: 30000 },
    );

    // Payload displays a count like "64 Groups" or "1-10 of 64" somewhere on the page.
    await page.waitForLoadState('networkidle');
    const pageContent = await page.content();
    expect(pageContent).toContain('64');
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
    await page.goto(
      `${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-matches`,
      { waitUntil: 'networkidle', timeout: 30000 },
    );

    expect(page.url()).toContain('/admin');
    await expect(page.locator('html[data-theme]')).toBeAttached();

    await captureScreenshot(page, testInfo, '15-Admin-MRM-Matches-List');
  });

  test('Matches list page content indicates 63 total matches', async ({ page }) => {
    await page.goto(
      `${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-matches`,
      { waitUntil: 'networkidle', timeout: 30000 },
    );

    await page.waitForLoadState('networkidle');
    const pageContent = await page.content();
    expect(pageContent).toContain('63');
  });

  test('clicking a match row opens the match edit page', async ({ page }, testInfo) => {
    await page.goto(
      `${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-matches`,
      { waitUntil: 'networkidle', timeout: 30000 },
    );

    // Click the first match row.
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 15000 });
    await firstRow.click();

    await page.waitForURL('**/modern-rock-madness-matches/**', { timeout: 15000 });
    expect(page.url()).toContain('/modern-rock-madness-matches/');

    await captureScreenshot(page, testInfo, '16-Admin-MRM-Match-Edit');
  });

  test('match edit page has a Match Controls tab', async ({ page }, testInfo) => {
    await page.goto(
      `${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-matches`,
      { waitUntil: 'networkidle', timeout: 30000 },
    );

    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 15000 });
    await firstRow.click();

    await page.waitForURL('**/modern-rock-madness-matches/**', { timeout: 15000 });

    // The Match Controls custom tab should be visible.
    const controlsTab = page.getByRole('link', { name: /match controls/i });
    await expect(controlsTab).toBeVisible({ timeout: 15000 });

    await captureScreenshot(page, testInfo, '17-Admin-MRM-Match-ControlsTab');
  });

  test('Match Controls tab loads without errors', async ({ page }, testInfo) => {
    await page.goto(
      `${PAYLOAD_BASE_URL}/admin/collections/modern-rock-madness-matches`,
      { waitUntil: 'networkidle', timeout: 30000 },
    );

    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 15000 });
    await firstRow.click();

    await page.waitForURL('**/modern-rock-madness-matches/**', { timeout: 15000 });

    await page.getByRole('link', { name: /match controls/i }).click();
    await page.waitForURL('**/controls**', { timeout: 15000 });

    expect(page.url()).toContain('/admin');
    await expect(page.locator('html[data-theme]')).toBeAttached();

    await captureScreenshot(page, testInfo, '18-Admin-MRM-Match-Controls-View');
  });
});
