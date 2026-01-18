/* eslint-disable no-console, complexity */
import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

/**
 * Global setup for E2E tests
 * - Checks for .env.local file
 * - Runs Payload migrations to set up PostgreSQL schema
 * - Note: Docker Compose services should be started before running tests
 *   - In CI: workflow handles Docker Compose
 *   - Locally: run `docker compose up -d` manually or let tests handle it
 */
async function globalSetup() {
  console.log('\n🚀 Starting E2E test environment setup...\n');

  const projectRoot = join(__dirname, '..');

  try {
    // Check if .env.local exists
    const envPath = join(projectRoot, '.env.local');
    try {
      readFileSync(envPath);
      console.log('✅ .env.local exists\n');
    } catch (error) {
      console.warn('⚠️  .env.local not found');
      console.warn('   Make sure .env.local is configured with DATABASE_URI\n');
    }

    // Run Payload migrations to set up PostgreSQL schema
    console.log('🔄 Running Payload migrations...');
    try {
      execSync('echo "y" | yarn payload:migrate', {
        cwd: projectRoot,
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'development' },
        shell: '/bin/bash',
      });
      console.log('✅ Payload migrations completed\n');
    } catch (error) {
      console.error('❌ Failed to run Payload migrations:', error);
      throw error;
    }

    // Seed Payload database with test data
    console.log('🌱 Seeding Payload database...');
    try {
      execSync('yarn seed:payload', {
        cwd: projectRoot,
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'development' },
      });
      console.log('✅ Payload database seeded\n');
    } catch (error) {
      console.error('❌ Failed to seed Payload database:', error);
      throw error;
    }

    console.log('✅ E2E test environment setup complete!\n');
    console.log('ℹ️  Docker services should be running:');
    console.log('   - PostgreSQL on port 5432 (for Payload CMS data)');
    console.log('   - MySQL on port 3306 (for legacy data)');
    console.log('   - Apache on port 8080 (serving legacy PHP site)\n');
  } catch (error) {
    console.error('❌ Error during E2E test environment setup:', error);
    throw error;
  }
}

export default globalSetup;
