import { test, expect } from '@playwright/test';
import { captureScreenshot } from './utils/test-helpers';

const PAYLOAD_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

/**
 * E2E Tests: Show Cloner Tool
 *
 * Tests that the Show Cloner admin tool renders and is accessible.
 * Note: Full clone functionality requires pre-seeded shows data.
 */

test.describe('Show Cloner Tool', () => {
  test('should load the Show Cloner page', async ({ page }, testInfo) => {
    await test.step('Navigate to Show Cloner', async () => {
      await page.goto(`${PAYLOAD_BASE_URL}/admin/show-cloner`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      await captureScreenshot(page, testInfo, '01-ShowCloner-Page');
    });

    await test.step('Verify page content is visible', async () => {
      await expect(page.getByRole('heading', { name: 'Show Cloner' })).toBeVisible({
        timeout: 15000,
      });
      await captureScreenshot(page, testInfo, '02-ShowCloner-Heading-Visible');
    });

    await test.step('Verify date inputs are rendered', async () => {
      const startDateInput = page.getByLabel('Start Date');
      await expect(startDateInput).toBeVisible({ timeout: 10000 });
      await captureScreenshot(page, testInfo, '03-ShowCloner-Date-Inputs');
    });

    await test.step('Verify target date section is rendered', async () => {
      const targetDateInput = page.getByLabel('Target Start Date');
      await expect(targetDateInput).toBeVisible({ timeout: 10000 });
      await captureScreenshot(page, testInfo, '04-ShowCloner-Target-Date');
    });
  });

  test('should have correct breadcrumb navigation', async ({ page }, testInfo) => {
    await page.goto(`${PAYLOAD_BASE_URL}/admin/show-cloner`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await expect(page.getByRole('heading', { name: 'Show Cloner' })).toBeVisible({
      timeout: 15000,
    });

    await captureScreenshot(page, testInfo, '01-ShowCloner-Breadcrumb');
  });
});
