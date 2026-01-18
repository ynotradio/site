/* eslint-disable no-console, complexity */
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Global setup for E2E tests
 * - Checks for .env.local file
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

    console.log('✅ E2E test environment setup complete!\n');
    console.log('ℹ️  Docker services should be running:');
    console.log('   - PostgreSQL on port 5432 (for Payload CMS data)\n');
  } catch (error) {
    console.error('❌ Error during E2E test environment setup:', error);
    throw error;
  }
}

export default globalSetup;
