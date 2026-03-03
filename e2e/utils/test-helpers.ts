import { Page, TestInfo } from '@playwright/test';

/**
 * Navigate to a URL with retry logic for Docker networking flakiness
 * @param page - Playwright page object
 * @param url - URL to navigate to
 * @param maxRetries - Maximum number of retry attempts (default: 5)
 * @returns Object with HTTP status code and final URL after any redirects
 */
export async function navigateWithRetry(
  page: Page,
  url: string,
  maxRetries = 5,
): Promise<{ status: number | null; finalUrl: string }> {
  let response = null;
  for (let i = 0; i < maxRetries; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      if (response?.status() === 200) {
        return { status: response.status(), finalUrl: page.url() };
      }
    } catch {
      // eslint-disable-next-line no-console
      console.log(`Navigation attempt ${i + 1}/${maxRetries} failed, retrying...`);
      // eslint-disable-next-line no-await-in-loop
      await page.waitForTimeout(5000);
    }
  }
  return { status: response?.status() || null, finalUrl: page.url() };
}

/**
 * Take a screenshot and attach it to the test report
 * @param page - Playwright page object
 * @param testInfo - Test info object for attaching artifacts
 * @param name - Name for the screenshot
 * @param fullPage - Whether to capture the full page (default: true)
 */
export async function captureScreenshot(
  page: Page,
  testInfo: TestInfo,
  name: string,
  fullPage = true,
): Promise<void> {
  const screenshot = await page.screenshot({ fullPage });
  await testInfo.attach(name, {
    body: screenshot,
    contentType: 'image/png',
  });
}

/**
 * Navigate to a URL with standard settings and optional screenshot
 * @param page - Playwright page object
 * @param url - URL to navigate to
 * @param testInfo - Test info object for attaching artifacts (optional)
 * @param screenshotName - Name for the screenshot (optional)
 */
export async function navigateAndCapture(
  page: Page,
  url: string,
  testInfo?: TestInfo,
  screenshotName?: string,
): Promise<void> {
  await page.goto(url, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  if (testInfo && screenshotName) {
    await captureScreenshot(page, testInfo, screenshotName);
  }
}

/**
 * Wait for a dropdown to appear and select an option
 * @param page - Playwright page object
 * @param dropdownSelector - Selector for the dropdown input
 * @param optionIndex - Index of the option to select (default: 0 for first option)
 */
export async function selectDropdownOption(
  page: Page,
  dropdownSelector: string,
  optionIndex = 0,
): Promise<void> {
  // Click on the dropdown input to open it
  await page.locator(dropdownSelector).click();

  // Wait for the listbox to appear
  await page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 10000 });

  // Select the option
  const options = page.getByRole('option');
  const option = options.nth(optionIndex);
  await option.waitFor({ state: 'visible', timeout: 10000 });
  await option.click();
}

/**
 * Get the ordinal suffix for a day (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return 'th';
  }
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

/**
 * Fill a Payload CMS date field
 * @param page - Playwright page object
 * @param fieldId - ID of the date field (e.g., 'field-date')
 * @param date - Date object to set
 */
export async function fillPayloadDateField(page: Page, fieldId: string, date: Date): Promise<void> {
  // Click on the date field to open date picker
  const dateField = page.locator(`#${fieldId}`).getByRole('textbox');
  await dateField.waitFor({ state: 'visible', timeout: 30000 });
  await dateField.click();

  // Wait for the date picker dialog
  await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });

  // Select the date - use specific ordinal suffix to avoid matching multiple dates
  // The aria-label format is "Choose Saturday, January 3rd, 2026"
  const day = date.getDate();
  const ordinal = getOrdinalSuffix(day);
  // Use \b word boundary to match exact day number (e.g., \b3rd\b won't match 13th or 23rd)
  const dayPattern = `\\b${day}${ordinal}\\b`;
  await page
    .getByRole('option', { name: new RegExp(`Choose.*${dayPattern}.*${date.getFullYear()}`) })
    .click();
}

/**
 * Check page for common PHP errors
 * @param pageContent - HTML content of the page
 * @returns Array of error messages found (empty if no errors)
 */
export function checkForPhpErrors(pageContent: string): string[] {
  const errors: string[] = [];
  const errorPatterns = [
    'Fatal error',
    'Parse error',
    'Warning:',
    'Connection failed',
    'Database error',
    'SQLSTATE',
  ];

  errorPatterns.forEach((pattern) => {
    if (pageContent.includes(pattern)) {
      errors.push(pattern);
    }
  });

  return errors;
}

/**
 * Create a date N days from now
 * @param daysFromNow - Number of days to add to current date
 * @returns Date object
 */
export function getFutureDate(daysFromNow: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

/**
 * Generate a unique identifier using timestamp
 * @param prefix - Optional prefix for the identifier
 * @returns Unique string identifier
 */
export function generateUniqueId(prefix = ''): string {
  const timestamp = Date.now();
  return prefix ? `${prefix}-${timestamp}` : `${timestamp}`;
}
