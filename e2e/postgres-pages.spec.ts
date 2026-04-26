import { test, expect } from '@playwright/test';
import { checkForPhpErrors } from './utils/test-helpers';

/**
 * Regression coverage for the Postgres-backed PHP pages exercised in PR #584
 * (fix/postgres-readiness). These tests guard against the specific defects
 * we shipped fixes for so they cannot silently regress:
 *
 *   - PostgresOnDemand.php parse error from unescaped `order` in a SQL
 *     identifier (also used in paginated listings).
 *   - PostgresCdOfTheWeek.php "error loading" caused by an `_status IN
 *     ('published','draft')` filter that surfaced unmigrated drafts.
 *   - DJs page rendering stub names like "DJ #123" when the migrator
 *     left placeholder People rows.
 *
 * Pages are accessed via the `?ff=use_postgres_<name>` feature flag query
 * param, which sets a cookie consumed by `\FeatureFlags`.
 */

const LEGACY_BASE_URL = process.env.LEGACY_BASE_URL || 'http://localhost:8080';

// Use 'domcontentloaded' instead of 'networkidle' — ondemand pages embed
// audio players whose network requests never go idle.
async function gotoPhp(page: import('@playwright/test').Page, url: string) {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  return response?.status() ?? null;
}

const POSTGRES_PAGES = [
  { path: 'concerts.php', flag: 'use_postgres_concerts' },
  { path: 'cdoftheweek.php', flag: 'use_postgres_cdoftheweek' },
  { path: 'deejays.php', flag: 'use_postgres_deejays' },
  { path: 'ondemand.php', flag: 'use_postgres_ondemand' },
] as const;

test.describe('Postgres-backed PHP pages', () => {
  POSTGRES_PAGES.forEach(({ path, flag }) => {
    test(`${path} loads with no PHP errors`, async ({ page }) => {
      const url = `${LEGACY_BASE_URL}/${path}?ff=${flag}`;
      const status = await gotoPhp(page, url);
      expect(status).toBe(200);
      const errors = checkForPhpErrors(await page.content());
      expect(errors, `Found PHP errors on ${path}: ${errors.join(', ')}`).toEqual([]);
    });
  });

  // Regression: ondemand parse error was inside the paginated SQL, so we
  // exercise the first few pages explicitly.
  [1, 2, 3].forEach((pageNum) => {
    test(`ondemand.php page ${pageNum} renders without parse error`, async ({ page }) => {
      const url = `${LEGACY_BASE_URL}/ondemand.php?ff=use_postgres_ondemand&page=${pageNum}`;
      const status = await gotoPhp(page, url);
      expect(status).toBe(200);
      const content = await page.content();
      expect(content).not.toContain('Parse error');
      expect(content).not.toContain('syntax error');
    });
  });

  test('deejays.php does not render stub "DJ #N" placeholder names', async ({ page }) => {
    const url = `${LEGACY_BASE_URL}/deejays.php?ff=use_postgres_deejays`;
    const status = await gotoPhp(page, url);
    expect(status).toBe(200);
    const stubMatches = await page.locator('h2', { hasText: /^DJ #\d+$/ }).count();
    expect(stubMatches).toBe(0);
  });

  test('cdoftheweek.php main panel does not show "error loading" fallback', async ({ page }) => {
    const url = `${LEGACY_BASE_URL}/cdoftheweek.php?ff=use_postgres_cdoftheweek`;
    const status = await gotoPhp(page, url);
    expect(status).toBe(200);
    // Scope to the main panel (first .row) to avoid false matches in the
    // "see other reviews" archive section.
    const mainPanel = page.locator('.row').first();
    await expect(mainPanel).not.toContainText(/error loading the CD of the Week/i);
  });
});
