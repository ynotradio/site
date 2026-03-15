import { Page } from '@playwright/test';

const PAYLOAD_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

async function checkIfCreateUserPage(page: Page): Promise<boolean> {
  const [hasNewPasswordField, hasConfirmPasswordField] = await Promise.all([
    page.getByLabel(/new password/i).isVisible().catch(() => false),
    page.getByLabel(/confirm password/i).isVisible().catch(() => false),
  ]);
  return hasNewPasswordField || hasConfirmPasswordField;
}

async function createFirstUser(page: Page, email: string, password: string): Promise<void> {
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/new password/i).fill(password);
  await page.getByLabel(/confirm password/i).fill(password);

  const createButton = page.getByRole('button', { name: /create/i });
  await createButton.waitFor({ state: 'visible', timeout: 10000 });
  await Promise.all([page.waitForNavigation({ timeout: 30000 }), createButton.click()]);
}

async function performLogin(page: Page, email: string, password: string): Promise<void> {
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).first().fill(password);

  const submitButton = page
    .getByRole('button', { name: 'Login' })
    .or(page.locator('button:has-text("Login")'))
    .or(page.locator('button[type="submit"]'));

  await submitButton.waitFor({ state: 'visible', timeout: 10000 });
  await Promise.all([page.waitForNavigation({ timeout: 10000 }), submitButton.click()]);
}

function verifyLoginSuccess(page: Page): void {
  const currentUrl = page.url();
  if (currentUrl.includes('/login') || currentUrl.includes('/create-first-user')) {
    throw new Error(`Login failed - still on login/create page: ${currentUrl}`);
  }
}

export async function loginToPayload(
  page: Page,
  email: string = process.env.PAYLOAD_DEV_EMAIL || 'admin@ynotradio.net',
  password: string = process.env.PAYLOAD_DEV_PASSWORD || 'password',
): Promise<void> {
  await page.goto(`${PAYLOAD_BASE_URL}/admin`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  const isCreateUserPage = await checkIfCreateUserPage(page);

  if (isCreateUserPage) {
    await createFirstUser(page, email, password);
  } else {
    await performLogin(page, email, password);
  }

  verifyLoginSuccess(page);
}
