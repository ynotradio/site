/**
 * Payload CMS CRUD — Admin Role (Simple Collections)
 *
 * Tests People, Artists, Venues, Shows, Posts, Ads, On Demand, Songs, Users.
 * Full create → edit → delete cycle run as the admin user.
 * Authentication is handled inline — no setup project required.
 */

import { test as baseTest, expect } from '@playwright/test';
import { captureScreenshot, generateUniqueId, getFutureDate } from './utils/test-helpers';
import {
  navigateToPayloadCollection,
  navigateToPayloadCollectionCreate,
  fillPayloadTextField,
  fillPayloadSlugField,
  clickPayloadSave,
  clickPayloadPublish,
  waitForPayloadSave,
  generateSlug,
} from './utils/payload-helpers';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  EDITOR_EMAIL,
  EDITOR_PASSWORD,
  getAdminJwt,
  getStorageState,
  ensureEditorUser,
  deleteCurrentDocument,
  fillDateFieldDirect,
} from './utils/payload-crud-helpers';

/* eslint-disable no-empty-pattern, react-hooks/rules-of-hooks */
const test = baseTest.extend({
  storageState: async ({}, use) => {
    await use(await getStorageState(ADMIN_EMAIL, ADMIN_PASSWORD));
  },
});
/* eslint-enable no-empty-pattern, react-hooks/rules-of-hooks */

