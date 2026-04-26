import { test, expect } from '@playwright/test';
import { checkForPhpErrors } from './utils/test-helpers';

/**
 * Regression coverage for front-page headline font sizes and line-break consistency
 * between the MySQL and Postgres story backends.
 *
 * Issue: Headline font sizes and wrapping differed between production (MySQL) and
 * dev (Postgres) because `.feature-box h3` had no explicit `font-size`, leaving it
 * to the browser's default `h3` rendering which varies across environments.
 *
 * Fix: `font-size: clamp(12px, 2.8vw, 14px)` is now set explicitly on `.feature-box h3`.
 *
 * These tests verify:
 *   - Both backends serve a front page with feature-box headlines
 *   - `.feature-box h3` computed font-size equals the expected value at desktop
 *   - The same font-size is applied consistently across MySQL and Postgres backends
 *   - Headlines scale correctly at mobile, tablet, and desktop viewport widths
 */

const LEGACY_BASE_URL = process.env.LEGACY_BASE_URL || 'http://localhost:8080';

async function gotoPhp(page: import('@playwright/test').Page, url: string) {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  return response?.status() ?? null;
}

/** Read the computed font-size (in px) of the first `.feature-box h3`. */
async function getHeadlineFontSizePx(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.querySelector('.feature-box h3');
    if (!el) return 0;
    return parseFloat(window.getComputedStyle(el).fontSize);
  });
}

test.describe('Front-page headline font sizes', () => {
  // ── Desktop (1280×800): font-size must be clamped to 14px ──────────────
  test.describe('desktop viewport (1280×800)', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('MySQL backend: feature-box h3 renders at 14px', async ({ page }) => {
      const status = await gotoPhp(page, `${LEGACY_BASE_URL}/`);
      expect(status).toBe(200);
      const errors = checkForPhpErrors(await page.content());
      expect(errors, `PHP errors on index.php: ${errors.join(', ')}`).toEqual([]);

      await expect(page.locator('.feature-box h3').first()).toBeVisible();
      const fontSize = await getHeadlineFontSizePx(page);
      // clamp(12px, 2.8vw, 14px) → 14px at 1280px viewport
      expect(fontSize).toBeCloseTo(14, 0);
    });

    test('Postgres backend: feature-box h3 renders at same 14px as MySQL', async ({ page }) => {
      const status = await gotoPhp(page, `${LEGACY_BASE_URL}/?ff=use_postgres_stories`);
      expect(status).toBe(200);
      const errors = checkForPhpErrors(await page.content());
      expect(errors, `PHP errors on index.php (Postgres): ${errors.join(', ')}`).toEqual([]);

      await expect(page.locator('.feature-box h3').first()).toBeVisible();
      const fontSize = await getHeadlineFontSizePx(page);
      expect(fontSize).toBeCloseTo(14, 0);
    });

    test('MySQL and Postgres backends produce the same headline font-size', async ({ page }) => {
      await gotoPhp(page, `${LEGACY_BASE_URL}/`);
      await expect(page.locator('.feature-box h3').first()).toBeVisible();
      const mysqlFontSize = await getHeadlineFontSizePx(page);

      await gotoPhp(page, `${LEGACY_BASE_URL}/?ff=use_postgres_stories`);
      await expect(page.locator('.feature-box h3').first()).toBeVisible();
      const postgresFontSize = await getHeadlineFontSizePx(page);

      expect(mysqlFontSize).toBe(postgresFontSize);
    });
  });

  // ── Tablet (768×1024): font-size must still be clamped to 14px ─────────
  test.describe('tablet viewport (768×1024)', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('feature-box h3 font-size is within expected range at tablet width', async ({ page }) => {
      const status = await gotoPhp(page, `${LEGACY_BASE_URL}/`);
      expect(status).toBe(200);
      await expect(page.locator('.feature-box h3').first()).toBeVisible();
      const fontSize = await getHeadlineFontSizePx(page);
      // clamp(12px, 2.8vw, 14px) → 2.8*768/100 = 21.5px → capped at 14px
      expect(fontSize).toBeCloseTo(14, 0);
    });
  });

  // ── Mobile (375×667): font-size must honour the 12px lower bound ────────
  test.describe('mobile viewport (375×667)', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('feature-box h3 font-size is at least 12px on mobile', async ({ page }) => {
      const status = await gotoPhp(page, `${LEGACY_BASE_URL}/`);
      expect(status).toBe(200);
      await expect(page.locator('.feature-box h3').first()).toBeVisible();
      const fontSize = await getHeadlineFontSizePx(page);
      // clamp(12px, 2.8vw, 14px) → 2.8*375/100 = 10.5px → floored at 12px
      expect(fontSize).toBeGreaterThanOrEqual(12);
      expect(fontSize).toBeLessThanOrEqual(14);
    });
  });

  // ── Structure sanity ─────────────────────────────────────────────────────
  test('front page has at least one feature-box headline on both backends', async ({ page }) => {
    // MySQL
    await gotoPhp(page, `${LEGACY_BASE_URL}/`);
    await expect(page.locator('.feature-box h3').first()).toBeVisible();
    const mysqlCount = await page.locator('.feature-box h3').count();
    expect(mysqlCount).toBeGreaterThan(0);

    // Postgres
    await gotoPhp(page, `${LEGACY_BASE_URL}/?ff=use_postgres_stories`);
    await expect(page.locator('.feature-box h3').first()).toBeVisible();
    const postgresCount = await page.locator('.feature-box h3').count();
    expect(postgresCount).toBeGreaterThan(0);
  });
});
