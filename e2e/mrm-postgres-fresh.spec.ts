/**
 * E2E Tests for Modern Rock Madness — Fresh Payload-backed Tournament
 *
 * Tests the Postgres/Payload-backed MRM tournament in its initial "fresh" state:
 * no completed matches, no winners, match 1 currently running.
 *
 * The tests use ?preview=true to bypass the date-redirect and
 * ?ff=use_postgres_madness to enable the Postgres adapter instead of MySQL.
 *
 * Prerequisites (handled by CI seed step / yarn seed:mrm:fresh locally):
 *   - An 'active' tournament in Payload with 64 bands and 63 matches
 *   - Match 1 set to be currently running (start: now-15min, end: now+15min)
 *   - All other matches in the future with no winners or votes
 *
 * Test organisation:
 *   Phase 1 — Basic rendering   (page load, bracket, regions, bands, timeline)
 *   Phase 2 — Active match      (running match card, countdown timer, login prompt)
 *   Phase 3 — Fresh-state checks (no champion, no vote %s, next-match display)
 */
import { test as baseTest, expect } from '@playwright/test';
import { captureScreenshot, checkForPhpErrors, navigateWithRetry } from './utils/test-helpers';

// Use PLAYWRIGHT_LEGACY_URL for CI Docker networking; fall back to localhost for local dev.
const LEGACY_BASE_URL = process.env.PLAYWRIGHT_LEGACY_URL || process.env.LEGACY_BASE_URL || 'http://localhost:8080';

const MRM_FRESH_URL = `${LEGACY_BASE_URL}/madness.php?preview=true&ff=use_postgres_madness`;

// Skip storage-state auth — these tests hit the legacy PHP site directly.
const test = baseTest.extend({
  // eslint-disable-next-line no-empty-pattern
  storageState: async ({}, runTest) => {
    await runTest({});
  },
});

// ---------------------------------------------------------------------------
// Phase 1 — Basic rendering
// ---------------------------------------------------------------------------

