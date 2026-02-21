import { Page, expect } from '@playwright/test';

const PAYLOAD_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const LEGACY_BASE_URL = process.env.PLAYWRIGHT_LEGACY_URL || 'http://localhost:8080';

/**
 * Wait for Payload CMS save operation to complete
 * Checks for either URL change to detail page or success message
 * @param page - Playwright page object
 * @param collectionName - Name of the collection (e.g., 'concerts', 'artists')
 */
export async function waitForPayloadSave(page: Page, collectionName: string): Promise<void> {
  await Promise.race([
    page.waitForURL(`**/${collectionName}/**`, { timeout: 30000 }),
    page.getByText(/saved successfully|successfully saved/i).waitFor({ timeout: 30000 }),
  ]);

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
  await page.goto(`${PAYLOAD_BASE_URL}/admin/collections/${collectionName}`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
}

/**
 * Navigate directly to a Payload CMS collection create page
 * This is more efficient than navigating to list then clicking "Create New"
 * @param page - Playwright page object
 * @param collectionName - Name of the collection (e.g., 'concerts', 'artists')
 */
export async function navigateToPayloadCollectionCreate(
  page: Page,
  collectionName: string,
): Promise<void> {
  await page.goto(`${PAYLOAD_BASE_URL}/admin/collections/${collectionName}/create`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  await page.waitForSelector('form', { state: 'visible', timeout: 30000 });
}

export async function clickPayloadCreateNew(page: Page): Promise<void> {
  await page.getByRole('link', { name: /create new/i }).click();
}

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
  await page.locator(`#${fieldId}`).locator('input[id^="react-select"]').click();
  await page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 10000 });
  const option = page.getByRole('option').nth(optionIndex);
  await option.waitFor({ state: 'visible', timeout: 10000 });
  await option.click();
}

export async function fillPayloadTextField(
  page: Page,
  fieldId: string,
  value: string,
): Promise<void> {
  await page.locator(`#${fieldId}`).fill(value);
}

export async function fillPayloadCheckboxField(
  page: Page,
  fieldId: string,
  checked: boolean,
): Promise<void> {
  const checkbox = page.locator(`#${fieldId}`);
  const isCurrentlyChecked = await checkbox.isChecked();
  if (isCurrentlyChecked !== checked) {
    await checkbox.click();
  }
}

export async function fillPayloadTimeField(
  page: Page,
  fieldId: string,
  time: string,
): Promise<void> {
  await page.locator(`#${fieldId}`).fill(time);
}

/**
 * Fill a Payload CMS rich text field (Lexical editor)
 * Types content into the rich text editor
 * @param page - Playwright page object
 * @param fieldName - Name of the field (e.g., 'note', 'content', 'description')
 * @param text - Plain text content to enter
 */
export async function fillPayloadRichTextField(
  page: Page,
  fieldName: string,
  text: string,
): Promise<void> {
  const fieldLabel = page.locator(`label[for="field-${fieldName}"]`);
  const fieldWrapper = fieldLabel.locator('..').locator('..');
  await fieldWrapper.scrollIntoViewIfNeeded();

  const richTextField = fieldWrapper.locator('[data-lexical-editor="true"]');
  await richTextField.waitFor({ state: 'visible', timeout: 10000 });
  await richTextField.click();
  await page.keyboard.type(text);
}

/**
 * Click Publish button and wait for publish to complete
 * Used for collections with drafts enabled (like Posts)
 * @param page - Playwright page object
 * @param collectionName - Name of the collection for URL verification
 */
export async function clickPayloadPublish(page: Page, collectionName: string): Promise<void> {
  await page.getByRole('button', { name: /publish/i }).click();
  await Promise.race([
    page.waitForURL(`**/${collectionName}/**`, { timeout: 30000 }),
    page.getByText(/published successfully|successfully published|saved successfully/i).waitFor({
      timeout: 30000,
    }),
  ]);
}

/**
 * Navigate to the legacy PHP site with PostgreSQL feature flag enabled
 * @param page - Playwright page object
 * @param phpPage - PHP page path (e.g., 'concerts.php', 'deejays.php')
 * @param featureFlag - Feature flag name (e.g., 'use_postgres_concerts')
 * @returns Response from the navigation
 */
export async function navigateToLegacySiteWithPostgres(
  page: Page,
  phpPage: string,
  featureFlag: string,
): Promise<Response | null> {
  return page.goto(`${LEGACY_BASE_URL}/${phpPage}?ff=${featureFlag}`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
}

/**
 * Fill a Payload CMS slug field
 * The slug field is locked by default and must be unlocked first
 * @param page - Playwright page object
 * @param value - Slug value (should be URL-friendly, lowercase with hyphens)
 */
export async function fillPayloadSlugField(page: Page, value: string): Promise<void> {
  const unlockButton = page.getByRole('button', { name: /unlock/i });
  try {
    const buttonCount = await unlockButton.count();
    if (buttonCount > 0 && (await unlockButton.isVisible({ timeout: 1000 }))) {
      await unlockButton.click();
    }
  } catch {
    // Unlock button not found or not visible - field may already be unlocked
  }

  await page.locator('#field-slug').fill(value);
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

type Response = Awaited<ReturnType<Page['goto']>>;
