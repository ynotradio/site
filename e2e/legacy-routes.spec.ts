import { test, expect } from '@playwright/test';
import { checkForPhpErrors } from './utils/test-helpers';

const LEGACY_BASE_URL = process.env.PLAYWRIGHT_LEGACY_URL || 'http://localhost:8080';

const ROUTES = [
  '/',
  '/aboutus',
  '/cdoftheweek',
  '/concerts',
  '/contact',
  '/contests',
  '/deejays',
  '/donate',
  '/mobile',
  '/music',
  '/ondemand',
  '/rodney',
  '/schedule',
  '/shows',
  '/top11',
  '/y100rocks',
  '/yearendstaffpicks',
  '/ymail',
];

test.describe('Legacy PHP routes', () => {
  ROUTES.forEach((route) => {
    test(`${route} renders without PHP errors or deprecations`, async ({ request }) => {
      const response = await request.get(`${LEGACY_BASE_URL}${route}`, { maxRedirects: 0 });

      expect(response.status()).toBe(200);
      expect(checkForPhpErrors(await response.text())).toHaveLength(0);
    });
  });

  test('unknown route returns 404', async ({ request }) => {
    const response = await request.get(`${LEGACY_BASE_URL}/does-not-exist`, { maxRedirects: 0 });

    expect(response.status()).toBe(404);
  });

  test('trailing slash redirects to the bare path', async ({ request }) => {
    const response = await request.get(`${LEGACY_BASE_URL}/schedule/`, { maxRedirects: 0 });

    expect(response.status()).toBe(301);
    expect(response.headers().location).toMatch(/\/schedule$/);
  });
});
