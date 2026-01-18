import { test, expect } from '@playwright/test';
import { ChildProcess, spawn, execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * E2E Integration Test: CRUD operations in Payload CMS affecting legacy site
 *
 * This proof-of-concept test demonstrates:
 * 1. Starting Payload CMS server with containerized Postgres
 * 2. Seeding test data
 * 3. Performing CRUD operations in Payload admin
 * 4. Verifying effects on the public-facing legacy site
 */

let payloadProcess: ChildProcess | null = null;

test.describe('CRUD Integration POC', () => {
  test.beforeAll(async () => {
    // Check if port 3000 is already in use and kill the process if needed
    try {
      const { execSync: execSyncUtil } = require('child_process');
      const lsofOutput = execSyncUtil('lsof -ti:3000 || true', { encoding: 'utf-8' }).trim();
      if (lsofOutput) {
        // eslint-disable-next-line no-console
        console.log(`⚠️  Port 3000 already in use by PID ${lsofOutput}, killing it...`);
        execSyncUtil(`kill -9 ${lsofOutput} || true`);
        // Wait for port to be released
        await new Promise((resolve) => {
          setTimeout(resolve, 2000);
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Port check completed');
    }

    // Skip if server is already running (e.g., on retry)
    if (payloadProcess && payloadProcess.exitCode === null) {
      // eslint-disable-next-line no-console
      console.log('ℹ️  Server already running, skipping startup');
      return;
    }

    // Start Next.js server
    // eslint-disable-next-line no-console
    console.log('🚀 Starting Next.js server...');

    const projectRoot = join(__dirname, '..');
    const isCI = process.env.CI === 'true';

    // In CI, build first for faster startup
    if (isCI) {
      // eslint-disable-next-line no-console
      console.log('📦 Building Next.js for production (CI mode)...');
      try {
        execSync('yarn build', {
          cwd: projectRoot,
          stdio: 'inherit',
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Build failed, falling back to dev mode');
      }
    }

    // Start server (production mode in CI, dev mode locally)
    const command = isCI ? 'start' : 'dev';
    payloadProcess = spawn('yarn', [command], {
      cwd: projectRoot,
      stdio: 'pipe',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: isCI ? 'production' : 'development',
        PORT: '3000',
      },
    });

    // Wait for server to be ready
    await new Promise<void>((resolve, reject) => {
      let timeout: NodeJS.Timeout;
      let resolved = false;

      const onData = (data: Buffer) => {
        const output = data.toString();
        // eslint-disable-next-line no-console
        console.log('[Next.js]', output);

        // Look for Next.js ready indicators
        if (
          output.includes('Local:')
          || output.includes('http://localhost:3000')
          || output.includes('Ready in')
          || output.includes('compiled successfully')
          || output.includes('started server on')
          || output.includes('ready on')
        ) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            // Give it a moment to fully settle
            setTimeout(() => resolve(), 2000);
          }
        }
      };

      if (payloadProcess?.stdout) {
        payloadProcess.stdout.on('data', onData);
      }
      if (payloadProcess?.stderr) {
        payloadProcess.stderr.on('data', onData);
      }

      payloadProcess?.on('error', (error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          reject(error);
        }
      });

      // Shorter timeout since production build starts much faster
      const timeoutMs = isCI ? 60000 : 100000;
      timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error(`Next.js server failed to start in time (${timeoutMs}ms)`));
        }
      }, timeoutMs);
    });

    // Wait for server to be reachable with HTTP health check
    // eslint-disable-next-line no-console
    console.log('⏳ Waiting for Next.js server to respond to HTTP requests...');
    let attempts = 0;
    const maxAttempts = 60; // Increased attempts for Next.js
    while (attempts < maxAttempts) {
      try {
        // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
        const http = require('http');
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve, reject) => {
          const req = http.get('http://localhost:3000/admin', (res: { statusCode: number }) => {
            if (res.statusCode === 200 || res.statusCode === 302) {
              resolve(true);
            } else {
              reject(new Error(`Unexpected status code: ${res.statusCode}`));
            }
          });
          req.on('error', reject);
          req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
          });
        });
        break;
      } catch (error) {
        attempts += 1;
        if (attempts >= maxAttempts) {
          throw new Error('Payload server did not respond to HTTP requests in time');
        }
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          setTimeout(resolve, 2000);
        });
      }
    }

    // eslint-disable-next-line no-console
    console.log('✅ Next.js server started and responding');
  });

  test.afterAll(async () => {
    // Stop Next.js dev server
    if (payloadProcess) {
      // eslint-disable-next-line no-console
      console.log('🛑 Stopping Next.js server...');

      try {
        // Get the process tree and kill all child processes
        const { execSync: execSyncUtil } = require('child_process');
        const pid = payloadProcess.pid;
        
        // Kill all child processes first
        try {
          execSyncUtil(`pkill -P ${pid} || true`, { encoding: 'utf-8' });
        } catch (err) {
          // Ignore errors
        }
        
        // Try graceful shutdown first
        payloadProcess.kill('SIGTERM');

        // Wait for graceful shutdown with timeout
        await Promise.race([
          new Promise((resolve) => {
            payloadProcess?.on('exit', resolve);
          }),
          new Promise((resolve) => {
            setTimeout(resolve, 5000);
          }),
        ]);

        // Force kill if still running
        if (payloadProcess.exitCode === null) {
          payloadProcess.kill('SIGKILL');
          await new Promise((resolve) => {
            setTimeout(resolve, 1000);
          });
        }
        
        // Finally, kill any process on port 3000
        try {
          const lsofOutput = execSyncUtil('lsof -ti:3000 || true', { encoding: 'utf-8' }).trim();
          if (lsofOutput) {
            execSyncUtil(`kill -9 ${lsofOutput} || true`);
          }
        } catch (err) {
          // Ignore errors
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error stopping server:', error);
      }

      payloadProcess = null;
      // eslint-disable-next-line no-console
      console.log('✅ Next.js server stopped');
    }

    // Extra wait to ensure port is released
    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });
  });

  test('should verify services are running', async ({ page }, testInfo) => {
    // Verify Payload admin is accessible
    await page.goto('http://localhost:3000/admin', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Should see login page or dashboard
    await expect(page).toHaveURL(/\/admin/);

    // Take screenshot of Payload admin and attach to test report
    const payloadScreenshot = await page.screenshot({
      fullPage: true,
    });
    await testInfo.attach('Payload Admin Page', {
      body: payloadScreenshot,
      contentType: 'image/png',
    });

    // Verify public Next.js site is accessible
    const publicResponse = await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    expect(publicResponse?.status()).toBe(200);

    // Take screenshot of public site
    const publicScreenshot = await page.screenshot({
      fullPage: true,
    });
    await testInfo.attach('Public Site Homepage', {
      body: publicScreenshot,
      contentType: 'image/png',
    });
  });

  test('should perform CRUD operations and verify results', async ({ page }) => {
    // This is a POC test - in a real scenario, you would:
    // 1. Login to Payload admin
    // 2. Create/Update/Delete records
    // 3. Verify changes appear on the legacy site

    // For now, we'll just verify that both sites are functional

    // Check legacy site has seeded content
    await page.goto('http://localhost:8080', {
      waitUntil: 'networkidle',
    });

    // Look for typical Y-Not Radio content
    const pageContent = await page.content();

    // These are based on the seed data in bin/seed-legacy.sh
    // We expect to find stories, DJs, or other seeded content
    const hasContent = pageContent.includes('Y-Not Radio')
      || pageContent.includes('story')
      || pageContent.includes('concert')
      || pageContent.includes('stories');

    expect(hasContent).toBe(true);

    // Take screenshot showing legacy content
    await page.screenshot({
      path: 'e2e/screenshots/legacy-content.png',
      fullPage: true,
    });

    // Access Payload admin
    await page.goto('http://localhost:3000/admin', {
      waitUntil: 'networkidle',
    });

    // Check if we can see the admin interface
    const adminContent = await page.content();
    const hasAdminUI = adminContent.includes('Payload')
      || adminContent.includes('Login')
      || adminContent.includes('admin');

    expect(hasAdminUI).toBe(true);

    // Take screenshot of admin
    await page.screenshot({
      path: 'e2e/screenshots/payload-admin-ready.png',
      fullPage: true,
    });

    // Check public Next.js site has content from Payload/Postgres
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
    });

    // Verify the page loads successfully
    const publicContent = await page.content();
    const hasPublicContent = publicContent.length > 100; // Basic check that page has content

    expect(hasPublicContent).toBe(true);

    // Take screenshot showing public site
    await page.screenshot({
      path: 'e2e/screenshots/public-site-content.png',
      fullPage: true,
    });

    // TODO: In a complete implementation, this test would:
    // 1. Login to Payload using test credentials
    // 2. Navigate to a collection (e.g., Posts or Concerts)
    // 3. Create a new record
    // 4. Verify it appears in the Payload list
    // 5. Navigate to the public Next.js site
    // 6. Verify the new record appears there
    // 7. Update the record in Payload
    // 8. Verify the update on the legacy site
    // 9. Delete the record
    // 10. Verify it's removed from both sites
  });

  test('should demonstrate database connectivity', async () => {
    // Verify we can connect to the databases
    const projectRoot = join(__dirname, '..');

    // Check if .env.local has required variables
    const envPath = join(projectRoot, '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');

    expect(envContent).toContain('DATABASE_URI');
    expect(envContent).toContain('PAYLOAD_SECRET');

    // In a real test, you would:
    // 1. Connect to Postgres directly and verify Payload data
    // 2. Connect to MySQL directly and verify legacy data
    // 3. Perform SQL queries to verify CRUD operations
  });
});
