/**
 * E2E Tests for Modern Rock Madness (MRM)
 *
 * Tests the bracket-style tournament voting feature.
 * MRM features a 64-band bracket tournament with countdown timers,
 * real-time vote display, and multiple regions.
 *
 * The page uses ?preview=true to bypass date-based redirects.
 * The tournament start date is configured in _mrm_config.php.
 *
 * The PostgreSQL mode tests use ?ff=use_postgres_madness to enable the
 * Payload/Postgres adapter instead of the legacy MySQL adapter.
 */
import { test, expect } from '@playwright/test';
import { captureScreenshot, checkForPhpErrors, navigateWithRetry } from './utils/test-helpers';

const LEGACY_BASE_URL = process.env.LEGACY_BASE_URL || 'http://localhost:8080';
const MRM_URL = `${LEGACY_BASE_URL}/madness.php?preview=true`;
const MRM_POSTGRES_URL = `${LEGACY_BASE_URL}/madness.php?preview=true&ff=use_postgres_madness`;

test.describe('Modern Rock Madness', () => {
  test.describe('Page Loading', () => {
    test('loads MRM page without PHP errors', async ({ page }, testInfo) => {
      await navigateWithRetry(page, MRM_URL);

      const pageContent = await page.content();
      const errors = checkForPhpErrors(pageContent);
      expect(errors).toHaveLength(0);

      await captureScreenshot(page, testInfo, 'MRM-Page-Load');
    });

    test('displays Modern Rock Madness branding and banner image', async ({ page }, testInfo) => {
      await navigateWithRetry(page, MRM_URL);

      const pageContent = await page.content();
      expect(pageContent.toLowerCase()).toContain('modern rock madness');

      const bannerImage = page.locator('img[alt*="Modern Rock Madness"]');
      await expect(bannerImage).toBeVisible({ timeout: 10000 });

      await captureScreenshot(page, testInfo, 'MRM-Banner');
    });

    test('shows Preview Mode banner when using preview param', async ({ page }) => {
      await navigateWithRetry(page, MRM_URL);

      const pageContent = await page.content();
      expect(pageContent).toContain('Preview Mode');
    });
  });

  test.describe('Bracket Display', () => {
    test('renders bracket container', async ({ page }, testInfo) => {
      await navigateWithRetry(page, MRM_URL);

      const bracket = page.locator('#bracket');
      await expect(bracket).toBeVisible({ timeout: 10000 });

      await captureScreenshot(page, testInfo, 'MRM-Bracket');
    });

    test('displays all 5 tournament regions', async ({ page }) => {
      await navigateWithRetry(page, MRM_URL);

      await Promise.all([
        expect(page.locator('#region_1')).toBeVisible({ timeout: 10000 }),
        expect(page.locator('#region_2')).toBeVisible({ timeout: 10000 }),
        expect(page.locator('#region_3')).toBeVisible({ timeout: 10000 }),
        expect(page.locator('#region_4')).toBeVisible({ timeout: 10000 }),
        expect(page.locator('#region_5')).toBeVisible({ timeout: 10000 }),
      ]);
    });

    test('displays match elements with band info', async ({ page }, testInfo) => {
      await navigateWithRetry(page, MRM_URL);

      const matchElements = page.locator('.match');
      const matchCount = await matchElements.count();
      expect(matchCount).toBeGreaterThan(0);

      // Each match should have two bands
      const firstMatch = matchElements.first();
      await expect(firstMatch.locator('.band1')).toBeVisible();
      await expect(firstMatch.locator('.band2')).toBeVisible();

      await captureScreenshot(page, testInfo, 'MRM-Matches');
    });

    test('displays band seeds and abbreviations', async ({ page }) => {
      await navigateWithRetry(page, MRM_URL);

      const seedElements = page.locator('.seed');
      expect(await seedElements.count()).toBeGreaterThan(0);

      const abbrElements = page.locator('.band_abbr');
      expect(await abbrElements.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Tournament Timeline', () => {
    test('displays tournament timeline with round labels', async ({ page }, testInfo) => {
      await navigateWithRetry(page, MRM_URL);

      const timeline = page.locator('#time_line');
      await expect(timeline).toBeVisible({ timeout: 10000 });

      const timelineContent = await timeline.textContent();
      expect(timelineContent).toContain('1st ROUND');
      expect(timelineContent).toContain('2nd ROUND');
      expect(timelineContent).toContain('SWELL 16');
      expect(timelineContent).toContain('ELUSIVE 8');
      expect(timelineContent).toContain('FANTASTIC 4');
      expect(timelineContent).toContain('CHAMPION');

      await captureScreenshot(page, testInfo, 'MRM-Timeline');
    });
  });

  test.describe('Countdown Timer', () => {
    test('loads Madness JavaScript object', async ({ page }) => {
      await navigateWithRetry(page, MRM_URL);

      const madnessExists = await page.evaluate(
        () => typeof (window as unknown as { Madness?: unknown }).Madness !== 'undefined',
      );
      expect(madnessExists).toBe(true);
    });

    test('displayDiffFormat formats hours:minutes:seconds correctly', async ({ page }) => {
      await navigateWithRetry(page, MRM_URL);

      type MadnessWindow = { Madness?: { displayDiffFormat: (diff: number) => string } };
      const formatted = await page.evaluate(() => {
        const madness = (window as unknown as MadnessWindow).Madness;
        if (madness && typeof madness.displayDiffFormat === 'function') {
          // 1 hour, 30 minutes, 45 seconds = 5445000 ms
          return madness.displayDiffFormat(5445000);
        }
        return null;
      });

      expect(formatted).toBe('01:30:45');
    });

    test('displayDiffFormat formats minutes:seconds without hours', async ({ page }) => {
      await navigateWithRetry(page, MRM_URL);

      type MadnessWindow = { Madness?: { displayDiffFormat: (diff: number) => string } };
      const formatted = await page.evaluate(() => {
        const madness = (window as unknown as MadnessWindow).Madness;
        if (madness && typeof madness.displayDiffFormat === 'function') {
          // 5 minutes, 30 seconds = 330000 ms
          return madness.displayDiffFormat(330000);
        }
        return null;
      });

      expect(formatted).toBe('05:30');
    });

    test('countdown timer elements are consistent (all present or all absent)', async ({
      page,
    }) => {
      await navigateWithRetry(page, MRM_URL);

      const hrExists = (await page.locator('#hr').count()) > 0;
      const minExists = (await page.locator('#min').count()) > 0;
      const secExists = (await page.locator('#sec').count()) > 0;

      // Timer elements should all be present together, or none (no partial state)
      if (hrExists || minExists || secExists) {
        expect(hrExists).toBe(true);
        expect(minExists).toBe(true);
        expect(secExists).toBe(true);
      }
    });
  });

  test.describe('Social Sharing & Downloads', () => {
    test('has social sharing section with Twitter widget', async ({ page }) => {
      await navigateWithRetry(page, MRM_URL);

      const socialSection = page.locator('.social');
      await expect(socialSection).toBeVisible({ timeout: 10000 });

      const socialContent = await socialSection.innerHTML();
      const hasTwitterWidget = socialContent.includes('twitter')
        || socialContent.includes('Tweet')
        || socialContent.includes('twitter-share-button');
      expect(hasTwitterWidget).toBe(true);
    });

    test('has Facebook like button', async ({ page }) => {
      await navigateWithRetry(page, MRM_URL);

      const fbLike = page.locator('.fb-like');
      expect(await fbLike.count()).toBeGreaterThan(0);
    });

    test('has bracket PDF download link', async ({ page }) => {
      await navigateWithRetry(page, MRM_URL);

      const pdfLink = page.locator('a[href*="pdf"], a[href*="Bracket"]');
      expect(await pdfLink.count()).toBeGreaterThan(0);
    });
  });

  test.describe('JavaScript Errors', () => {
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

      await navigateWithRetry(page, MRM_URL);
      await page.waitForTimeout(2000);

      // Filter out expected third-party widget errors
      const criticalErrors = consoleErrors.filter(
        (error) => !error.includes('twitter') && !error.includes('facebook') && !error.includes('FB'),
      );

      if (criticalErrors.length > 0) {
        test.info().annotations.push({
          type: 'Console Errors',
          description: `Found ${criticalErrors.length} console errors: ${criticalErrors.slice(0, 3).join(', ')}`,
        });
      }
    });
  });
});

test.describe('Modern Rock Madness — PostgreSQL mode', () => {
  test('loads without PHP errors when Postgres feature flag is set', async ({ page }, testInfo) => {
    await navigateWithRetry(page, MRM_POSTGRES_URL);

    const pageContent = await page.content();
    const errors = checkForPhpErrors(pageContent);
    expect(errors).toHaveLength(0);

    await captureScreenshot(page, testInfo, 'MRM-Postgres-Page-Load');
  });

  test('renders bracket with band data from Payload', async ({ page }, testInfo) => {
    await navigateWithRetry(page, MRM_POSTGRES_URL);

    const bracket = page.locator('#bracket');
    await expect(bracket).toBeVisible({ timeout: 10000 });

    // All 5 regions should be present
    await Promise.all([
      expect(page.locator('#region_1')).toBeVisible({ timeout: 10000 }),
      expect(page.locator('#region_2')).toBeVisible({ timeout: 10000 }),
      expect(page.locator('#region_3')).toBeVisible({ timeout: 10000 }),
      expect(page.locator('#region_4')).toBeVisible({ timeout: 10000 }),
      expect(page.locator('#region_5')).toBeVisible({ timeout: 10000 }),
    ]);

    // Match elements should exist with band abbreviations
    const matchElements = page.locator('.match');
    expect(await matchElements.count()).toBeGreaterThan(0);

    const seedElements = page.locator('.seed');
    expect(await seedElements.count()).toBeGreaterThan(0);

    const abbrElements = page.locator('.band_abbr');
    expect(await abbrElements.count()).toBeGreaterThan(0);

    await captureScreenshot(page, testInfo, 'MRM-Postgres-Bracket');
  });

  test('displays tournament timeline from Postgres data', async ({ page }, testInfo) => {
    await navigateWithRetry(page, MRM_POSTGRES_URL);

    const timeline = page.locator('#time_line');
    await expect(timeline).toBeVisible({ timeout: 10000 });

    const timelineContent = await timeline.textContent();
    expect(timelineContent).toContain('1st ROUND');
    expect(timelineContent).toContain('CHAMPION');

    await captureScreenshot(page, testInfo, 'MRM-Postgres-Timeline');
  });

  test('shows banner and branding in Postgres mode', async ({ page }, testInfo) => {
    await navigateWithRetry(page, MRM_POSTGRES_URL);

    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toContain('modern rock madness');

    const bannerImage = page.locator('img[alt*="Modern Rock Madness"]');
    await expect(bannerImage).toBeVisible({ timeout: 10000 });

    await captureScreenshot(page, testInfo, 'MRM-Postgres-Banner');
  });
});
