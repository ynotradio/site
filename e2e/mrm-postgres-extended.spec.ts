/**
 * E2E Tests for Modern Rock Madness — Postgres Fresh Tournament Extended
 *
 * Covers additional details of the PHP page rendering for the fresh tournament:
 *   Phase 4 — Match card attributes  (match-id, full names, empty images, no sponsor)
 *   Phase 5 — Multi-region bracket   (regions 2-4 band abbreviations, TBD in future rounds)
 *   Phase 6 — Next-match extended    (VS separator, band image elements)
 *
 * Prerequisites: same as mrm-postgres-fresh.spec.ts (seed:mrm:fresh).
 */
import { test as baseTest, expect } from '@playwright/test';
import { captureScreenshot, checkForPhpErrors, navigateWithRetry } from './utils/test-helpers';

const LEGACY_BASE_URL =
  process.env.PLAYWRIGHT_LEGACY_URL || process.env.LEGACY_BASE_URL || 'http://localhost:8080';

const MRM_FRESH_URL = `${LEGACY_BASE_URL}/madness.php?preview=true&ff=use_postgres_madness`;

// Skip storage-state auth — these tests hit the legacy PHP site directly.
const test = baseTest.extend({
  // eslint-disable-next-line no-empty-pattern
  storageState: async ({}, runTest) => {
    await runTest({});
  },
});

// ---------------------------------------------------------------------------
// Phase 4 — Match card attribute details
// ---------------------------------------------------------------------------

test.describe('MRM Postgres — Fresh Tournament — Match Card Details', () => {
  test('page loads without PHP errors', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);
    const errors = checkForPhpErrors(await page.content());
    expect(errors).toHaveLength(0);
  });

  test('match card has a non-empty match-id attribute', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const matchCard = page.locator('mrm-match-card');
    await expect(matchCard).toBeVisible({ timeout: 10000 });

    const matchId = await matchCard.getAttribute('match-id');
    expect(matchId).toBeTruthy();
    expect(matchId?.length).toBeGreaterThan(0);
  });

  test('match card band1-name is the full band name, not an abbreviation', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const matchCard = page.locator('mrm-match-card');
    await expect(matchCard).toBeVisible({ timeout: 10000 });

    const band1Name = await matchCard.getAttribute('band1-name');
    // Full name, not the 7-char abbreviation 'JBrekie'
    expect(band1Name).toBe('Japanese Breakfast');
  });

  test('match card band2-name is the full band name, not an abbreviation', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const matchCard = page.locator('mrm-match-card');
    await expect(matchCard).toBeVisible({ timeout: 10000 });

    const band2Name = await matchCard.getAttribute('band2-name');
    expect(band2Name).toBe('Charly Bliss');
  });

  test('match card band1-image is empty (fresh seed has no band photos)', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const matchCard = page.locator('mrm-match-card');
    await expect(matchCard).toBeVisible({ timeout: 10000 });

    // Fresh seed groups have no media attached, so pic_url is empty string.
    const band1Image = await matchCard.getAttribute('band1-image');
    expect(band1Image ?? '').toBe('');
  });

  test('match card does not show a sponsor (fresh matches have no sponsor)', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const matchCard = page.locator('mrm-match-card');
    await expect(matchCard).toBeVisible({ timeout: 10000 });

    const sponsor = await matchCard.getAttribute('sponsor');
    // Scaffold creates matches with no sponsor set.
    expect(sponsor ?? '').toBe('');
  });

  test(
    'match card does not have show-results attribute (score not public on fresh running match)',
    async ({ page }) => {
      await navigateWithRetry(page, MRM_FRESH_URL);

      const matchCard = page.locator('mrm-match-card');
      await expect(matchCard).toBeVisible({ timeout: 10000 });

      // showScore defaults to false in scaffold; match isn't over yet.
      const showResults = await matchCard.getAttribute('show-results');
      expect(showResults).toBeNull();
    },
  );
});

// ---------------------------------------------------------------------------
// Phase 5 — Multi-region bracket rendering
// ---------------------------------------------------------------------------

