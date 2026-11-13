/**
 * Year End Poll E2E Tests
 *
 * yearendpoll.php renders the open (or most recent closed) Year End Poll from
 * Payload. These tests seed a poll dated year 2100 through the Payload REST
 * API so it outranks any real poll, then delete it afterwards.
 *
 * Voting itself needs an Auth0 login, which E2E can't do; the ballot write
 * path is covered by src/tests/Models/PostgresYearEndPollTest.php.
 */
import {
  test, expect, request, APIRequestContext,
} from '@playwright/test';
import { checkForPhpErrors, captureScreenshot, navigateWithRetry } from './utils/test-helpers';

const LEGACY_BASE_URL = process.env.LEGACY_BASE_URL || 'http://localhost:8080';
const PAYLOAD_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const POLL_URL = `${LEGACY_BASE_URL}/yearendpoll.php`;

let api: APIRequestContext;
let pollId: number;
let categoryId: number;

const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 3_600_000).toISOString();

async function createDoc(collection: string, data: Record<string, unknown>): Promise<number> {
  const res = await api.post(`/api/${collection}`, { data });
  expect(res.ok(), `create ${collection}: ${await res.text()}`).toBeTruthy();
  return (await res.json()).doc.id;
}

test.describe('Year End Poll', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    const login = await request.newContext({ baseURL: PAYLOAD_BASE_URL });
    const credentials = {
      email: process.env.PAYLOAD_DEV_EMAIL || 'admin@ynotradio.net',
      password: process.env.PAYLOAD_DEV_PASSWORD || 'password',
    };
    let res = await login.post('/api/users/login', { data: credentials });
    if (!res.ok()) {
      res = await login.post('/api/users/first-register', { data: credentials });
    }
    expect(res.ok(), `Payload login: ${await res.text()}`).toBeTruthy();
    const { token } = await res.json();
    await login.dispose();

    api = await request.newContext({
      baseURL: PAYLOAD_BASE_URL,
      extraHTTPHeaders: { Authorization: `JWT ${token}` },
    });

    pollId = await createDoc('year-end-polls', {
      name: 'E2E Year End Poll',
      year: 2100,
      slug: `e2e-yep-${Date.now()}`,
      status: 'open',
      votingOpensAt: hoursFromNow(-1),
      votingClosesAt: hoursFromNow(24),
      introHtml: '<p id="e2e-intro">Vote for your favorites of the year!</p>',
      closedHtml: '<p id="e2e-closed">Voting is closed. Thanks!</p>',
    });
    categoryId = await createDoc('year-end-poll-categories', {
      poll: pollId,
      slug: 'e2e-songs',
      displayName: 'E2E Songs',
      categoryType: 'custom',
      maxPicks: 2,
      requiredForContest: true,
      bulkNominees: "The War On Drugs - Who's That\nBeck - Run Away\nBlondshell - Violins",
    });
  });

  test.afterAll(async () => {
    if (categoryId) await api.delete(`/api/year-end-poll-categories/${categoryId}`);
    if (pollId) await api.delete(`/api/year-end-polls/${pollId}`);
    await api?.dispose();
  });

  test('open poll shows its Payload copy and asks visitors to log in', async ({
    page,
  }, testInfo) => {
    const { status } = await navigateWithRetry(page, POLL_URL);
    expect(status).toBe(200);
    expect(checkForPhpErrors(await page.content())).toHaveLength(0);

    await expect(page.getByRole('heading', { name: 'E2E Year End Poll', level: 1 })).toBeVisible();
    await expect(page.locator('#e2e-intro')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Log in to Vote' })).toHaveAttribute(
      'href',
      'auth_login.php?returnTo=/yearendpoll.php',
    );
    await expect(page.locator('input[name="year_end_votes[]"]')).toHaveCount(0);

    await captureScreenshot(page, testInfo, 'yep-open-logged-out');
  });

  test('anonymous vote submissions are ignored', async ({ page }) => {
    await navigateWithRetry(page, POLL_URL);
    const res = await page.request.post(POLL_URL, {
      form: { poll: 'e2e-songs', 'year_end_votes[]': 'anything' },
    });
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(checkForPhpErrors(body)).toHaveLength(0);
    expect(body).not.toContain('Your votes have been recorded');
  });

  test('closed poll shows the closed copy instead of the ballot', async ({ page }, testInfo) => {
    const res = await api.patch(`/api/year-end-polls/${pollId}`, {
      data: { votingClosesAt: hoursFromNow(-0.5) },
    });
    expect(res.ok()).toBeTruthy();

    await navigateWithRetry(page, POLL_URL);
    await expect(page.locator('#e2e-closed')).toBeVisible();
    await expect(page.locator('#e2e-intro')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Log in to Vote' })).toHaveCount(0);

    await captureScreenshot(page, testInfo, 'yep-closed');
  });
});