test.describe('MRM Postgres — Fresh Tournament — Basic Rendering', () => {
  test('loads without PHP errors', async ({ page }, testInfo) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const pageContent = await page.content();
    const errors = checkForPhpErrors(pageContent);
    expect(errors).toHaveLength(0);

    await captureScreenshot(page, testInfo, '01-MRM-Fresh-Page-Load');
  });

  test('shows Preview Mode banner', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const pageContent = await page.content();
    expect(pageContent).toContain('Preview Mode');
  });

  test('displays MRM branding in page content', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toContain('modern rock madness');
  });

  test('shows MRM banner image', async ({ page }, testInfo) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const bannerImage = page.locator('img[alt*="Modern Rock Madness"]');
    await expect(bannerImage).toBeVisible({ timeout: 10000 });

    await captureScreenshot(page, testInfo, '02-MRM-Fresh-Banner');
  });

  test('renders the bracket container', async ({ page }, testInfo) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const bracket = page.locator('#bracket');
    await expect(bracket).toBeVisible({ timeout: 10000 });

    await captureScreenshot(page, testInfo, '03-MRM-Fresh-Bracket');
  });

  test('renders all 5 tournament regions', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    await Promise.all([
      expect(page.locator('#region_1')).toBeVisible({ timeout: 10000 }),
      expect(page.locator('#region_2')).toBeVisible({ timeout: 10000 }),
      expect(page.locator('#region_3')).toBeVisible({ timeout: 10000 }),
      expect(page.locator('#region_4')).toBeVisible({ timeout: 10000 }),
      expect(page.locator('#region_5')).toBeVisible({ timeout: 10000 }),
    ]);
  });

  test('bracket contains 63 match elements', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    // Wait for bracket to render
    await expect(page.locator('#bracket')).toBeVisible({ timeout: 10000 });

    const matchElements = page.locator('mrm-bracket-match');
    await expect(matchElements.first()).toBeVisible({ timeout: 10000 });

    const matchCount = await matchElements.count();
    expect(matchCount).toBe(63);
  });

  test('round 1 match elements show band abbreviations (not TBD)', async ({ page }, testInfo) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    // Wait for bracket to be populated by JS
    await expect(page.locator('mrm-bracket-match').first()).toBeVisible({ timeout: 10000 });
    // Wait for first .band_abbr span to contain actual content (not empty)
    await expect(
      page.locator('mrm-bracket-match').first().locator('.band_abbr').first(),
    ).not.toHaveText('', { timeout: 5000 });

    // The first mrm-bracket-match is match 1 (Region 1, Round 1).
    // Its .band_abbr spans should show the seeded abbreviations 'JBrekie' and 'ChlyBls'.
    const firstMatch = page.locator('mrm-bracket-match').first();
    const abbrs = firstMatch.locator('.band_abbr');

    const abbr1 = await abbrs.nth(0).textContent();
    const abbr2 = await abbrs.nth(1).textContent();

    // Neither band should be 'TBD' — they were assigned during seeding.
    expect(abbr1).not.toBe('TBD');
    expect(abbr2).not.toBe('TBD');
    expect(abbr1?.length).toBeGreaterThan(0);
    expect(abbr2?.length).toBeGreaterThan(0);

    await captureScreenshot(page, testInfo, '04-MRM-Fresh-Bracket-Abbreviations');
  });

  test('round 1 match 1 shows correct band abbreviations from seed data', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    await expect(page.locator('mrm-bracket-match').first()).toBeVisible({ timeout: 10000 });
    // Wait for web-component to render abbreviations
    await expect(
      page.locator('mrm-bracket-match').first().locator('.band_abbr').first(),
    ).not.toHaveText('', { timeout: 5000 });
    const firstMatch = page.locator('mrm-bracket-match').first();
    const abbrs = firstMatch.locator('.band_abbr');

    const allAbbrs = await abbrs.allTextContents();
    expect(allAbbrs).toContain('JBrekie');
    expect(allAbbrs).toContain('ChlyBls');
  });

  test('bracket shows band seeds', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    await expect(page.locator('mrm-bracket-match').first()).toBeVisible({ timeout: 10000 });
    // Wait for web-component rendering to stabilize
    await expect(page.locator('mrm-bracket-match').first().locator('.seed').first()).not.toHaveText(
      '',
      { timeout: 5000 },
    );
    const seedElements = page.locator('mrm-bracket-match .seed');
    const seedCount = await seedElements.count();
    // 63 matches × 2 bands each = 126 seed spans
    expect(seedCount).toBeGreaterThanOrEqual(126);

    // Match 1, band 1 (Japanese Breakfast) has seed 1
    const firstMatchSeeds = page.locator('mrm-bracket-match').first().locator('.seed');
    const seed1 = await firstMatchSeeds.nth(0).textContent();
    expect(seed1?.trim()).toBe('1');
  });

  test('tournament timeline shows all round labels', async ({ page }, testInfo) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const timeline = page.locator('#time_line');
    await expect(timeline).toBeVisible({ timeout: 10000 });

    const timelineText = await timeline.textContent();
    expect(timelineText).toContain('1st ROUND');
    expect(timelineText).toContain('2nd ROUND');
    expect(timelineText).toContain('SWELL 16');
    expect(timelineText).toContain('ELUSIVE 8');
    expect(timelineText).toContain('FANTASTIC 4');
    expect(timelineText).toContain('CHAMPION');

    await captureScreenshot(page, testInfo, '05-MRM-Fresh-Timeline');
  });

  test('timeline has 11 entries (symmetric bracket labels)', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const timeline = page.locator('#time_line');
    await expect(timeline).toBeVisible({ timeout: 10000 });

    // Timeline is: 1st R | 2nd R | Swell 16 | Elusive 8 | Fantastic 4 | Champion |
    //              Fantastic 4 | Elusive 8 | Swell 16 | 2nd R | 1st R
    const items = timeline.locator('li');
    const count = await items.count();
    expect(count).toBe(11);
  });
});

