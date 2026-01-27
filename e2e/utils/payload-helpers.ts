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
 * Navigate directly to a Payload CMS collection create page
 * This is more efficient than navigating to list then clicking "Create New"
 * @param page - Playwright page object
 * @param collectionName - Name of the collection (e.g., 'concerts', 'artists')
 */
export async function navigateToPayloadCollectionCreate(
  page: Page,
  collectionName: string,
): Promise<void> {
  await page.goto(`http://localhost:3000/admin/collections/${collectionName}/create`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  // Wait for form to be ready
  await page.waitForSelector('form', { state: 'visible', timeout: 30000 });
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

/**
 * Fill a Payload CMS checkbox field
 * @param page - Playwright page object
 * @param fieldId - ID of the checkbox field (e.g., 'field-onAir')
 * @param checked - Whether to check or uncheck the checkbox
 */
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

/**
 * Fill a Payload CMS time field (text input for time in HH:MM format)
 * @param page - Playwright page object
 * @param fieldId - ID of the time field (e.g., 'field-startTime')
 * @param time - Time value in HH:MM format (e.g., '14:00')
 */
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
 * @param fieldId - ID of the rich text field container (e.g., 'field-content')
 * @param text - Plain text content to enter
 */
export async function fillPayloadRichTextField(
  page: Page,
  fieldId: string,
  text: string,
): Promise<void> {
  // Payload uses Lexical editor - click on the contenteditable and type
  const richTextField = page.locator(`#${fieldId} [contenteditable="true"]`);
  await richTextField.click();
  await richTextField.fill(text);
}

/**
 * Click Publish button and wait for publish to complete
 * Used for collections with drafts enabled (like Posts)
 * @param page - Playwright page object
 * @param collectionName - Name of the collection for URL verification
 */
export async function clickPayloadPublish(page: Page, collectionName: string): Promise<void> {
  // Payload's publish button is in a dropdown
  await page.getByRole('button', { name: /publish/i }).click();
  // Wait for the document to be saved/published
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
  // The setup-e2e-env.sh already sets USE_POSTGRES_* env vars,
  // but we can also use the URL parameter as a fallback
  const response = await page.goto(`http://localhost:8080/${phpPage}?ff=${featureFlag}`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  return response;
}

/**
 * Fill a Payload CMS slug field
 * The slug field is locked by default and must be unlocked first
 * @param page - Playwright page object
 * @param value - Slug value (should be URL-friendly, lowercase with hyphens)
 */
export async function fillPayloadSlugField(page: Page, value: string): Promise<void> {
  // First, click the Unlock button to enable the slug field
  // (with short timeout since it may not exist)
  const unlockButton = page.getByRole('button', { name: /unlock/i });
  try {
    const buttonCount = await unlockButton.count();
    if (buttonCount > 0 && (await unlockButton.isVisible({ timeout: 1000 }))) {
      await unlockButton.click();
    }
  } catch {
    // Unlock button not found or not visible - field may already be unlocked
  }

  // Now fill the slug field
  await page.locator('#field-slug').fill(value);
}

/**
 * Generate a URL-friendly slug from text
 * @param text - Text to convert to slug
 * @returns URL-friendly slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove all non-alphanumeric chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

type Response = Awaited<ReturnType<Page['goto']>>;
