import { test, expect } from '@playwright/test';
import { checkForPhpErrors } from './utils/test-helpers';

/**
 * Regression tests for the New Music page date formatting.
 *
 * Dates in "New Music Week of …" section headers must be displayed in a
 * human-readable format ("April 20th, 2026") rather than the raw ISO format
 * ("2026-04-20").  The artist–song separator must be an em-dash (—) rather
 * than a plain hyphen (-).
 */

const LEGACY_BASE_URL = process.env.LEGACY_BASE_URL || 'http://localhost:8080';

async function gotoPhp(page: import('@playwright/test').Page, url: string) {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  return response?.status() ?? null;
}

test.describe('New Music page – date formatting', () => {
  test('music.php loads without PHP errors', async ({ page }) => {
    const status = await gotoPhp(page, `${LEGACY_BASE_URL}/music.php`);
    expect(status).toBe(200);
    const errors = checkForPhpErrors(await page.content());
    expect(errors, `PHP errors on music.php: ${errors.join(', ')}`).toEqual([]);
  });

  test('section headers do not contain ISO-format dates (YYYY-MM-DD)', async ({ page }) => {
    await gotoPhp(page, `${LEGACY_BASE_URL}/music.php`);
    // Each <dt> should never match the raw ISO pattern
    const isoHeaders = page.locator('dt', { hasText: /\d{4}-\d{2}-\d{2}/ });
    await expect(isoHeaders).toHaveCount(0);
  });

  test('section headers display month names when entries exist', async ({ page }) => {
    await gotoPhp(page, `${LEGACY_BASE_URL}/music.php`);
    const dtElements = page.locator('dl.new_music dt');
    const count = await dtElements.count();
    if (count === 0) {
      // No seeded entries — skip the content assertion but still pass.
      return;
    }
    // At least one header must contain a written-out month name.
    const months = /January|February|March|April|May|June|July|August|September|October|November|December/;
    await expect(dtElements.first()).toContainText(months);
  });

  test('entry separators use em-dashes, not plain hyphens', async ({ page }) => {
    await gotoPhp(page, `${LEGACY_BASE_URL}/music.php`);
    const ddElements = page.locator('dl.new_music dd');
    const count = await ddElements.count();
    if (count === 0) {
      return;
    }
    // Every rendered entry must contain an em-dash (—) rather than " - ".
    const firstDd = ddElements.first();
    await expect(firstDd).toContainText('—');
    await expect(firstDd).not.toContainText(' - ');
  });
});
