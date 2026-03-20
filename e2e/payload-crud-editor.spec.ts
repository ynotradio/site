/**
 * Payload CMS CRUD E2E Tests — Editor Role
 *
 * Verifies that an editor user can create and edit records across all
 * main Payload collections, and that delete is restricted to admins.
 *
 * Prerequisites:
 *   - Payload running on PLAYWRIGHT_BASE_URL (default http://localhost:3000)
 *   - seed-mrm-fresh has run (creates admin user)
 *   - payload-crud-admin.spec.ts (or beforeAll here) ensures the editor
 *     user exists before these tests run
 *
 * Authentication is handled inline — no setup project required.
 */

import { test as baseTest } from '@playwright/test';
import { captureScreenshot, generateUniqueId, getFutureDate } from './utils/test-helpers';
import {
  navigateToPayloadCollectionCreate,
  fillPayloadTextField,
  fillPayloadSlugField,
  clickPayloadSave,
  clickPayloadPublish,
  waitForPayloadSave,
  generateSlug,
} from './utils/payload-helpers';
import {
  EDITOR_EMAIL,
  EDITOR_PASSWORD,
  getAdminJwt,
  getStorageState,
  ensureEditorUser,
  deleteDocViaApi,
  assertDeleteNotAccessible,
  fillDateFieldDirect,
  extractDocId,
} from './utils/payload-crud-helpers';

/* eslint-disable no-empty-pattern, react-hooks/rules-of-hooks */
const test = baseTest.extend({
  storageState: async ({}, use) => {
    await use(await getStorageState(EDITOR_EMAIL, EDITOR_PASSWORD));
  },
});
/* eslint-enable no-empty-pattern, react-hooks/rules-of-hooks */

