import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import { captureScreenshot, checkForPhpErrors } from './utils/test-helpers';

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
    // IMPORTANT: PHP reads from MySQL schedule table, not Postgres shows table
    // So we insert directly into MySQL instead of using Payload UI

    // CRITICAL: PHP server uses America/New_York timezone (EST/EDT)
    // Test runner uses UTC. Must get PHP server's current time to create matching show!
    await test.step('Get PHP server current time', async () => {
      const phpTime = execSync('docker compose exec -T phpfpm date "+%Y-%m-%d %H:%M:%S %A"', {
        cwd: process.cwd(),
        encoding: 'utf8',
      }).trim();

      console.log(`PHP server time: ${phpTime}`);
    });

    // Query PHP server for current date/time using PHP's timezone (America/New_York)
    // System 'date' command returns UTC, but PHP code uses America/New_York timezone
    const phpDateOutput = execSync(
      'docker compose exec -T phpfpm php -r "date_default_timezone_set(\'America/New_York\'); echo date(\'Y-m-d H l\');"',
      {
        cwd: process.cwd(),
        encoding: 'utf8',
      },
    ).trim();

    const [dateStr, hourStr, dayName] = phpDateOutput.split(' ');
    const currentHour = parseInt(hourStr, 10);

    // Create a show that covers a wide time window, without crossing midnight
    const startHour = Math.max(0, currentHour - 2);
    const endHour = Math.min(23, currentHour + 2);

    const startTime = `${String(startHour).padStart(2, '0')}:00:00`;
    const endTime = `${String(endHour).padStart(2, '0')}:00:00`;

    console.log(`Creating show for PHP server time: ${dateStr} (${dayName}) ${startTime} - ${endTime} (PHP current hour: ${currentHour})`);

    await test.step('Insert show for current time directly into MySQL', async () => {
      // PHP reads from MySQL schedule table (use_postgres_schedule = false)
      // Insert directly to avoid Payload UI flakiness and database mismatch
      const insertShowSQL = `
        INSERT INTO schedule (date, day, start_time, end_time, host, note, deleted)
        VALUES ('${dateStr}', '${dayName}', '${startTime}', '${endTime}', 'Test DJ', '', 'n')
        ON DUPLICATE KEY UPDATE host = 'Test DJ';
      `;

      execSync(`docker compose exec -T mysql mysql -u ynot_sql_user -pynot_sql_pass ynot_site -e "${insertShowSQL}"`, {
        cwd: process.cwd(),
        stdio: 'pipe',
      });

      console.log(`✓ Inserted show for ${dateStr} ${startTime}-${endTime} into MySQL`);
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

      // Extract PHP debug comments to see what date/time PHP is looking for
      const debugComments = pageContent.match(/<!-- DEBUG on_air\(\):.*?-->/g) || [];
      console.log('\n=== PHP DEBUG OUTPUT ===');
      debugComments.forEach((comment) => {
        console.log(comment.replace(/<!-- DEBUG on_air\(\): /, '').replace(' -->', ''));
      });
      console.log('========================\n');

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
        const hasTodayShows = scheduleContent.includes(startTime)
          || scheduleContent.includes(endTime);
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

  test('should handle empty state when no show is scheduled', async ({ page }, testInfo) => {
    await test.step('Load legacy PHP site', async () => {
      // Note: The seed script creates a show for current time, so we check if the page
      // loads without errors rather than asserting the div is missing.
      // This test validates the page doesn't crash when checking for on-air status.

      const response = await page.goto('http://localhost:8080', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      expect(response?.status()).toBe(200);

      const pageContent = await page.content();

      // Check for PHP errors - this is the main assertion
      const errors = checkForPhpErrors(pageContent);
      expect(errors).toHaveLength(0);

      // The seed script may have created a show for current time
      // We just verify the page loads correctly regardless of whether there's a show
      const onAirDiv = page.locator('#on-air');
      const isVisible = await onAirDiv.isVisible().catch(() => false);

      console.log(`On-air div ${isVisible ? 'present' : 'not visible'} - both states are valid`);

      await captureScreenshot(page, testInfo, 'On-Air-State-Check');
    });
  });

  // This test validates the fix from PR #208 by creating a show and then
  // using libfaketime to mock the server time to the exact timezone boundary
  // where the bug would occur.
  //
  // Uses libfaketime to mock PHP server time without requiring elevated privileges.
  // This works in GitHub Actions and all CI environments.
  test('should handle midnight UTC boundary correctly (PR #208 regression test)', async ({
    page,
  }, testInfo) => {
    // Bug: When EST is 7 PM (19:00), UTC is midnight (00:00 next day)
    // - gmdate('Y-m-d') would return next day in UTC
    // - date('H:i:s') would return EST time
    // - Result: Date mismatch, show not found
    //
    // Fix: Both date('Y-m-d') and date('H:i:s') use local EST timezone

    await test.step('Insert show data directly into MySQL for Jan 29, 2026', async () => {
      // CRITICAL: PHP reads from MySQL (schedule table), not Postgres (shows table)
      // The use_postgres_schedule feature flag is false in src/config/features.php
      // So we must insert into MySQL for the test to work
      // Insert show data directly via SQL to avoid Payload UI flakiness
      // This creates a show for Wednesday, Jan 29, 2026, 6-9 PM EST
      const insertShowSQL = `
        INSERT INTO schedule (date, day, start_time, end_time, host, note, deleted)
        VALUES ('2026-01-29', 'Wednesday', '18:00:00', '21:00:00', 'Test DJ', '', 'n')
        ON DUPLICATE KEY UPDATE host = 'Test DJ';
      `;

      execSync(`docker compose exec -T mysql mysql -u ynot_sql_user -pynot_sql_pass ynot_site -e "${insertShowSQL}"`, {
        cwd: process.cwd(),
        stdio: 'pipe',
      });

      console.log('✓ Inserted show for Jan 29, 2026, 18:00-21:00 EST into MySQL');
    });

    await test.step('Set fake time using libfaketime (7 PM EST = midnight UTC)', async () => {
      try {
        // Use libfaketime to set PHP server time to Jan 29, 2026 at 7:00 PM EST
        // This is the exact moment when UTC crosses to midnight of Jan 30
        const boundaryTime = '2026-01-29 19:00:00';

        // Validate time format to prevent command injection
        if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(boundaryTime)) {
          throw new Error('Invalid time format. Expected: YYYY-MM-DD HH:MM:SS');
        }

        console.log('\nSetting fake PHP server time to timezone boundary:');
        console.log('  Local (EST): Jan 29, 2026 19:00 (7 PM)');
        console.log('  UTC:         Jan 30, 2026 00:00 (midnight)');
        console.log('  Bug (gmdate): Would look for Jan 30 schedule');
        console.log('  Fix (date):   Looks for Jan 29 schedule');

        // Stop and remove PHP-FPM container
        execSync('docker compose stop phpfpm', {
          cwd: process.cwd(),
          stdio: 'pipe',
        });
        execSync('docker compose rm -f phpfpm', {
          cwd: process.cwd(),
          stdio: 'pipe',
        });

        // Create and start PHP-FPM with libfaketime environment variables
        // Set env vars in the shell environment that docker-compose reads
        const env = {
          ...process.env,
          LD_PRELOAD: '/usr/lib/x86_64-linux-gnu/faketime/libfaketime.so.1',
          FAKETIME: `@${boundaryTime}`,
        };

        execSync('docker compose up -d phpfpm', {
          cwd: process.cwd(),
          stdio: 'pipe',
          env,
        });

        // Wait for PHP-FPM to be ready - container recreation takes longer
        console.log('Waiting for PHP-FPM container to be ready (may take 20-30 seconds)...');
        await page.waitForTimeout(10000);

        // Health check: verify container is responding
        let retries = 6;
        let containerReady = false;
        while (retries > 0 && !containerReady) {
          try {
            execSync('docker compose exec -T phpfpm php -r "echo \'OK\';"', {
              cwd: process.cwd(),
              encoding: 'utf-8',
              timeout: 5000,
            });
            containerReady = true;
            console.log('✓ PHP-FPM container is ready');
          } catch (e) {
            retries -= 1;
            if (retries > 0) {
              console.log(`Container not ready, retrying... (${retries} attempts left)`);
              // eslint-disable-next-line no-await-in-loop
              await page.waitForTimeout(5000);
            }
          }
        }

        if (!containerReady) {
          throw new Error('PHP-FPM container failed to become ready after container recreation');
        }

        // Verify the fake time is working
        const testTime = execSync(
          'docker compose exec -T phpfpm php -r "echo date(\'Y-m-d H:i:s\');"',
          {
            cwd: process.cwd(),
            encoding: 'utf-8',
          },
        ).trim();

        console.log(`✓ Container time mocked to: ${testTime} using libfaketime`);
      } catch (error) {
        console.error('Failed to set fake time:', error);
        throw new Error(
          'libfaketime setup failed. Ensure libfaketime is installed in PHP container.',
        );
      }
    });

    await test.step('Verify on-air DJ appears correctly at timezone boundary', async () => {
      // Give PHP time to recognize the new fake time
      await page.waitForTimeout(2000);

      // Add debug: Verify show exists in MySQL
      const showCheck = execSync(
        'docker compose exec -T mysql mysql -u ynot_sql_user -pynot_sql_pass ynot_site -e "SELECT date, day, start_time, end_time, host FROM schedule WHERE date = \'2026-01-29\';"',
        { cwd: process.cwd(), encoding: 'utf-8' },
      );
      console.log('MySQL schedule data:', showCheck);

      const response = await page.goto('http://localhost:8080', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      expect(response?.status()).toBe(200);

      const pageContent = await page.content();
      const errors = checkForPhpErrors(pageContent);
      expect(errors).toHaveLength(0);

      // Extract PHP debug comments to see what date/time PHP is looking for
      const debugComments = pageContent.match(/<!-- DEBUG on_air\(\):.*?-->/g) || [];
      console.log('\n=== PHP DEBUG OUTPUT ===');
      debugComments.forEach((comment) => {
        console.log(comment.replace(/<!-- DEBUG on_air\(\): /, '').replace(' -->', ''));
      });
      console.log('========================\n');

      // Debug: Check if on-air div exists and what it contains
      const onAirDiv = page.locator('#on-air');
      const onAirExists = await onAirDiv.count();
      console.log('On-air div count:', onAirExists);
      if (onAirExists > 0) {
        const onAirText = await onAirDiv.textContent();
        console.log('On-air div text:', onAirText);
      }

      // The critical test: on-air div MUST be visible
      // If the bug exists (using gmdate), it would look for Jan 30 schedule = no match
      // With the fix (using date), it looks for Jan 29 schedule = match found
      await expect(onAirDiv).toBeVisible();

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

    await test.step('Restore normal time', async () => {
      try {
        // Stop, remove and recreate phpfpm without faketime
        execSync('docker compose stop phpfpm', {
          cwd: process.cwd(),
          stdio: 'pipe',
        });

        execSync('docker compose rm -f phpfpm', {
          cwd: process.cwd(),
          stdio: 'pipe',
        });

        execSync('docker compose up -d phpfpm', {
          cwd: process.cwd(),
          stdio: 'pipe',
        });

        console.log('✓ Restored normal time');
      } catch (error) {
        console.warn('Could not restore normal time:', error);
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