test.describe('Payload Admin CRUD — Admin Role (Simple Collections)', () => {
  test.beforeAll(async () => {
    const jwt = await getAdminJwt();
    await ensureEditorUser(jwt);
  });

  test('People: create, edit, and delete', async ({ page }, testInfo) => {
    const uid = generateUniqueId();
    const name = `E2E Person ${uid}`;
    await test.step('Create', async () => {
      await navigateToPayloadCollectionCreate(page, 'people');
      await fillPayloadTextField(page, 'field-name', name);
      await fillPayloadSlugField(page, generateSlug(name));
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'people');
      await captureScreenshot(page, testInfo, 'Admin-People-01-Created');
    });
    await test.step('Edit', async () => {
      await fillPayloadTextField(page, 'field-name', `${name} (edited)`);
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'people');
    });
    await test.step('Verify in list', async () => {
      await navigateToPayloadCollection(page, 'people');
      await expect(page.getByText(`${name} (edited)`)).toBeVisible({ timeout: 10000 });
    });
    await test.step('Delete', async () => {
      await page.getByText(`${name} (edited)`).click();
      await page.waitForURL('**/people/**', { timeout: 15000 });
      await deleteCurrentDocument(page);
      await page.waitForURL('**/collections/people', { timeout: 15000 });
    });
  });

  test('Artists: create, edit, and delete', async ({ page }, testInfo) => {
    const uid = generateUniqueId();
    const name = `E2E Artist ${uid}`;
    await test.step('Create', async () => {
      await navigateToPayloadCollectionCreate(page, 'artists');
      await fillPayloadTextField(page, 'field-name', name);
      await fillPayloadSlugField(page, generateSlug(name));
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'artists');
      await captureScreenshot(page, testInfo, 'Admin-Artists-01-Created');
    });
    await test.step('Edit then delete', async () => {
      await fillPayloadTextField(page, 'field-name', `${name} (edited)`);
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'artists');
      await deleteCurrentDocument(page);
      await page.waitForURL('**/collections/artists', { timeout: 15000 });
    });
  });

  test('Venues: create, edit, and delete', async ({ page }, testInfo) => {
    const uid = generateUniqueId();
    const name = `E2E Venue ${uid}`;
    await test.step('Create', async () => {
      await navigateToPayloadCollectionCreate(page, 'venues');
      await fillPayloadTextField(page, 'field-name', name);
      await fillPayloadSlugField(page, generateSlug(name));
      await fillPayloadTextField(page, 'field-city', 'Test City');
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'venues');
      await captureScreenshot(page, testInfo, 'Admin-Venues-01-Created');
    });
    await test.step('Edit then delete', async () => {
      await fillPayloadTextField(page, 'field-city', 'Edited City');
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'venues');
      await deleteCurrentDocument(page);
      await page.waitForURL('**/collections/venues', { timeout: 15000 });
    });
  });

  test('Shows: create, edit, and delete', async ({ page }, testInfo) => {
    const uid = generateUniqueId();
    await test.step('Create', async () => {
      await navigateToPayloadCollectionCreate(page, 'shows');
      await fillDateFieldDirect(page, 'field-date', getFutureDate(7));
      await fillPayloadTextField(page, 'field-startTime', '10:00');
      await fillPayloadTextField(page, 'field-endTime', '14:00');
      await fillPayloadTextField(page, 'field-name', `E2E Show ${uid}`);
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'shows');
      await captureScreenshot(page, testInfo, 'Admin-Shows-01-Created');
    });
    await test.step('Edit then delete', async () => {
      await fillPayloadTextField(page, 'field-name', `E2E Show ${uid} (edited)`);
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'shows');
      await deleteCurrentDocument(page);
      await page.waitForURL('**/collections/shows', { timeout: 15000 });
    });
  });

  test('Posts: create, publish, edit, and delete', async ({ page }, testInfo) => {
    const uid = generateUniqueId();
    const headline = `E2E Story ${uid}`;
    await test.step('Create and publish', async () => {
      await navigateToPayloadCollectionCreate(page, 'posts');
      await fillPayloadTextField(page, 'field-headline', headline);
      await fillDateFieldDirect(page, 'field-startDate', new Date());
      await clickPayloadPublish(page, 'posts');
      await captureScreenshot(page, testInfo, 'Admin-Posts-01-Published');
    });
    await test.step('Edit then delete', async () => {
      await fillPayloadTextField(page, 'field-headline', `${headline} (edited)`);
      await clickPayloadPublish(page, 'posts');
      await deleteCurrentDocument(page);
      await page.waitForURL('**/collections/posts', { timeout: 15000 });
    });
  });

  test('Ads: create, publish, edit, and delete', async ({ page }, testInfo) => {
    const uid = generateUniqueId();
    const name = `E2E Ad ${uid}`;
    await test.step('Create and publish', async () => {
      await navigateToPayloadCollectionCreate(page, 'ads');
      await fillPayloadTextField(page, 'field-name', name);
      await fillDateFieldDirect(page, 'field-startDate', new Date());
      await fillDateFieldDirect(page, 'field-endDate', getFutureDate(90));
      await clickPayloadPublish(page, 'ads');
      await captureScreenshot(page, testInfo, 'Admin-Ads-01-Published');
    });
    await test.step('Edit then delete', async () => {
      await fillPayloadTextField(page, 'field-webUrl', `https://e2e-${uid}.example.com`);
      await clickPayloadPublish(page, 'ads');
      await deleteCurrentDocument(page);
      await page.waitForURL('**/collections/ads', { timeout: 15000 });
    });
  });

  test('On Demand: create, publish, edit, and delete', async ({ page }, testInfo) => {
    const uid = generateUniqueId();
    const headline = `E2E OnDemand ${uid}`;
    await test.step('Create and publish', async () => {
      await navigateToPayloadCollectionCreate(page, 'ondemand');
      await fillDateFieldDirect(page, 'field-date', new Date());
      await fillPayloadTextField(page, 'field-headline', headline);
      await clickPayloadPublish(page, 'ondemand');
      await captureScreenshot(page, testInfo, 'Admin-OnDemand-01-Published');
    });
    await test.step('Edit then delete', async () => {
      await fillPayloadTextField(page, 'field-headline', `${headline} (edited)`);
      await clickPayloadPublish(page, 'ondemand');
      await deleteCurrentDocument(page);
      await page.waitForURL('**/collections/ondemand', { timeout: 15000 });
    });
  });

  test('Songs: create, edit, and delete', async ({ page }) => {
    const uid = generateUniqueId();
    const title = `E2E Song ${uid}`;
    await navigateToPayloadCollectionCreate(page, 'songs');
    await fillPayloadTextField(page, 'field-title', title);
    await clickPayloadSave(page);
    await waitForPayloadSave(page, 'songs');
    await fillPayloadTextField(page, 'field-title', `${title} (edited)`);
    await clickPayloadSave(page);
    await waitForPayloadSave(page, 'songs');
    await deleteCurrentDocument(page);
    await page.waitForURL('**/collections/songs', { timeout: 15000 });
  });

  test('Users: create, edit, and delete', async ({ page }, testInfo) => {
    const uid = generateUniqueId();
    const email = `e2e-user-${uid}@test.invalid`;
    await test.step('Create', async () => {
      await navigateToPayloadCollectionCreate(page, 'users');
      await fillPayloadTextField(page, 'field-email', email);
      await page
        .getByLabel(/^password$/i)
        .first()
        .fill('TestPass123!');
      await page
        .getByLabel(/confirm password/i)
        .first()
        .fill('TestPass123!');
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'users');
      await captureScreenshot(page, testInfo, 'Admin-Users-01-Created');
    });
    await test.step('Edit then delete', async () => {
      await fillPayloadTextField(page, 'field-email', `${email}-edited`);
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'users');
      await deleteCurrentDocument(page);
      await page.waitForURL('**/collections/users', { timeout: 15000 });
    });
  });

  test('Editor cannot access the Users collection', async ({ page }) => {
    // Switch to editor auth for this test (rest of file uses admin)
    const context = page.context();
    await context.clearCookies();
    const editorState = await getStorageState(EDITOR_EMAIL, EDITOR_PASSWORD);
    await context.addCookies(editorState.cookies);

    await page.goto(
      `${process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'}/admin/collections/users`,
      { waitUntil: 'networkidle', timeout: 30000 },
    );

    // Payload may redirect editors away from the Users collection, or show an
    // unauthorized/empty state.  Wait a moment for any client-side redirect.
    await page.waitForTimeout(2000);
    const finalUrl = page.url();
    // eslint-disable-next-line operator-linebreak
    const onUsersListPage =
      finalUrl.includes('/collections/users') && !finalUrl.includes('/unauthorized');

    if (onUsersListPage) {
      // If Payload doesn't redirect, the editor should see an empty table
      // (access control returns false for non-self reads) or an error.
      const rows = page.locator('table tbody tr');
      const rowCount = await rows.count();
      // Editor can only read their own user, so the table should have ≤ 1 row
      expect(rowCount).toBeLessThanOrEqual(1);
    }
    // Otherwise the redirect happened as expected — test passes
  });
});
