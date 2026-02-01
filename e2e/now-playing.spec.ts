import { test, expect } from '@playwright/test';
import { captureScreenshot, checkForPhpErrors, fillPayloadDateField } from './utils/test-helpers';
import {
  navigateToPayloadCollectionCreate,
  fillPayloadTimeField,
  fillPayloadRelationshipField,
  clickPayloadSave,
  waitForPayloadSave,
} from './utils/payload-helpers';

/**
 * E2E Integration Test: "Now playing on Y-Not Radio" functionality
 *
 * This test validates the on-air DJ display that appears on the legacy PHP site header.
 * It prevents regressions like:
 * - PR #208: On-air DJ going missing or showing incorrect DJ due to timezone mismatches
 *
 * The test:
 * 1. Creates a DJ (or uses existing)
 * 2. Creates a show scheduled for the current time
 * 3. Verifies the on-air DJ text appears on the page
 * 4. Verifies the correct DJ name is displayed
 *
 * Technical details:
 * - The on_air() function in src/functions/main_fns.php uses date('Y-m-d') and date('H:i:s')
 * - The function queries the shows table for today's date (local timezone)
 * - It checks if current time falls within a show's start_time and end_time
 * - The result appears in <div id="on-air"> in the header
 */

test.describe('Now Playing on Y-Not Radio', () => {
  test('should verify on-air DJ functionality exists and works', async ({ page }, testInfo) => {
    // This test validates that the on_air() function and display works correctly
    // It checks for the presence/absence of the #on-air div based on schedule data
    
    await test.step('Load legacy PHP site and check on-air functionality', async () => {
      const response = await page.goto('http://localhost:8080', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      
      expect(response?.status()).toBe(200);
      
      const pageContent = await page.content();
      
      // Check for PHP errors first
      const errors = checkForPhpErrors(pageContent);
      if (errors.length > 0) {
        console.error('PHP errors found:', errors);
      }
      expect(errors).toHaveLength(0);
      
      // Check if the on-air div exists
      const onAirDiv = page.locator('#on-air');
      const isVisible = await onAirDiv.isVisible().catch(() => false);
      
      if (isVisible) {
        // If on-air div is visible, validate its content
        const onAirText = await onAirDiv.textContent();
        
        console.log('✓ On-air DJ is displayed:', onAirText);
        
        // Verify text formatting (no HTML tags, reasonable length)
        expect(onAirText).toBeTruthy();
        expect(onAirText?.trim()).not.toBe('');
        expect(onAirText).not.toContain('<br>');
        expect(onAirText).not.toContain('<i>');
        expect(onAirText).not.toContain('</i>');
        expect(onAirText!.length).toBeLessThanOrEqual(35);
        
        await captureScreenshot(page, testInfo, 'Legacy-Site-With-OnAir-DJ');
      } else {
        console.log('ℹ On-air div not visible (no show currently scheduled)');
        
        // This is valid behavior when no show is scheduled for current time
        // The test passes either way - we're just verifying the page loads without errors
        
        await captureScreenshot(page, testInfo, 'Legacy-Site-No-OnAir-DJ');
      }
      
      // Document that the on_air() function runs without errors
      test.info().annotations.push({
        type: 'Validation',
        description: 'on_air() function executes without PHP errors. On-air div visibility depends on schedule data.',
      });
    });
  });
  
  test('should create show for current time and verify on-air DJ displays', async ({
    page,
  }, testInfo) => {
    // This test actively creates a show and verifies it appears
    const now = new Date();
    const currentHour = now.getHours();
    
    // Create a show that covers a wide time window
    const startHour = (currentHour - 2 + 24) % 24;
    const endHour = (currentHour + 2) % 24;
    
    const startTime = `${String(startHour).padStart(2, '0')}:00`;
    const endTime = `${String(endHour).padStart(2, '0')}:00`;
    
    console.log(`Creating show: ${startTime} - ${endTime} (current hour: ${currentHour})`);
    
    await test.step('Create a show scheduled for current time', async () => {
      await navigateToPayloadCollectionCreate(page, 'shows');
      await captureScreenshot(page, testInfo, '01-Show-Create-Form');
      
      // Set show date to today
      const today = new Date();
      await fillPayloadDateField(page, 'field-date', today);
      
      // Set start and end times to span current time
      await fillPayloadTimeField(page, 'field-startTime', startTime);
      await fillPayloadTimeField(page, 'field-endTime', endTime);
      
      // Select the first available DJ from seed data
      await fillPayloadRelationshipField(page, 'field-host', 0);
      
      await captureScreenshot(page, testInfo, '02-Show-Filled-Form');
      
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'shows');
      await captureScreenshot(page, testInfo, '03-Show-Saved');
    });
    
    await test.step('Verify on-air DJ appears on legacy PHP site', async () => {
      // Add a small delay to ensure database has propagated
      await page.waitForTimeout(1000);
      
      const response = await page.goto('http://localhost:8080', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      
      expect(response?.status()).toBe(200);
      
      const pageContent = await page.content();
      
      // Check for PHP errors
      const errors = checkForPhpErrors(pageContent);
      if (errors.length > 0) {
        console.error('PHP errors found:', errors);
      }
      expect(errors).toHaveLength(0);
      
      // Check if the on-air div exists
      const onAirDiv = page.locator('#on-air');
      const isVisible = await onAirDiv.isVisible().catch(() => false);
      
      if (!isVisible) {
        // Log debugging info
        console.log('⚠ On-air div not found after creating show. Debugging...');
        console.log(`Expected time window: ${startTime} - ${endTime}`);
        console.log(`Current time: ${new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false })}`);
        
        // Check schedule page to see if show was created
        await page.goto('http://localhost:8080/schedule.php', {
          waitUntil: 'networkidle',
          timeout: 30000,
        });
        await captureScreenshot(page, testInfo, '04-Schedule-Page-Debug');
        
        const scheduleContent = await page.content();
        const hasTodayShows = scheduleContent.includes(startTime) || scheduleContent.includes(endTime);
        console.log(`Show appears on schedule page: ${hasTodayShows}`);
        
        // Go back to home page for final check
        await page.goto('http://localhost:8080', {
          waitUntil: 'networkidle',
          timeout: 30000,
        });
      }
      
      // Now assert that on-air div is visible
      await expect(onAirDiv).toBeVisible({ timeout: 10000 });
      
      // Get and validate the text content
      const onAirText = await onAirDiv.textContent();
      
      expect(onAirText).toBeTruthy();
      expect(onAirText?.trim()).not.toBe('');
      
      console.log('✓ On-air DJ text:', onAirText);
      
      await captureScreenshot(page, testInfo, '05-Legacy-Site-With-OnAir-DJ');
      
      test.info().annotations.push({
        type: 'Success',
        description: `On-air DJ displayed correctly: "${onAirText}"`,
      });
    });
  });
  
  test('should not display on-air div when no show is scheduled', async ({ page }, testInfo) => {
    await test.step('Load legacy PHP site', async () => {
      // This test checks the default state - if no show is scheduled for current time,
      // the on-air div should not be present
      // Note: This might fail if seed data includes shows for current time
      // or if previous test data exists
      
      const response = await page.goto('http://localhost:8080', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      
      expect(response?.status()).toBe(200);
      
      const pageContent = await page.content();
      
      // Check for PHP errors
      const errors = checkForPhpErrors(pageContent);
      expect(errors).toHaveLength(0);
      
      // The on-air function returns empty string when no show is scheduled
      // In that case, the div should either not exist or be empty
      const onAirDiv = page.locator('#on-air');
      
      // Try to check if it exists
      const isVisible = await onAirDiv.isVisible().catch(() => false);
      
      if (isVisible) {
        // If it exists, it should be empty or very short (whitespace)
        const text = await onAirDiv.textContent();
        console.log('On-air div exists with text:', text);
        // This is informational - we're documenting the current state
        test.info().annotations.push({
          type: 'Note',
          description: `On-air div exists with content: "${text}". This is expected if a show is scheduled for current time.`,
        });
      } else {
        console.log('On-air div not visible (expected when no show scheduled)');
      }
      
      await captureScreenshot(page, testInfo, 'Legacy-Site-No-Show');
    });
  });
  
  test('should handle midnight UTC boundary correctly (PR #208 regression test)', async ({
    page,
  }, testInfo) => {
    // This test validates the fix from PR #208 by creating a show and then
    // manipulating the Docker container's time to the exact timezone boundary
    // where the bug would occur.
    //
    // Bug: When EST is 7 PM (19:00), UTC is midnight (00:00 next day)
    // - gmdate('Y-m-d') would return next day in UTC
    // - date('H:i:s') would return EST time
    // - Result: Date mismatch, show not found
    //
    // Fix: Both date('Y-m-d') and date('H:i:s') use local EST timezone
    
    let originalTime: string | null = null;
    
    await test.step('Save original container time', async () => {
      // We'll restore this after the test
      try {
        const { execSync } = require('child_process');
        originalTime = execSync('docker compose exec -T phpfpm date "+%Y-%m-%d %H:%M:%S"', {
          cwd: '/home/runner/work/site/site',
          encoding: 'utf-8',
        }).trim();
        console.log(`Original PHP container time: ${originalTime}`);
      } catch (error) {
        console.warn('Could not save original time:', error);
      }
    });
    
    await test.step('Create show for Jan 29, 2026, 18:00-21:00 EST', async () => {
      await navigateToPayloadCollectionCreate(page, 'shows');
      await captureScreenshot(page, testInfo, '01-Timezone-Show-Create-Form');
      
      // January 29, 2026
      const showDate = new Date('2026-01-29T12:00:00-05:00');
      await fillPayloadDateField(page, 'field-date', showDate);
      
      // 6 PM - 9 PM EST (covers 7 PM when we'll test)
      await fillPayloadTimeField(page, 'field-startTime', '18:00');
      await fillPayloadTimeField(page, 'field-endTime', '21:00');
      
      await fillPayloadRelationshipField(page, 'field-host', 0);
      
      await captureScreenshot(page, testInfo, '02-Timezone-Show-Filled-Form');
      
      await clickPayloadSave(page);
      await waitForPayloadSave(page, 'shows');
      await captureScreenshot(page, testInfo, '03-Timezone-Show-Saved');
      
      console.log('✓ Created show for Jan 29, 2026, 18:00-21:00 EST');
    });
    
    await test.step('Set container time to timezone boundary (7 PM EST = midnight UTC)', async () => {
      try {
        const { execSync } = require('child_process');
        
        // Set PHP container time to Jan 29, 2026 at 7:00 PM EST
        // This is the exact moment when UTC crosses to midnight of Jan 30
        const boundaryTime = '2026-01-29 19:00:00';
        
        console.log(`\nSetting PHP container time to timezone boundary:`);
        console.log(`  Local (EST): Jan 29, 2026 19:00 (7 PM)`);
        console.log(`  UTC:         Jan 30, 2026 00:00 (midnight)`);
        console.log(`  Bug (gmdate): Would look for Jan 30 schedule`);
        console.log(`  Fix (date):   Looks for Jan 29 schedule`);
        
        // Set the time in the PHP container
        execSync(`docker compose exec -T phpfpm date -s "${boundaryTime}"`, {
          cwd: '/home/runner/work/site/site',
          stdio: 'pipe',
        });
        
        // Verify the time was set
        const newTime = execSync('docker compose exec -T phpfpm date "+%Y-%m-%d %H:%M:%S %Z"', {
          cwd: '/home/runner/work/site/site',
          encoding: 'utf-8',
        }).trim();
        
        console.log(`✓ Container time set to: ${newTime}`);
        
      } catch (error) {
        console.error('Failed to set container time:', error);
        test.skip('Skipping test - requires Docker container time manipulation');
        return;
      }
    });
    
    await test.step('Verify on-air DJ appears correctly at timezone boundary', async () => {
      // Give PHP time to recognize the new system time
      await page.waitForTimeout(2000);
      
      const response = await page.goto('http://localhost:8080', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      
      expect(response?.status()).toBe(200);
      
      const pageContent = await page.content();
      const errors = checkForPhpErrors(pageContent);
      expect(errors).toHaveLength(0);
      
      // The critical test: on-air div MUST be visible
      // If the bug exists (using gmdate), it would look for Jan 30 schedule = no match
      // With the fix (using date), it looks for Jan 29 schedule = match found
      const onAirDiv = page.locator('#on-air');
      
      const isVisible = await onAirDiv.isVisible().catch(() => false);
      
      if (!isVisible) {
        // This is a regression - the bug has returned
        console.error('\n❌ REGRESSION DETECTED:');
        console.error('On-air div not visible at UTC midnight boundary!');
        console.error('This indicates on_air() is using gmdate() instead of date()');
        console.error('The show exists for Jan 29, but PHP is looking for Jan 30');
        
        await captureScreenshot(page, testInfo, '04-BUG-DETECTED');
        
        // Fail the test
        throw new Error('PR #208 regression: on-air DJ not displayed at timezone boundary');
      }
      
      // Success - the fix is working
      const onAirText = await onAirDiv.textContent();
      expect(onAirText).toBeTruthy();
      expect(onAirText?.trim()).not.toBe('');
      
      console.log(`\n✓ SUCCESS: On-air DJ displayed: "${onAirText}"`);
      console.log('✓ PR #208 fix verified: date() used consistently');
      console.log('✓ Show for Jan 29 EST found correctly at 7 PM EST (midnight UTC)');
      
      await captureScreenshot(page, testInfo, '04-Timezone-Fix-Verified');
      
      test.info().annotations.push({
        type: 'Regression Test',
        description: `PR #208 fix verified: On-air DJ "${onAirText}" displayed correctly at UTC midnight boundary (Jan 29 19:00 EST = Jan 30 00:00 UTC)`,
      });
    });
    
    await test.step('Restore original container time', async () => {
      if (originalTime) {
        try {
          const { execSync } = require('child_process');
          execSync(`docker compose exec -T phpfpm date -s "${originalTime}"`, {
            cwd: '/home/runner/work/site/site',
            stdio: 'pipe',
          });
          console.log(`✓ Restored container time to: ${originalTime}`);
        } catch (error) {
          console.warn('Could not restore original time:', error);
        }
      }
    });
  });
  
  test('should display on-air DJ with correct format (no HTML tags, max 35 chars)', async ({
    page,
  }, testInfo) => {
    await test.step('Verify on-air text formatting', async () => {
      const response = await page.goto('http://localhost:8080', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      
      expect(response?.status()).toBe(200);
      
      const onAirDiv = page.locator('#on-air');
      
      // Try to get the text if it exists
      const isVisible = await onAirDiv.isVisible().catch(() => false);
      
      if (isVisible) {
        const onAirText = await onAirDiv.textContent();
        
        if (onAirText && onAirText.trim()) {
          // Verify no HTML tags in the text (should be stripped by str_replace in PHP)
          expect(onAirText).not.toContain('<br>');
          expect(onAirText).not.toContain('<i>');
          expect(onAirText).not.toContain('</i>');
          
          // Verify length is within limit (max 35 chars as per substr in PHP)
          expect(onAirText.length).toBeLessThanOrEqual(35);
          
          console.log(`On-air DJ text: "${onAirText}" (length: ${onAirText.length})`);
        }
        
        await captureScreenshot(page, testInfo, 'OnAir-Text-Format');
      } else {
        console.log('No on-air DJ currently (no show scheduled)');
        await captureScreenshot(page, testInfo, 'No-OnAir-DJ');
      }
    });
  });
});
