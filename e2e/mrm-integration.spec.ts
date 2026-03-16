/**
 * E2E Tests for Modern Rock Madness — Payload API ↔ PHP Integration
 *
 * Validates data consistency between Payload CMS (REST API) and the
 * legacy PHP bracket rendering. Full pipeline test:
 *   Payload collections → PostgreSQL → PHP model → HTML
 *
 *   Phase 9  — API data validation     (tournament, groups, matches)
 *   Phase 10 — Cross-system consistency (API ↔ PHP bracket rendering)
 *
 * Prerequisites: same as mrm-postgres-fresh.spec.ts (seed:mrm:fresh).
 */
import { test as baseTest, expect } from '@playwright/test';
import {
  captureScreenshot,
  checkForPhpErrors,
  navigateWithRetry,
} from './utils/test-helpers';

const PAYLOAD_BASE_URL = process.env.PLAYWRIGHT_BASE_URL
  || 'http://localhost:3000';
const LEGACY_BASE_URL = process.env.PLAYWRIGHT_LEGACY_URL
  || process.env.LEGACY_BASE_URL
  || 'http://localhost:8080';
const MRM_FRESH_URL = `${LEGACY_BASE_URL}/madness.php?preview=true&ff=use_postgres_madness`;

const test = baseTest.extend({
  // eslint-disable-next-line no-empty-pattern
  storageState: async ({}, runTest) => { await runTest({}); },
});

/** Fetch the active tournament ID from the Payload API. */
async function getActiveTournamentId(
  request: import('@playwright/test').APIRequestContext,
): Promise<number> {
  const res = await request.get(
    `${PAYLOAD_BASE_URL}/api/modern-rock-madness-tournaments`
      + '?where[status][equals]=active&limit=1',
  );
  const data = await res.json();
  return data.docs[0].id;
}

// -----------------------------------------------------------------------
// Phase 9 — Payload REST API data validation
// -----------------------------------------------------------------------