// ---------------------------------------------------------------------------
// Phase 2 — Active match display
// ---------------------------------------------------------------------------

test.describe('MRM Postgres — Fresh Tournament — Active Match', () => {
  test('DEBUG: dump getCurrentMatch result from page source', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);
    const html = await page.content();
    // Extract debug comments
    const matchDebug = html.match(/DEBUG_CURRENT_MATCH:(.*?)-->/)?.[1] ?? 'NOT FOUND';
    const phpNow = html.match(/DEBUG_PHP_NOW:(.*?)-->/)?.[1] ?? 'NOT FOUND';
    // eslint-disable-next-line no-console
    console.log(`[DEBUG] getCurrentMatch = ${matchDebug}`);
    // eslint-disable-next-line no-console
    console.log(`[DEBUG] PHP NOW = ${phpNow}`);
    // This test always passes — it's just for logging
    expect(true).toBe(true);
  });

  test('renders the current match card for the running match', async ({ page }, testInfo) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const matchCard = page.locator('mrm-match-card');
    await expect(matchCard).toBeVisible({ timeout: 10000 });

    await captureScreenshot(page, testInfo, '06-MRM-Fresh-Match-Card');
  });

  test('match card has status="running"', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const matchCard = page.locator('mrm-match-card');
    await expect(matchCard).toBeVisible({ timeout: 10000 });

    const status = await matchCard.getAttribute('status');
    expect(status).toBe('running');
  });

  test('match card shows band 1 name (Japanese Breakfast)', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const matchCard = page.locator('mrm-match-card');
    await expect(matchCard).toBeVisible({ timeout: 10000 });

    const band1Name = await matchCard.getAttribute('band1-name');
    expect(band1Name).toBe('Japanese Breakfast');
  });

  test('match card shows band 2 name (Charly Bliss)', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const matchCard = page.locator('mrm-match-card');
    await expect(matchCard).toBeVisible({ timeout: 10000 });

    const band2Name = await matchCard.getAttribute('band2-name');
    expect(band2Name).toBe('Charly Bliss');
  });

  test('countdown timer elements (#hr, #min, #sec) are present', async ({ page }, testInfo) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    // These hidden divs are rendered by PHP when a match is running.
    await expect(page.locator('#hr')).toBeAttached({ timeout: 10000 });
    await expect(page.locator('#min')).toBeAttached({ timeout: 10000 });
    await expect(page.locator('#sec')).toBeAttached({ timeout: 10000 });

    await captureScreenshot(page, testInfo, '07-MRM-Fresh-Timer');
  });

  test('countdown timer values are non-negative integers', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    await expect(page.locator('#hr')).toBeAttached({ timeout: 10000 });

    const hr = await page.locator('#hr').textContent();
    const min = await page.locator('#min').textContent();
    const sec = await page.locator('#sec').textContent();

    expect(parseInt(hr ?? '-1', 10)).toBeGreaterThanOrEqual(0);
    expect(parseInt(min ?? '-1', 10)).toBeGreaterThanOrEqual(0);
    expect(parseInt(sec ?? '-1', 10)).toBeGreaterThanOrEqual(0);
  });

  test('match card shows login-url for unauthenticated users', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const matchCard = page.locator('mrm-match-card');
    await expect(matchCard).toBeVisible({ timeout: 10000 });

    // Unauthenticated visitors should see a login-url attribute pointing to Auth0 login.
    const loginUrl = await matchCard.getAttribute('login-url');
    expect(loginUrl).toBeTruthy();
    expect(loginUrl).toContain('auth_login.php');
  });

  test('Madness JavaScript object is loaded', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const madnessExists = await page.evaluate(
      () => typeof (window as unknown as { Madness?: unknown }).Madness !== 'undefined',
    );
    expect(madnessExists).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Phase 3 — Fresh-state verification
// ---------------------------------------------------------------------------

test.describe('MRM Postgres — Fresh Tournament — Fresh State', () => {
  test('does NOT display champion banner (no winner yet)', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const pageContent = await page.content();
    // No winner exists, so no champion heading should be present.
    expect(pageContent).not.toContain('mrm-champion');
    expect(pageContent.toLowerCase()).not.toContain("this year's champion");
  });

  test('does NOT show vote percentages for future bracket matches', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    await expect(page.locator('mrm-bracket-match').first()).toBeVisible({ timeout: 10000 });
    // Wait for web-component rendering to stabilize (band_abbr should contain content)
    await expect(
      page.locator('mrm-bracket-match').first().locator('.band_abbr').first(),
    ).not.toHaveText('', { timeout: 5000 });
    // on bracket match elements for future (non-running) round 1 matches.
    // Check the second match (index 1) which is in the future and has no votes.
    const secondMatch = page.locator('mrm-bracket-match').nth(1);
    const pct1 = await secondMatch.getAttribute('band1-pct');
    const pct2 = await secondMatch.getAttribute('band2-pct');

    // Either null (attribute absent) or empty string — not a real percentage.
    expect(pct1 ?? '').toBe('');
    expect(pct2 ?? '').toBe('');
  });

  test('scoreboard is NOT shown for a fresh tournament (showScore=false)', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    // mrm-scoreboard is only rendered when show_score=true AND there's a current match.
    // For a fresh tournament match 1 has showScore=false, so no scoreboard element.
    const scoreboard = page.locator('mrm-scoreboard');
    const count = await scoreboard.count();
    expect(count).toBe(0);
  });

  test('shows next match info for the upcoming second match', async ({ page }, testInfo) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    // When match 1 is running, getFirstRowContent() returns 'next_match',
    // which renders _mrm_next_match.php showing the next upcoming match.
    const nextMatchContainer = page.locator('.next-match-container');
    await expect(nextMatchContainer).toBeVisible({ timeout: 10000 });

    await captureScreenshot(page, testInfo, '08-MRM-Fresh-Next-Match');
  });

  test('next match display shows band names for match 2', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const nextMatchContainer = page.locator('.next-match-container');
    await expect(nextMatchContainer).toBeVisible({ timeout: 10000 });

    const nextMatchText = await nextMatchContainer.textContent();

    // Match 2 bands: The Wombats (placement 3) vs Japandroids (placement 4)
    expect(nextMatchText).toContain('The Wombats');
    expect(nextMatchText).toContain('Japandroids');
  });

  test('next match display shows a future date and time', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const heading = page.locator('.next-match-container h3');
    await expect(heading).toBeVisible({ timeout: 10000 });

    const headingText = await heading.textContent();
    // Heading format: "Next Match: <day>, <Month> <D> at <H:MM AM/PM>"
    expect(headingText).toContain('Next Match:');
    expect(headingText).toMatch(/at\s+\d+:\d+\s*(AM|PM)/i);
  });

  test('no critical console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    await navigateWithRetry(page, MRM_FRESH_URL);
    // Wait for page to fully settle (bracket renders + any async scripts run)
    await page.waitForLoadState('networkidle');

    // Filter out known third-party widget errors.
    const criticalErrors = consoleErrors.filter(
      (err) => !err.includes('twitter')
        && !err.includes('facebook')
        && !err.includes('FB')
        && !err.includes('platform.twitter'),
    );

    if (criticalErrors.length > 0) {
      test.info().annotations.push({
        type: 'Console Errors',
        description: `${criticalErrors.length} error(s): ${criticalErrors.slice(0, 3).join('; ')}`,
      });
    }

    expect(criticalErrors).toHaveLength(0);
  });
});
