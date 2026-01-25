/* eslint-disable no-console, complexity */
import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

/**
 * Global setup for E2E tests
 * Ensures test environment is ready before Playwright starts
 *
 * SIMPLIFIED VERSION - Just checks services, skips seeding
 */
async function globalSetup() {
  console.log('\n🚀 Playwright Global Setup...\n');

  const projectRoot = join(__dirname, '..');

  try {
    // Check if .env.local exists
    const envPath = join(projectRoot, '.env.local');
    try {
      readFileSync(envPath);
      console.log('✅ .env.local exists\n');
    } catch (error) {
      console.warn('⚠️  .env.local not found');
      console.warn('   Run: yarn setup:e2e\n');
    }

    // Check if Docker services are running and healthy
    console.log('🐳 Checking Docker services...');
    try {
      // Check if all required services are running
      const postgresStatus = execSync('docker compose ps postgres --format "{{.Status}}"', {
        cwd: projectRoot,
        encoding: 'utf-8',
      }).trim();

      const apacheStatus = execSync('docker compose ps apache --format "{{.Status}}"', {
        cwd: projectRoot,
        encoding: 'utf-8',
      }).trim();

      if (
        postgresStatus.includes('Up')
        && postgresStatus.includes('healthy')
        && apacheStatus.includes('Up')
      ) {
        console.log('✅ Docker services are running and healthy\n');
      } else {
        throw new Error('Services not all running');
      }
    } catch {
      console.log('⚠️  Docker services not running or unhealthy');
      console.log('   Starting services...\n');

      execSync('docker compose up -d postgres mysql phpfpm apache', {
        cwd: projectRoot,
        stdio: 'inherit',
      });

      // Wait for services to be healthy
      console.log('⏳ Waiting for services to be healthy...');
      execSync('./bin/wait-for-docker-services.sh', {
        cwd: projectRoot,
        stdio: 'inherit',
      });
    }

    console.log('✅ Global setup complete!\n');

    // Seed databases in CI, skip in local dev (assume data exists)
    if (process.env.CI) {
      console.log('🌱 Setting up Payload database (CI mode)...\n');

      try {
        // Seed the database (migrations happen automatically when Payload starts)
        console.log('🌱 Seeding Payload database...');
        execSync('yarn seed:payload', {
          cwd: projectRoot,
          stdio: 'inherit',
          timeout: 60000,
        });
        console.log('✅ Payload database ready\n');
      } catch (error) {
        console.error('❌ Failed to setup Payload database:', error);
        throw error;
      }
    } else {
      console.log('⏭️  Skipping database seeding - assuming data already exists');
      console.log('   To re-seed manually: yarn seed:payload\n');
    }
  } catch (error) {
    console.error('❌ Error during global setup:', error);
    throw error;
  }
}

export default globalSetup;