test.describe('MRM Integration — Payload API Data', () => {
  test('active tournament exists with correct metadata', async ({ request }) => {
    const res = await request.get(
      `${PAYLOAD_BASE_URL}/api/modern-rock-madness-tournaments`
        + '?where[status][equals]=active&limit=10',
    );
    expect(res.ok()).toBe(true);
    const data = await res.json();

    expect(data.docs).toHaveLength(1);
    expect(data.docs[0].name).toBe('Modern Rock Madness 2026');
    expect(data.docs[0].status).toBe('active');
    expect(data.docs[0].year).toBe(2026);
    expect(data.docs[0].startDate).toBeTruthy();
    expect(data.docs[0].bracketPdfUrl).toContain('pdf');
  });

  test('64 bands and 63 matches exist for the tournament', async ({ request }) => {
    const tournamentId = await getActiveTournamentId(request);

    const [groupsRes, matchesRes] = await Promise.all([
      request.get(
        `${PAYLOAD_BASE_URL}/api/modern-rock-madness-groups`
          + `?where[tournament][equals]=${tournamentId}&limit=100`,
      ),
      request.get(
        `${PAYLOAD_BASE_URL}/api/modern-rock-madness-matches`
          + `?where[tournament][equals]=${tournamentId}&limit=100`,
      ),
    ]);

    expect((await groupsRes.json()).totalDocs).toBe(64);
    expect((await matchesRes.json()).totalDocs).toBe(63);
  });

  test('match 1 is running with correct band assignments', async ({ request }) => {
    const tournamentId = await getActiveTournamentId(request);
    const res = await request.get(
      `${PAYLOAD_BASE_URL}/api/modern-rock-madness-matches`
        + `?where[tournament][equals]=${tournamentId}`
        + '&where[matchNumber][equals]=1&limit=1&depth=1',
    );
    const match1 = (await res.json()).docs[0];

    // Currently running (start in past, end in future)
    const now = new Date();
    expect(new Date(match1.startTime).getTime()).toBeLessThan(now.getTime());
    expect(new Date(match1.endTime).getTime()).toBeGreaterThan(now.getTime());

    // Bands assigned with correct names
    expect(match1.band1).toBeTruthy();
    expect(match1.band2).toBeTruthy();
    if (typeof match1.band1 === 'object') {
      expect(match1.band1.name).toBe('Japanese Breakfast');
      expect(match1.band1.abbreviation).toBe('JBrekie');
    }
    if (typeof match1.band2 === 'object') {
      expect(match1.band2.name).toBe('Charly Bliss');
      expect(match1.band2.abbreviation).toBe('ChlyBls');
    }
  });

  test('R1 matches have bands, R2+ matches do not', async ({ request }) => {
    const tournamentId = await getActiveTournamentId(request);
    const res = await request.get(
      `${PAYLOAD_BASE_URL}/api/modern-rock-madness-matches`
        + `?where[tournament][equals]=${tournamentId}`
        + '&limit=100&sort=matchNumber',
    );
    const { docs } = await res.json();

    const r1 = docs.filter((m: { matchNumber: number }) => m.matchNumber <= 32);
    const later = docs.filter((m: { matchNumber: number }) => m.matchNumber > 32);

    expect(r1).toHaveLength(32);
    expect(later).toHaveLength(31);

    r1.forEach((m: { band1: unknown; band2: unknown }) => {
      expect(m.band1).toBeTruthy();
      expect(m.band2).toBeTruthy();
    });
    later.forEach((m: { band1: unknown; band2: unknown }) => {
      expect(m.band1).toBeFalsy();
      expect(m.band2).toBeFalsy();
    });
  });

  test('matches have correct round distribution and no winners', async ({ request }) => {
    const tournamentId = await getActiveTournamentId(request);
    const res = await request.get(
      `${PAYLOAD_BASE_URL}/api/modern-rock-madness-matches`
        + `?where[tournament][equals]=${tournamentId}&limit=100`,
    );
    const { docs } = await res.json();

    const roundCounts = new Map<string, number>();
    docs.forEach((m: { round: string; winner: unknown }) => {
      const round = m.round || 'unknown';
      roundCounts.set(round, (roundCounts.get(round) || 0) + 1);
      expect(m.winner).toBeFalsy();
    });

    expect(roundCounts.get('round1')).toBe(32);
    expect(roundCounts.get('round2')).toBe(16);
    expect(roundCounts.get('sweet16')).toBe(8);
    expect(roundCounts.get('elite8')).toBe(4);
    expect(roundCounts.get('final4')).toBe(2);
    expect(roundCounts.get('championship')).toBe(1);
  });
});

// -----------------------------------------------------------------------
// Phase 10 — Cross-system consistency (API ↔ PHP)
// -----------------------------------------------------------------------

