/* eslint-disable no-console */
import { execSync } from 'child_process';
import { join } from 'path';

/**
 * Global teardown for E2E tests
 * - Stops Docker Compose services
 * - Cleans up resources
 */
async function globalTeardown() {
  console.log('\n🧹 Starting E2E test environment teardown...\n');

  const projectRoot = join(__dirname, '..');

  try {
    // Stop Docker Compose services
    console.log('🛑 Stopping Docker Compose services...');
    execSync('docker compose down', { cwd: projectRoot, stdio: 'inherit' });
    console.log('✅ Docker services stopped\n');

    console.log('✅ E2E test environment teardown complete!\n');
  } catch (error) {
    console.error('❌ Error during E2E test environment teardown:', error);
    // Don't throw - we want teardown to be best-effort
  }
}

export default globalTeardown;
