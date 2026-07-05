import { test, expect } from '@playwright/test';
import { checkForPhpErrors } from './utils/test-helpers';

/**
 * Regression coverage for front-page headline font sizes and line-break
 * consistency. Stories are served from Postgres (the front page no longer has a
 * MySQL backend), so these run against the plain `/` URL.
 *
 * Issue: `.feature-box h3` had no explicit `font-size`, leaving it to the
 * browser's default `h3` rendering which varied across environments.
 *
 * Fix: `font-size: clamp(12px, 2.8vw, 14px)` is now set explicitly on `.feature-box h3`.
 *
 * These tests verify:
 *   - The front page serves feature-box headlines
 *   - `.feature-box h3` computed font-size equals the expected value at desktop
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

    test('feature-box h3 renders at 14px', async ({ page }) => {
      const status = await gotoPhp(page, `${LEGACY_BASE_URL}/`);
      expect(status).toBe(200);
      const errors = checkForPhpErrors(await page.content());
      expect(errors, `PHP errors on index.php: ${errors.join(', ')}`).toEqual([]);

      await expect(page.locator('.feature-box h3').first()).toBeVisible();
      const fontSize = await getHeadlineFontSizePx(page);
      // clamp(12px, 2.8vw, 14px) → 14px at 1280px viewport
      expect(fontSize).toBeCloseTo(14, 0);
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
  test('front page has at least one feature-box headline', async ({ page }) => {
    await gotoPhp(page, `${LEGACY_BASE_URL}/`);
    await expect(page.locator('.feature-box h3').first()).toBeVisible();
    const count = await page.locator('.feature-box h3').count();
    expect(count).toBeGreaterThan(0);
  });
});

/**
 * Regression coverage for the front-page two-column story layout.
 *
 * History: PR #670 replaced the two-column DOM with a CSS Grid container,
 * which forced row-aligned heights on desktop (visual regression). PR #672
 * reverted that. This suite locks in the desired behaviour:
 *
 *  - Desktop (≥960px): two columns flow independently — at least one
 *    (left, right) pair of feature-boxes has DIFFERENT y-positions
 *    (would fail under a row-major CSS grid).
 *  - Mobile (≤959px): feature-boxes render in strict priority order,
 *    achieved via `display: contents` on the column wrappers + inline
 *    flex `order` on each `.feature-box`.
 */
test.describe('Front-page story layout', () => {
  type Box = { x: number; y: number; priority: number };

  async function getStoryBoxes(page: import('@playwright/test').Page): Promise<Box[]> {
    return page.evaluate(() => {
      const els = document.querySelectorAll('.stories-container .feature-box');
      return Array.from(els).map((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        return {
          x: Math.round(r.x),
          y: Math.round(r.y),
          priority: Number((el as HTMLElement).dataset.priority ?? '0'),
        };
      });
    });
  }

  const url = `${LEGACY_BASE_URL}/`;

  test.describe('desktop @ 1440×900 — independent column flow', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('feature-boxes form two columns whose heights are NOT row-aligned', async ({ page }) => {
      await gotoPhp(page, url);
      await expect(page.locator('.stories-container .feature-box').first()).toBeVisible();

      const boxes = await getStoryBoxes(page);
      expect(boxes.length).toBeGreaterThanOrEqual(2);

      // Exactly two distinct x-positions (two columns).
      const xs = [...new Set(boxes.map((b) => b.x))].sort((a, b) => a - b);
      expect(xs.length).toBe(2);

      // Independent column flow: at least one (left, right) pair must have
      // different y-positions. Under a row-major CSS grid (the PR #670
      // regression) every left/right pair would share a y. We assert that
      // the second left-column box and the second right-column box do NOT
      // share the same y — the column heights flow independently.
      const left = boxes.filter((b) => b.x === xs[0]).sort((a, b) => a.y - b.y);
      const right = boxes.filter((b) => b.x === xs[1]).sort((a, b) => a.y - b.y);
      expect(left.length).toBeGreaterThanOrEqual(2);
      expect(right.length).toBeGreaterThanOrEqual(2);
      expect(Math.abs(left[1].y - right[1].y)).toBeGreaterThan(5);
    });
  });

  test.describe('mobile @ 375×800 — strict priority order', () => {
    test.use({ viewport: { width: 375, height: 800 } });

    test('feature-boxes render top-to-bottom in ascending priority', async ({ page }) => {
      await gotoPhp(page, url);
      await expect(page.locator('.stories-container .feature-box').first()).toBeVisible();

      const boxes = await getStoryBoxes(page);
      expect(boxes.length).toBeGreaterThanOrEqual(2);

      // All in a single column on mobile.
      const xs = [...new Set(boxes.map((b) => b.x))];
      expect(xs.length).toBe(1);

      // Sorted by visual y-position, priorities must be strictly ascending.
      const visualOrder = [...boxes].sort((a, b) => a.y - b.y).map((b) => b.priority);
      const sortedAsc = [...visualOrder].sort((a, b) => a - b);
      expect(visualOrder).toEqual(sortedAsc);
    });
  });
});
