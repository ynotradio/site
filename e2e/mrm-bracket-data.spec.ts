/**
 * E2E Tests for Modern Rock Madness — Bracket Match Data Integrity
 *
 * Validates that the bracket-match web component attributes rendered by PHP
 * accurately reflect the tournament data seeded in Payload/PostgreSQL.
 *
 *   Phase 7 — Bracket match attributes (match-id, no winners, live class)
 *   Phase 8 — Seed distribution        (1-16 seeding per region, pairing)
 *
 * Prerequisites: same as mrm-postgres-fresh.spec.ts (seed:mrm:fresh).
 */
import { test as baseTest, expect } from '@playwright/test';
import {
  captureScreenshot,
  checkForPhpErrors,
  navigateWithRetry,
} from './utils/test-helpers';

const LEGACY_BASE_URL = process.env.PLAYWRIGHT_LEGACY_URL
  || process.env.LEGACY_BASE_URL
  || 'http://localhost:8080';

const MRM_FRESH_URL = `${LEGACY_BASE_URL}/madness.php?preview=true&ff=use_postgres_madness`;

// Skip storage-state auth — these tests hit the legacy PHP site directly.
const test = baseTest.extend({
  // eslint-disable-next-line no-empty-pattern
  storageState: async ({}, runTest) => {
    await runTest({});
  },
});

/** Wait for the bracket web components to render their content. */
async function waitForBracketRender(page: import('@playwright/test').Page) {
  await expect(page.locator('#bracket')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('mrm-bracket-match').first()).toBeVisible({
    timeout: 10000,
  });
  await expect(
    page
      .locator('mrm-bracket-match')
      .first()
      .locator('.band_abbr')
      .first(),
  ).not.toHaveText('', { timeout: 5000 });
}

// -----------------------------------------------------------------------
// Phase 7 — Bracket match attribute validation
// -----------------------------------------------------------------------

test.describe('MRM Postgres — Bracket Match Data Integrity', () => {
  test('page loads without PHP errors', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);
    const errors = checkForPhpErrors(await page.content());
    expect(errors).toHaveLength(0);
  });

  test(
    'every bracket match element has a positive integer match-id',
    async ({ page }, testInfo) => {
      await navigateWithRetry(page, MRM_FRESH_URL);
      await waitForBracketRender(page);

      const allMatchIds = await page
        .locator('mrm-bracket-match')
        .evaluateAll((els) => els.map((el) => el.getAttribute('match-id')));

      expect(allMatchIds).toHaveLength(63);
      allMatchIds.forEach((id) => {
        expect(id).toBeTruthy();
        const numId = Number(id);
        expect(numId).toBeGreaterThan(0);
        expect(Number.isInteger(numId)).toBe(true);
      });

      await captureScreenshot(page, testInfo, '20-Bracket-MatchIds');
    },
  );

  test('all 63 bracket match-id values are unique', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);
    await waitForBracketRender(page);

    const allMatchIds = await page
      .locator('mrm-bracket-match')
      .evaluateAll((els) => els.map((el) => el.getAttribute('match-id')));

    const uniqueIds = new Set(allMatchIds);
    expect(uniqueIds.size).toBe(63);
  });

  test(
    'no bracket match has a winner attribute in a fresh tournament',
    async ({ page }, testInfo) => {
      await navigateWithRetry(page, MRM_FRESH_URL);
      await waitForBracketRender(page);

      await expect(page.locator('mrm-bracket-match[winner]')).toHaveCount(0);

      await captureScreenshot(page, testInfo, '21-Bracket-NoWinners');
    },
  );

  test('the running match (match 1) has the live_match CSS class', async ({
    page,
  }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);
    await waitForBracketRender(page);

    // Match 1 should have the live_match class since it's currently running.
    const liveMatches = page.locator('mrm-bracket-match.live_match');
    await expect(liveMatches).toHaveCount(1);

    // Verify it's specifically match 1 (the seeded running match).
    const liveMatchEl = liveMatches.first();
    await expect(liveMatchEl.locator('.band_abbr')).toContainText(['JBrekie', 'ChlyBls']);
  });

  test('non-running matches do not have live_match CSS class', async ({
    page,
  }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);
    await waitForBracketRender(page);

    await expect(page.locator('mrm-bracket-match.live_match')).toHaveCount(1);
    await expect(page.locator('mrm-bracket-match')).toHaveCount(63);
  });

  test(
    'bracket match elements have matching id and match-id attributes',
    async ({ page }) => {
      await navigateWithRetry(page, MRM_FRESH_URL);
      await waitForBracketRender(page);

      const mismatches = await page
        .locator('mrm-bracket-match')
        .evaluateAll((els) => els
          .filter((el) => {
            const htmlId = el.id;
            const matchId = el.getAttribute('match-id');
            return htmlId !== `match${matchId}`;
          })
          .map((el) => ({
            id: el.id,
            matchId: el.getAttribute('match-id'),
          })));

      expect(mismatches).toHaveLength(0);
    },
  );

  test(
    'no bracket match shows vote percentages in a fresh tournament',
    async ({ page }) => {
      await navigateWithRetry(page, MRM_FRESH_URL);
      await waitForBracketRender(page);

      // showScore=false means no pct attributes on any match.
      await expect(page.locator('mrm-bracket-match[band1-pct]')).toHaveCount(0);
      await expect(page.locator('mrm-bracket-match[band2-pct]')).toHaveCount(0);
    },
  );

  test('no sponsor elements are displayed for a fresh tournament', async ({
    page,
  }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);
    await expect(page.locator('#bracket')).toBeVisible({ timeout: 10000 });

    await expect(page.locator('#sponsor_top')).toHaveCount(0);
    await expect(page.locator('#sponsor_bottom')).toHaveCount(0);
  });
});

