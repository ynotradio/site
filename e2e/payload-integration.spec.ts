import { test, expect } from '@playwright/test';

/**
 * E2E Integration Test: Payload CMS → Legacy PHP Site
 *
 * This test demonstrates end-to-end data flow using real user interactions:
 * 1. Log in to Payload CMS admin interface
 * 2. Create a new concert through the Payload UI
 * 3. Verify the concert appears on the legacy PHP site (concerts.php)
 *
 * The test assumes:
 * - Docker Compose has started PostgreSQL, MySQL, and Apache services
 * - PostgreSQL database has Payload schema (via migrations)
 * - Payload server is running on port 3000
 * - Legacy PHP site is configured to read from PostgreSQL
 * - Apache is serving the legacy PHP site on port 8080
 */

test.describe('Payload CMS Integration with Legacy PHP Site', () => {
  test('should create concert via Payload UI and verify it appears on legacy site', async ({
    page,
  }, testInfo) => {
    // eslint-disable-next-line no-console
    console.log('🎭 Testing Payload CMS → Legacy PHP Site integration via UI');

    // Step 1: Navigate to Payload admin (it will redirect to login if not authenticated)
    // eslint-disable-next-line no-console
    console.log('🔐 Navigating to Payload admin...');

    await page.goto('http://localhost:3000/admin', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Take screenshot of login page
    let screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach('01-Payload Login Page', {
      body: screenshot,
      contentType: 'image/png',
    });

    // Step 2: Log in to Payload
    // eslint-disable-next-line no-console
    console.log('🔑 Logging in to Payload...');

    // Wait for the page to load and find the email field more flexibly
    await page.waitForSelector('input[type="email"], input[name="email"], input[id*="email"]', { timeout: 30000 });

    // Fill in login credentials using flexible selectors
    const emailInput = page.locator('input[type="email"], input[name="email"], input[id*="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[id*="password"]').first();
    
    await emailInput.fill('admin@ynotradio.net');
    await passwordInput.fill('password');
    
    // Find and click the submit button
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Wait for dashboard to load
    await page.waitForURL('**/admin', { timeout: 30000 });

    screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach('02-Payload Dashboard', {
      body: screenshot,
      contentType: 'image/png',
    });

    // eslint-disable-next-line no-console
    console.log('   ✅ Logged in successfully');

    // Step 3: Navigate to Concerts collection
    // eslint-disable-next-line no-console
    console.log('🎤 Navigating to Concerts collection...');

    await page.goto('http://localhost:3000/admin/collections/concerts', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach('03-Concerts Collection List', {
      body: screenshot,
      contentType: 'image/png',
    });

    // Step 4: Click "Create New" button
    // eslint-disable-next-line no-console
    console.log('➕ Creating new concert...');

    await page.click('a[href="/admin/collections/concerts/create"]');
    await page.waitForURL('**/concerts/create', { timeout: 30000 });

    screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach('04-Create Concert Form', {
      body: screenshot,
      contentType: 'image/png',
    });

    // Step 5: Fill out the concert form
    // eslint-disable-next-line no-console
    console.log('📝 Filling out concert form...');

    // Set concert date (7 days from now)
    const concertDate = new Date();
    concertDate.setDate(concertDate.getDate() + 7);
    const concertDateString = concertDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Fill in the date field
    await page.fill('input[name="date"]', concertDateString);

    // Select an artist (use the first artist from seeded data)
    await page.click('button:has-text("Add Artist")');
    await page.waitForTimeout(1000); // Wait for dropdown to appear
    
    // Find and click the first artist option
    const firstArtist = page.locator('.rs__option').first();
    await firstArtist.click();

    // Select a venue (use the first venue from seeded data)
    await page.click('button:has-text("Select a Venue")');
    await page.waitForTimeout(1000); // Wait for dropdown to appear
    
    // Find and click the first venue option
    const firstVenue = page.locator('.rs__option').first();
    await firstVenue.click();

    // Fill in ticket info
    await page.fill('textarea[name="ticketInfo"]', 'E2E Test Tickets $30');
    await page.fill('input[name="ticketUrl"]', 'https://tickets.example.com/e2e-playwright-test');

    screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach('05-Filled Concert Form', {
      body: screenshot,
      contentType: 'image/png',
    });

    // Step 6: Save the concert
    // eslint-disable-next-line no-console
    console.log('💾 Saving concert...');

    await page.click('button[type="submit"]:has-text("Save")');

    // Wait for the save to complete and redirect back to list or edit page
    await page.waitForTimeout(3000); // Give time for the save operation

    screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach('06-Concert Saved', {
      body: screenshot,
      contentType: 'image/png',
    });

    // eslint-disable-next-line no-console
    console.log('   ✅ Concert created via Payload UI');

    // Step 7: Navigate to the legacy PHP concerts page
    // eslint-disable-next-line no-console
    console.log('🌐 Navigating to legacy PHP concerts page...');

    const response = await page.goto('http://localhost:8080/concerts.php', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    expect(response?.status()).toBe(200);

    // Step 8: Verify the page loaded without errors
    const pageContent = await page.content();

    // Check for PHP errors
    expect(pageContent).not.toContain('Fatal error');
    expect(pageContent).not.toContain('Parse error');
    expect(pageContent).not.toContain('Warning:');

    // Step 9: Verify the newly created concert appears on the page
    // eslint-disable-next-line no-console
    console.log('🔍 Verifying concert appears on legacy PHP page...');

    // Check for ticket info (this is unique to our test concert)
    expect(pageContent).toContain('E2E Test Tickets $30');

    // Take final screenshot showing the concert on the legacy site
    screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach('07-Legacy Site with New Concert', {
      body: screenshot,
      contentType: 'image/png',
    });

    // eslint-disable-next-line no-console
    console.log('✅ Concert successfully appears on legacy PHP site!');
    // eslint-disable-next-line no-console
    console.log('✅ Integration test completed successfully!');
  });

  test('should verify Payload admin UI loads correctly', async ({ page }, testInfo) => {
    // eslint-disable-next-line no-console
    console.log('🔌 Testing Payload admin UI accessibility...');

    await page.goto('http://localhost:3000/admin', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Verify login page elements are present using flexible selectors
    const emailInput = page.locator('input[type="email"], input[name="email"], input[id*="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[id*="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach('Payload Login Page', {
      body: screenshot,
      contentType: 'image/png',
    });

    // eslint-disable-next-line no-console
    console.log('✅ Payload admin UI is accessible');
  });
});