test.describe('Payload CRUD — Editor Role', () => {
  test.beforeAll(async () => {
    const jwt = await getAdminJwt();
    await ensureEditorUser(jwt);
  });

  // ── People ────────────────────────────────────────────────────────────────

  test('People: editor can create, edit, and is denied delete', async ({ page }, testInfo) => {
    const uid = generateUniqueId();
    const name = `E2E Editor Person ${uid}`;
    let docId: string | undefined;

    await test.step('Create', async () => {
      await navigateToPayloadCollectionCreate(page, 'people');
      await fillPayloadTextField(page, 'field-name', name);
      await fillPayloadSlugField(page, generateSlug(name));
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'people');
      docId = extractDocId(page.url());
      await captureScreenshot(page, testInfo, 'Editor-People-01-Created');
    });

    await test.step('Edit', async () => {
      await fillPayloadTextField(page, 'field-name', `${name} (edited)`);
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'people');
    });

    await test.step('Delete is not accessible', async () => {
      await assertDeleteNotAccessible(page);
      await captureScreenshot(page, testInfo, 'Editor-People-02-NoDelete');
    });

    await test.step('Cleanup', async () => {
      if (docId) await deleteDocViaApi('people', docId, await getAdminJwt());
    });
  });

  // ── Artists ───────────────────────────────────────────────────────────────

  test('Artists: editor can create, edit, and is denied delete', async ({ page }, testInfo) => {
    const uid = generateUniqueId();
    const name = `E2E Editor Artist ${uid}`;
    let docId: string | undefined;

    await test.step('Create', async () => {
      await navigateToPayloadCollectionCreate(page, 'artists');
      await fillPayloadTextField(page, 'field-name', name);
      await fillPayloadSlugField(page, generateSlug(name));
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'artists');
      docId = extractDocId(page.url());
    });

    await test.step('Edit', async () => {
      await fillPayloadTextField(page, 'field-website', 'https://example.com');
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'artists');
    });

    await test.step('Delete is not accessible', async () => {
      await assertDeleteNotAccessible(page);
      await captureScreenshot(page, testInfo, 'Editor-Artists-01-NoDelete');
    });

    await test.step('Cleanup', async () => {
      if (docId) await deleteDocViaApi('artists', docId, await getAdminJwt());
    });
  });

  // ── Venues ────────────────────────────────────────────────────────────────

  test('Venues: editor can create, edit, and is denied delete', async ({ page }, testInfo) => {
    const uid = generateUniqueId();
    const name = `E2E Editor Venue ${uid}`;
    let docId: string | undefined;

    await test.step('Create', async () => {
      await navigateToPayloadCollectionCreate(page, 'venues');
      await fillPayloadTextField(page, 'field-name', name);
      await fillPayloadSlugField(page, generateSlug(name));
      await fillPayloadTextField(page, 'field-city', 'Test City');
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'venues');
      docId = extractDocId(page.url());
    });

    await test.step('Edit', async () => {
      await fillPayloadTextField(page, 'field-city', 'Updated City');
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'venues');
    });

    await test.step('Delete is not accessible', async () => {
      await assertDeleteNotAccessible(page);
      await captureScreenshot(page, testInfo, 'Editor-Venues-01-NoDelete');
    });

    await test.step('Cleanup', async () => {
      if (docId) await deleteDocViaApi('venues', docId, await getAdminJwt());
    });
  });

  // ── Posts ─────────────────────────────────────────────────────────────────

  test('Posts: editor can create, publish, edit, and is denied delete', async ({
    page,
  }, testInfo) => {
    const uid = generateUniqueId();
    const headline = `E2E Editor Story ${uid}`;
    let docId: string | undefined;

    await test.step('Create and publish', async () => {
      await navigateToPayloadCollectionCreate(page, 'posts');
      await fillPayloadTextField(page, 'field-headline', headline);
      await fillDateFieldDirect(page, 'field-startDate', new Date());
      await clickPayloadPublish(page, 'posts');
      docId = extractDocId(page.url());
      await captureScreenshot(page, testInfo, 'Editor-Posts-01-Published');
    });

    await test.step('Edit', async () => {
      await fillPayloadTextField(page, 'field-headline', `${headline} (edited)`);
      await clickPayloadPublish(page, 'posts');
    });

    await test.step('Delete is not accessible', async () => {
      await assertDeleteNotAccessible(page);
    });

    await test.step('Cleanup', async () => {
      if (docId) await deleteDocViaApi('posts', docId, await getAdminJwt());
    });
  });

  // ── Ads ───────────────────────────────────────────────────────────────────

  test('Ads: editor can create, publish, edit, and is denied delete', async ({
    page,
  }, testInfo) => {
    const uid = generateUniqueId();
    const name = `E2E Editor Ad ${uid}`;
    let docId: string | undefined;

    await test.step('Create and publish', async () => {
      await navigateToPayloadCollectionCreate(page, 'ads');
      await fillPayloadTextField(page, 'field-name', name);
      await fillDateFieldDirect(page, 'field-startDate', new Date());
      await fillDateFieldDirect(page, 'field-endDate', getFutureDate(30));
      await clickPayloadPublish(page, 'ads');
      docId = extractDocId(page.url());
      await captureScreenshot(page, testInfo, 'Editor-Ads-01-Published');
    });

    await test.step('Edit', async () => {
      await fillPayloadTextField(page, 'field-webUrl', 'https://test.example.com');
      await clickPayloadPublish(page, 'ads');
    });

    await test.step('Delete is not accessible', async () => {
      await assertDeleteNotAccessible(page);
    });

    await test.step('Cleanup', async () => {
      if (docId) await deleteDocViaApi('ads', docId, await getAdminJwt());
    });
  });

  // ── Shows ─────────────────────────────────────────────────────────────────

  test('Shows: editor can create, edit, and is denied delete', async ({ page }, testInfo) => {
    const uid = generateUniqueId();
    let docId: string | undefined;

    await test.step('Create', async () => {
      await navigateToPayloadCollectionCreate(page, 'shows');
      await fillDateFieldDirect(page, 'field-date', getFutureDate(14));
      await fillPayloadTextField(page, 'field-startTime', '14:00');
      await fillPayloadTextField(page, 'field-endTime', '18:00');
      await fillPayloadTextField(page, 'field-name', `E2E Editor Show ${uid}`);
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'shows');
      docId = extractDocId(page.url());
    });

    await test.step('Edit', async () => {
      await fillPayloadTextField(page, 'field-name', `E2E Editor Show ${uid} (edited)`);
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'shows');
    });

    await test.step('Delete is not accessible', async () => {
      await assertDeleteNotAccessible(page);
      await captureScreenshot(page, testInfo, 'Editor-Shows-01-NoDelete');
    });

    await test.step('Cleanup', async () => {
      if (docId) await deleteDocViaApi('shows', docId, await getAdminJwt());
    });
  });

  // ── Songs ─────────────────────────────────────────────────────────────────

  test('Songs: editor can create, edit, and is denied delete', async ({ page }) => {
    const uid = generateUniqueId();
    const title = `E2E Editor Song ${uid}`;
    let docId: string | undefined;

    await test.step('Create', async () => {
      await navigateToPayloadCollectionCreate(page, 'songs');
      await fillPayloadTextField(page, 'field-title', title);
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'songs');
      docId = extractDocId(page.url());
    });

    await test.step('Edit', async () => {
      await fillPayloadTextField(page, 'field-title', `${title} (edited)`);
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'songs');
    });

    await test.step('Delete is not accessible', async () => {
      await assertDeleteNotAccessible(page);
    });

    await test.step('Cleanup', async () => {
      if (docId) await deleteDocViaApi('songs', docId, await getAdminJwt());
    });
  });

  // ── On Demand ─────────────────────────────────────────────────────────────

  test('On Demand: editor can create, publish, edit, and is denied delete', async ({ page }) => {
    const uid = generateUniqueId();
    const headline = `E2E Editor OnDemand ${uid}`;
    let docId: string | undefined;

    await test.step('Create and publish', async () => {
      await navigateToPayloadCollectionCreate(page, 'ondemand');
      await fillDateFieldDirect(page, 'field-date', new Date());
      await fillPayloadTextField(page, 'field-headline', headline);
      await clickPayloadPublish(page, 'ondemand');
      docId = extractDocId(page.url());
    });

    await test.step('Edit', async () => {
      await fillPayloadTextField(page, 'field-headline', `${headline} (edited)`);
      await clickPayloadPublish(page, 'ondemand');
    });

    await test.step('Delete is not accessible', async () => {
      await assertDeleteNotAccessible(page);
    });

    await test.step('Cleanup', async () => {
      if (docId) await deleteDocViaApi('ondemand', docId, await getAdminJwt());
    });
  });
});