// -----------------------------------------------------------------------
// Phase 8 — Seed distribution and pairing validation
// -----------------------------------------------------------------------

test.describe('MRM Postgres — Bracket Seed Distribution', () => {
  test(
    'every R1 bracket match has valid band1-seed and band2-seed (1-16)',
    async ({ page }) => {
      await navigateWithRetry(page, MRM_FRESH_URL);
      await waitForBracketRender(page);

      // Collect all R1 seed attributes via page.evaluate to avoid await-in-loop
      const seeds = await page.evaluate(() => {
        const result: { s1: string | null; s2: string | null }[] = [];
        [1, 2, 3, 4].forEach((region) => {
          const matches = document.querySelectorAll(
            `#region_${region} mrm-bracket-match`,
          );
          Array.from(matches)
            .slice(0, 8)
            .forEach((m) => {
              result.push({
                s1: m.getAttribute('band1-seed'),
                s2: m.getAttribute('band2-seed'),
              });
            });
        });
        return result;
      });

      expect(seeds).toHaveLength(32); // 4 regions × 8 R1 matches
      seeds.forEach(({ s1, s2 }) => {
        expect(s1).toBeTruthy();
        expect(s2).toBeTruthy();
        expect(Number(s1)).toBeGreaterThanOrEqual(1);
        expect(Number(s1)).toBeLessThanOrEqual(16);
        expect(Number(s2)).toBeGreaterThanOrEqual(1);
        expect(Number(s2)).toBeLessThanOrEqual(16);
      });
    },
  );

  test(
    'region 1 R1 match 1 has seed 1 vs seed 16 pairing',
    async ({ page }, testInfo) => {
      await navigateWithRetry(page, MRM_FRESH_URL);
      await waitForBracketRender(page);

      const match1 = page.locator('#region_1 mrm-bracket-match').first();
      await expect(match1).toHaveAttribute('band1-seed', '1');
      await expect(match1).toHaveAttribute('band2-seed', '16');

      await captureScreenshot(page, testInfo, '22-Bracket-R1-SeedPairing');
    },
  );

  test(
    'each region has all 16 seeds (1-16) exactly once in R1',
    async ({ page }) => {
      await navigateWithRetry(page, MRM_FRESH_URL);
      await waitForBracketRender(page);

      const seedsByRegion = await page.evaluate(() => {
        const result: Record<number, number[]> = {};
        [1, 2, 3, 4].forEach((region) => {
          const matches = document.querySelectorAll(
            `#region_${region} mrm-bracket-match`,
          );
          result[region] = Array.from(matches)
            .slice(0, 8)
            .flatMap((m) => [
              Number(m.getAttribute('band1-seed')),
              Number(m.getAttribute('band2-seed')),
            ]);
        });
        return result;
      });

      [1, 2, 3, 4].forEach((region) => {
        const seeds = seedsByRegion[region];
        expect(seeds).toHaveLength(16);

        const uniqueSeeds = new Set(seeds);
        expect(uniqueSeeds.size).toBe(16);

        // All seeds 1-16 should appear exactly once
        Array.from({ length: 16 }, (_, i) => i + 1).forEach((s) => {
          expect(uniqueSeeds.has(s)).toBe(true);
        });
      });
    },
  );

  test(
    'R2+ matches in region 1 show TBD for at least one band',
    async ({ page }) => {
      await navigateWithRetry(page, MRM_FRESH_URL);
      await waitForBracketRender(page);

      const r2PlusAbbrs = await page.evaluate(() => {
        const matches = document.querySelectorAll(
          '#region_1 mrm-bracket-match',
        );
        return Array.from(matches)
          .slice(8) // Skip R1 (indices 0-7)
          .map((m) => Array.from(m.querySelectorAll('.band_abbr')).map(
            (el) => el.textContent ?? '',
          ));
      });

      // R2+ has 7 matches (4 R2, 2 S16, 1 E8)
      expect(r2PlusAbbrs.length).toBe(7);
      r2PlusAbbrs.forEach((abbrs) => {
        const hasTBD = abbrs.some((a) => a === 'TBD');
        expect(hasTBD).toBe(true);
      });
    },
  );

  test(
    'region 5 (championship) all three matches show TBD',
    async ({ page }, testInfo) => {
      await navigateWithRetry(page, MRM_FRESH_URL);
      await expect(page.locator('#region_5')).toBeVisible({ timeout: 10000 });

      const champAbbrs = await page.evaluate(() => {
        const matches = document.querySelectorAll(
          '#region_5 mrm-bracket-match',
        );
        return Array.from(matches).map((m) => Array.from(m.querySelectorAll('.band_abbr')).map(
          (el) => el.textContent ?? '',
        ));
      });

      expect(champAbbrs).toHaveLength(3);
      champAbbrs.forEach((abbrs) => {
        abbrs.forEach((abbr) => {
          expect(abbr).toBe('TBD');
        });
      });

      await captureScreenshot(page, testInfo, '23-Bracket-Championship-TBD');
    },
  );

  test(
    'R1 bracket band abbreviations are 7 characters or fewer',
    async ({ page }) => {
      await navigateWithRetry(page, MRM_FRESH_URL);
      await waitForBracketRender(page);

      // Collect all R1 abbreviation text content via page.evaluate
      const abbrTexts = await page.evaluate(() => {
        const result: string[] = [];
        [1, 2, 3, 4].forEach((region) => {
          const matches = document.querySelectorAll(
            `#region_${region} mrm-bracket-match`,
          );
          Array.from(matches)
            .slice(0, 8)
            .forEach((m) => {
              Array.from(m.querySelectorAll('.band_abbr')).forEach((el) => {
                const text = el.textContent ?? '';
                if (text.length > 0) result.push(text);
              });
            });
        });
        return result;
      });

      expect(abbrTexts).toHaveLength(64); // 32 R1 matches × 2 bands
      abbrTexts.forEach((abbr) => {
        // MadnessBands abbreviation max length is 7
        expect(abbr.length).toBeLessThanOrEqual(7);
      });
    },
  );
});