test.describe('MRM Integration — API to PHP Consistency', () => {
  test('API band count matches PHP bracket R1 entries', async ({ page, request }, testInfo) => {
    const tournamentId = await getActiveTournamentId(request);
    const groupsData = await (await request.get(
      `${PAYLOAD_BASE_URL}/api/modern-rock-madness-groups`
        + `?where[tournament][equals]=${tournamentId}&limit=100`,
    )).json();

    await navigateWithRetry(page, MRM_FRESH_URL);
    await expect(page.locator('mrm-bracket-match').first()).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator('mrm-bracket-match').first().locator('.band_abbr').first(),
    ).not.toHaveText('', { timeout: 5000 });

    const phpBandCount = await page.evaluate(() => {
      let count = 0;
      [1, 2, 3, 4].forEach((region) => {
        const matches = document.querySelectorAll(`#region_${region} mrm-bracket-match`);
        Array.from(matches).slice(0, 8).forEach((m) => {
          count += Array.from(m.querySelectorAll('.band_abbr'))
            .filter((el) => el.textContent !== 'TBD' && (el.textContent?.length ?? 0) > 0).length;
        });
      });
      return count;
    });

    expect(groupsData.totalDocs).toBe(64);
    expect(phpBandCount).toBe(64);
    await captureScreenshot(page, testInfo, '24-Integration-BandCount');
  });

  test('API match 1 data matches PHP match card and bracket', async ({ page, request }) => {
    const tournamentId = await getActiveTournamentId(request);
    const apiMatch = (await (await request.get(
      `${PAYLOAD_BASE_URL}/api/modern-rock-madness-matches`
        + `?where[tournament][equals]=${tournamentId}`
        + '&where[matchNumber][equals]=1&limit=1&depth=1',
    )).json()).docs[0];

    await navigateWithRetry(page, MRM_FRESH_URL);
    const matchCard = page.locator('mrm-match-card');
    await expect(matchCard).toBeVisible({ timeout: 10000 });

    // Match card full names match API
    if (typeof apiMatch.band1 === 'object') {
      expect(await matchCard.getAttribute('band1-name')).toBe(apiMatch.band1.name);
    }
    if (typeof apiMatch.band2 === 'object') {
      expect(await matchCard.getAttribute('band2-name')).toBe(apiMatch.band2.name);
    }

    // Bracket abbreviations match API
    await expect(
      page.locator('mrm-bracket-match').first().locator('.band_abbr').first(),
    ).not.toHaveText('', { timeout: 5000 });
    const phpAbbrs = await page
      .locator('#region_1 mrm-bracket-match').first()
      .locator('.band_abbr').allTextContents();
    if (typeof apiMatch.band1 === 'object') {
      expect(phpAbbrs).toContain(apiMatch.band1.abbreviation);
    }
    if (typeof apiMatch.band2 === 'object') {
      expect(phpAbbrs).toContain(apiMatch.band2.abbreviation);
    }

    // Match card status matches running state
    expect(await matchCard.getAttribute('status')).toBe('running');
  });

  test('API match count equals PHP bracket match count', async ({ page, request }, testInfo) => {
    const tournamentId = await getActiveTournamentId(request);
    const matchesData = await (await request.get(
      `${PAYLOAD_BASE_URL}/api/modern-rock-madness-matches`
        + `?where[tournament][equals]=${tournamentId}&limit=1`,
    )).json();

    await navigateWithRetry(page, MRM_FRESH_URL);
    await expect(page.locator('mrm-bracket-match').first()).toBeVisible({ timeout: 10000 });
    const phpMatchCount = await page.locator('mrm-bracket-match').count();

    expect(matchesData.totalDocs).toBe(63);
    expect(phpMatchCount).toBe(63);
    await captureScreenshot(page, testInfo, '25-Integration-MatchCount');
  });

  test('PHP page has no errors loading Payload data', async ({ page }) => {
    await navigateWithRetry(page, MRM_FRESH_URL);
    expect(checkForPhpErrors(await page.content())).toHaveLength(0);

    const content = await page.content();
    expect(content).not.toContain('Connection refused');
    expect(content).not.toContain('could not connect');
    expect(content).not.toContain('PDOException');
  });

  test('all 64 API abbreviations appear in PHP bracket', async ({ page, request }) => {
    const tournamentId = await getActiveTournamentId(request);
    const groupsData = await (await request.get(
      `${PAYLOAD_BASE_URL}/api/modern-rock-madness-groups`
        + `?where[tournament][equals]=${tournamentId}&limit=100&sort=placement`,
    )).json();

    const apiAbbrs = new Set<string>(
      groupsData.docs.map((g: { abbreviation: string }) => g.abbreviation),
    );
    expect(apiAbbrs.size).toBe(64);

    await navigateWithRetry(page, MRM_FRESH_URL);
    await expect(page.locator('mrm-bracket-match').first()).toBeVisible({ timeout: 10000 });
    await expect(
      page.locator('mrm-bracket-match').first().locator('.band_abbr').first(),
    ).not.toHaveText('', { timeout: 5000 });

    const phpAbbrs: string[] = await page.evaluate(() => {
      const abbrs = new Set<string>();
      [1, 2, 3, 4].forEach((region) => {
        Array.from(document.querySelectorAll(`#region_${region} mrm-bracket-match`))
          .slice(0, 8).forEach((m) => {
            Array.from(m.querySelectorAll('.band_abbr')).forEach((el) => {
              const t = el.textContent ?? '';
              if (t !== 'TBD' && t.length > 0) abbrs.add(t);
            });
          });
      });
      return Array.from(abbrs);
    });

    apiAbbrs.forEach((abbr) => { expect(phpAbbrs).toContain(abbr); });
  });
});
