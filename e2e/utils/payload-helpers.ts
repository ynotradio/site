import { Page, expect } from '@playwright/test';

/**
 * Wait for Payload CMS save operation to complete
 * Checks for either URL change to detail page or success message
 * @param page - Playwright page object
 * @param collectionName - Name of the collection (e.g., 'concerts', 'artists')
 */
export async function waitForPayloadSave(page: Page, collectionName: string): Promise<void> {
  // Wait for save success - look for URL change or success message
  await Promise.race([
    page.waitForURL(`**/${collectionName}/**`, { timeout: 30000 }),
    page.getByText(/saved successfully|successfully saved/i).waitFor({ timeout: 30000 }),
  ]);

  // Verify that either the URL has changed or the success message is visible
  const currentUrl = page.url();
  if (!currentUrl.includes(`/${collectionName}/`)) {
    await expect(page.getByText(/saved successfully|successfully saved/i)).toBeVisible({
      timeout: 5000,
    });
  }
}

/**
 * Navigate to a Payload CMS collection list page
 * @param page - Playwright page object
 * @param collectionName - Name of the collection (e.g., 'concerts', 'artists')
 */
export async function navigateToPayloadCollection(
  page: Page,
  collectionName: string,
): Promise<void> {
  await page.goto(`http://localhost:3000/admin/collections/${collectionName}`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
}

/**
 * Click "Create New" button in Payload CMS
 * @param page - Playwright page object
 */
export async function clickPayloadCreateNew(page: Page): Promise<void> {
  await page.getByRole('link', { name: /create new/i }).click();
}

/**
 * Click Save button in Payload CMS form
 * @param page - Playwright page object
 */
export async function clickPayloadSave(page: Page): Promise<void> {
  await page.getByRole('button', { name: /save/i }).click();
}

/**
 * Fill a Payload CMS relationship field (like artist or venue)
 * @param page - Playwright page object
 * @param fieldId - ID of the field (e.g., 'field-artists', 'field-venue')
 * @param optionIndex - Index of the option to select (default: 0 for first)
 */
export async function fillPayloadRelationshipField(
  page: Page,
  fieldId: string,
  optionIndex = 0,
): Promise<void> {
  const field = page.locator(`#${fieldId}`);
  await field.locator('input[id^="react-select"]').click();

  // Wait for dropdown and select option
  await page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 10000 });
  const option = page.getByRole('option').nth(optionIndex);
  await option.waitFor({ state: 'visible', timeout: 10000 });
  await option.click();
}

/**
 * Fill a Payload CMS text field
 * @param page - Playwright page object
 * @param fieldId - ID of the field (e.g., 'field-ticketInfo')
 * @param value - Value to fill
 */
export async function fillPayloadTextField(
  page: Page,
  fieldId: string,
  value: string,
): Promise<void> {
  await page.locator(`#${fieldId}`).fill(value);
}
