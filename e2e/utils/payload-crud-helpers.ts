/**
 * Shared utilities for Payload CRUD e2e tests
 *
 * Used by payload-crud-admin.spec.ts, payload-crud-admin-complex.spec.ts,
 * and payload-crud-editor.spec.ts.
 */

import { Page, expect } from '@playwright/test';
import { generateUniqueId } from './test-helpers';

export const PAYLOAD_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

export const ADMIN_EMAIL = process.env.PAYLOAD_DEV_EMAIL || 'admin@ynotradio.net';
export const ADMIN_PASSWORD = process.env.PAYLOAD_DEV_PASSWORD || 'password';

export const EDITOR_EMAIL = 'e2e-editor@test.invalid';
export const EDITOR_PASSWORD = 'E2eTest123!';

// ---------------------------------------------------------------------------
// REST API helpers
// ---------------------------------------------------------------------------

// Cache JWTs to avoid redundant login API calls across tests
const jwtCache = new Map<string, string>();

/** Get a JWT for any user, with per-email caching. */
export async function getJwt(email: string, password: string): Promise<string> {
  const cached = jwtCache.get(email);
  if (cached) return cached;

  const res = await fetch(`${PAYLOAD_BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${res.status}`);
  }
  const data = (await res.json()) as { token: string };
  jwtCache.set(email, data.token);
  return data.token;
}

export async function getAdminJwt(): Promise<string> {
  return getJwt(ADMIN_EMAIL, ADMIN_PASSWORD);
}

/**
 * Build a Playwright-compatible storageState with the payload-token cookie.
 * Use as the `storageState` fixture value to skip UI login entirely.
 */
export async function getStorageState(email: string, password: string) {
  const jwt = await getJwt(email, password);
  return {
    cookies: [
      {
        name: 'payload-token',
        value: jwt,
        domain: new URL(PAYLOAD_BASE_URL).hostname,
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax' as const,
        expires: -1,
      },
    ],
    origins: [],
  };
}

export async function ensureEditorUser(jwt: string): Promise<void> {
  const check = await fetch(
    `${PAYLOAD_BASE_URL}/api/users?where[email][equals]=${encodeURIComponent(EDITOR_EMAIL)}`,
    { headers: { Authorization: `JWT ${jwt}` } },
  );
  if (!check.ok) {
    throw new Error(`Failed to check for editor user: ${check.status}`);
  }
  const checkData = (await check.json()) as { totalDocs: number };
  if (checkData.totalDocs > 0) return;

  const res = await fetch(`${PAYLOAD_BASE_URL}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `JWT ${jwt}` },
    body: JSON.stringify({
      email: EDITOR_EMAIL,
      password: EDITOR_PASSWORD,
      role: 'editor',
      _verified: true,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create editor user: ${res.status} — ${body}`);
  }
}

export interface PrereqIds {
  artistId: string;
  venueId: string;
  recordId: string;
  personId: string;
}

export async function createPrereqData(jwt: string): Promise<PrereqIds> {
  const uid = generateUniqueId('prereq');

  const [personRes, artistRes, venueRes] = await Promise.all([
    fetch(`${PAYLOAD_BASE_URL}/api/people`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `JWT ${jwt}` },
      body: JSON.stringify({ name: `Prereq Person ${uid}`, slug: `prereq-person-${uid}` }),
    }),
    fetch(`${PAYLOAD_BASE_URL}/api/artists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `JWT ${jwt}` },
      body: JSON.stringify({ name: `Prereq Artist ${uid}`, slug: `prereq-artist-${uid}` }),
    }),
    fetch(`${PAYLOAD_BASE_URL}/api/venues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `JWT ${jwt}` },
      body: JSON.stringify({
        name: `Prereq Venue ${uid}`,
        slug: `prereq-venue-${uid}`,
        city: 'Test City',
      }),
    }),
  ]);

  const [personData, artistData, venueData] = await Promise.all([
    personRes.json() as Promise<{ doc: { id: string } }>,
    artistRes.json() as Promise<{ doc: { id: string } }>,
    venueRes.json() as Promise<{ doc: { id: string } }>,
  ]);

  const artistId = artistData.doc.id;

  const recordRes = await fetch(`${PAYLOAD_BASE_URL}/api/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `JWT ${jwt}` },
    body: JSON.stringify({
      title: `Prereq Album ${uid}`,
      slug: `prereq-album-${uid}`,
      artist: artistId,
    }),
  });
  const recordData = (await recordRes.json()) as { doc: { id: string } };

  return {
    personId: personData.doc.id,
    artistId,
    venueId: venueData.doc.id,
    recordId: recordData.doc.id,
  };
}

export async function deleteDocViaApi(collection: string, id: string, jwt: string): Promise<void> {
  const res = await fetch(`${PAYLOAD_BASE_URL}/api/${collection}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `JWT ${jwt}` },
  });
  if (!res.ok && res.status !== 404) {
    // eslint-disable-next-line no-console
    console.warn(`cleanup: DELETE /${collection}/${id} returned ${res.status}`);
  }
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

/** Fill a date input directly with an ISO date string, bypassing the date picker. */
export async function fillDateFieldDirect(page: Page, fieldId: string, date: Date): Promise<void> {
  const isoDate = date.toISOString().slice(0, 10);
  const input = page.locator(`#${fieldId}`).getByRole('textbox');
  await input.fill(isoDate);
  await input.press('Enter');
}

/** Open the three-dot popup menu in the Payload document controls. */
export async function openDocumentActionsMenu(page: Page): Promise<void> {
  const dotsMenu = page.locator('.doc-controls__dots').first();
  await dotsMenu.waitFor({ state: 'visible', timeout: 10000 });
  await dotsMenu.click();
}

/** Delete the currently open document: opens popup menu → Delete → Confirm. */
export async function deleteCurrentDocument(page: Page): Promise<void> {
  await openDocumentActionsMenu(page);
  await page
    .getByRole('button', { name: /^delete$/i })
    .first()
    .click();
  await page
    .getByRole('button', { name: /confirm/i })
    .waitFor({ state: 'visible', timeout: 10000 });
  await page.getByRole('button', { name: /confirm/i }).click();
}

/** Assert that the delete option is absent in the document popup menu (editor role). */
export async function assertDeleteNotAccessible(page: Page): Promise<void> {
  await openDocumentActionsMenu(page);
  await expect(page.getByRole('button', { name: /^delete$/i })).not.toBeVisible({ timeout: 3000 });
  await page.keyboard.press('Escape');
}

/** Extract the document ID from the current page URL. */
export function extractDocId(url: string): string | undefined {
  return url.split('/').at(-1);
}