test.describe('MRM Postgres — Fresh Tournament — Multi-Region Bracket', () => {
  test('region 2 first match shows Fontaines D.C. and Caroline Rose abbreviations', async ({
    page,
  }, testInfo) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    await expect(page.locator('#region_2')).toBeVisible({ timeout: 10000 });
    const firstR2Match = page.locator('#region_2 mrm-bracket-match').first();
    await expect(firstR2Match).toBeVisible({ timeout: 10000 });
    // Wait for the web component to render content.
    await expect(firstR2Match.locator('.band_abbr').first()).not.toHaveText('', {
      timeout: 5000,
    });

    const abbrs = await firstR2Match.locator('.band_abbr').allTextContents();
    expect(abbrs).toContain('FntnsDC'); // Fontaines D.C. (seed 1)
    expect(abbrs).toContain('ClnRose'); // Caroline Rose (seed 16)

    await captureScreenshot(page, testInfo, '09-MRM-Extended-Region2-Match1');
  });

  test('region 3 first match shows Jack White / White Stripes and Sheer Mag abbreviations', async ({
    page,
  }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    await expect(page.locator('#region_3')).toBeVisible({ timeout: 10000 });
    const firstR3Match = page.locator('#region_3 mrm-bracket-match').first();
    await expect(firstR3Match).toBeVisible({ timeout: 10000 });
    await expect(firstR3Match.locator('.band_abbr').first()).not.toHaveText('', {
      timeout: 5000,
    });

    const abbrs = await firstR3Match.locator('.band_abbr').allTextContents();
    expect(abbrs).toContain('JackWht'); // Jack White / White Stripes (seed 1)
    expect(abbrs).toContain('SherMag'); // Sheer Mag (seed 16)
  });

  test('region 4 first match shows St. Vincent and Yard Act abbreviations', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    await expect(page.locator('#region_4')).toBeVisible({ timeout: 10000 });
    const firstR4Match = page.locator('#region_4 mrm-bracket-match').first();
    await expect(firstR4Match).toBeVisible({ timeout: 10000 });
    await expect(firstR4Match.locator('.band_abbr').first()).not.toHaveText('', {
      timeout: 5000,
    });

    const abbrs = await firstR4Match.locator('.band_abbr').allTextContents();
    expect(abbrs).toContain('StVnct');  // St. Vincent (seed 1)
    expect(abbrs).toContain('YardAct'); // Yard Act (seed 16)
  });

  test('each of the four outer regions has 15 bracket match elements (all rounds)', async ({
    page,
  }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);
    await expect(page.locator('#bracket')).toBeVisible({ timeout: 10000 });

    // Each outer region contains: 8 R1 + 4 R2 + 2 Sweet16 + 1 Elusive8 = 15 matches.
    const [c1, c2, c3, c4] = await Promise.all([
      page.locator('#region_1 mrm-bracket-match').count(),
      page.locator('#region_2 mrm-bracket-match').count(),
      page.locator('#region_3 mrm-bracket-match').count(),
      page.locator('#region_4 mrm-bracket-match').count(),
    ]);
    expect(c1).toBe(15);
    expect(c2).toBe(15);
    expect(c3).toBe(15);
    expect(c4).toBe(15);
  });

  test('round 2 bracket matches in region 1 show TBD (no winners in fresh tournament)', async ({
    page,
  }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    await expect(page.locator('#region_1')).toBeVisible({ timeout: 10000 });
    // Wait for round 1 content to render so the component has initialized.
    await expect(
      page.locator('#region_1 mrm-bracket-match').first().locator('.band_abbr').first(),
    ).not.toHaveText('', { timeout: 10000 });

    // The 9th mrm-bracket-match inside region_1 is the first Round 2 slot.
    const round2Match = page.locator('#region_1 mrm-bracket-match').nth(8);
    await expect(round2Match).toBeVisible({ timeout: 10000 });

    const abbrs = await round2Match.locator('.band_abbr').allTextContents();
    // No R1 winners yet — both slots should be "TBD".
    expect(abbrs).toContain('TBD');
  });

  test('bracket match elements have a match-id attribute set', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const firstMatch = page.locator('#region_1 mrm-bracket-match').first();
    await expect(firstMatch).toBeVisible({ timeout: 10000 });

    const matchId = await firstMatch.getAttribute('match-id');
    expect(matchId).toBeTruthy();
    expect(Number(matchId)).toBeGreaterThan(0);
  });

  test('championship region (region 5) renders with three match slots', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    // Region 5 = championship region (Final 4 left, Final 4 right, Championship)
    await expect(page.locator('#region_5')).toBeVisible({ timeout: 10000 });
    const champMatches = await page.locator('#region_5 mrm-bracket-match').count();
    expect(champMatches).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Phase 6 — Next-match display extended
// ---------------------------------------------------------------------------

test.describe('MRM Postgres — Fresh Tournament — Next Match Extended', () => {
  test('next-match container has a VS separator element', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const nextMatchContainer = page.locator('.next-match-container');
    await expect(nextMatchContainer).toBeVisible({ timeout: 10000 });

    const vsEl = nextMatchContainer.locator('.vs-container');
    await expect(vsEl).toBeVisible({ timeout: 10000 });

    const vsText = await vsEl.textContent();
    expect(vsText?.trim().toUpperCase()).toBe('VS');
  });

  test('next-match container includes two band image elements', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const nextMatchContainer = page.locator('.next-match-container');
    await expect(nextMatchContainer).toBeVisible({ timeout: 10000 });

    // PHP renders one <img> per band regardless of whether src is empty.
    const images = nextMatchContainer.locator('img');
    const imageCount = await images.count();
    expect(imageCount).toBeGreaterThanOrEqual(2);
  });

  test('next-match container shows the two expected band name elements', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);

    const nextMatchContainer = page.locator('.next-match-container');
    await expect(nextMatchContainer).toBeVisible({ timeout: 10000 });

    // Each band is in its own .next-match-band > .band-name div.
    const bandNames = nextMatchContainer.locator('.band-name');
    const count = await bandNames.count();
    expect(count).toBe(2);

    const names = await bandNames.allTextContents();
    expect(names).toContain('The Wombats');
    expect(names).toContain('Japandroids');
  });
});
