/**
 * Payload CMS CRUD — Admin Role (Relationship Collections)
 *
 * Tests Records, DJs, Concerts, and CD of the Week.
 * These require prerequisite data (artist, venue, record, person) that
 * is created via REST API in beforeAll.
 * Full create → edit → delete cycle run as the admin user.
 * Authentication is handled inline — no setup project required.
 */

import { test as baseTest } from '@playwright/test';
import { captureScreenshot, generateUniqueId, getFutureDate } from './utils/test-helpers';
import {
  navigateToPayloadCollectionCreate,
  fillPayloadTextField,
  fillPayloadCheckboxField,
  clickPayloadSave,
  clickPayloadPublish,
  waitForPayloadSave,
} from './utils/payload-helpers';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  getAdminJwt,
  getStorageState,
  ensureEditorUser,
  createPrereqData,
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

test.describe('Payload Admin CRUD — Admin Role (Relationship Collections)', () => {
  test.beforeAll(async () => {
    const jwt = await getAdminJwt();
    await ensureEditorUser(jwt);
    await createPrereqData(jwt); // artist, venue, record, person appear in dropdowns
  });

  test('Records: create, edit, and delete', async ({ page }, testInfo) => {
    const uid = generateUniqueId();
    const title = `E2E Album ${uid}`;
    await test.step('Create with artist', async () => {
      await navigateToPayloadCollectionCreate(page, 'records');
      await fillPayloadTextField(page, 'field-title', title);
      await page.locator('#field-artist').locator('input[id^="react-select"]').click();
      await page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 10000 });
      await page.getByRole('option').first().click();
      const docId = await clickPayloadSave(page);
      await waitForPayloadSave(page, 'records', docId);
      await captureScreenshot(page, testInfo, 'Admin-Records-01-Created');
    });
    await test.step('Edit then delete', async () => {
      await fillPayloadTextField(page, 'field-title', `${title} (edited)`);
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'records');
      await deleteCurrentDocument(page);
      await page.waitForURL('**/collections/records', { timeout: 15000 });
    });
  });

  test('DJs: create, publish, edit, and delete', async ({ page }, testInfo) => {
    await test.step('Create with person', async () => {
      await navigateToPayloadCollectionCreate(page, 'djs');
      await page.locator('#field-person').locator('input[id^="react-select"]').click();
      await page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 10000 });
      await page.getByRole('option').first().click();
      await clickPayloadPublish(page, 'djs');
      await captureScreenshot(page, testInfo, 'Admin-DJs-01-Published');
    });
    await test.step('Edit then delete', async () => {
      await fillPayloadCheckboxField(page, 'field-onAir', true);
      await clickPayloadPublish(page, 'djs');
      await deleteCurrentDocument(page);
      await page.waitForURL('**/collections/djs', { timeout: 15000 });
    });
  });

  test('Concerts: create, publish, edit, and delete', async ({ page }, testInfo) => {
    const uid = generateUniqueId();
    await test.step('Create with artist and venue', async () => {
      await navigateToPayloadCollectionCreate(page, 'concerts');
      await fillDateFieldDirect(page, 'field-date', getFutureDate(30));
      await fillPayloadTextField(page, 'field-title', `E2E Concert ${uid}`);
      await page.locator('#field-artists').locator('input[id^="react-select"]').click();
      await page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 10000 });
      await page.getByRole('option').first().click();
      await page.locator('#field-venue').locator('input[id^="react-select"]').click();
      await page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 10000 });
      await page.getByRole('option').first().click();
      await clickPayloadPublish(page, 'concerts');
      await captureScreenshot(page, testInfo, 'Admin-Concerts-01-Published');
    });
    await test.step('Edit then delete', async () => {
      await fillPayloadTextField(page, 'field-ticketInfo', '$25 advance, $30 door');
      await clickPayloadPublish(page, 'concerts');
      await deleteCurrentDocument(page);
      await page.waitForURL('**/collections/concerts', { timeout: 15000 });
    });
  });

  test('CD of the Week: create, publish, edit, and delete', async ({ page }, testInfo) => {
    await test.step('Create with record', async () => {
      await navigateToPayloadCollectionCreate(page, 'cdoftheweek');
      await page.locator('#field-record').locator('input[id^="react-select"]').click();
      await page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 10000 });
      await page.getByRole('option').first().click();
      await fillDateFieldDirect(page, 'field-date', new Date());
      const reviewEditor = page.locator('[data-lexical-editor="true"]').first();
      await reviewEditor.click();
      await page.keyboard.type('E2E test review content');
      await clickPayloadPublish(page, 'cdoftheweek');
      await captureScreenshot(page, testInfo, 'Admin-CdOfTheWeek-01-Published');
    });
    await test.step('Edit then delete', async () => {
      const reviewEditor = page.locator('[data-lexical-editor="true"]').first();
      await reviewEditor.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.type('Updated E2E review');
      await clickPayloadPublish(page, 'cdoftheweek');
      await deleteCurrentDocument(page);
      await page.waitForURL('**/collections/cdoftheweek', { timeout: 15000 });
    });
  });
});
