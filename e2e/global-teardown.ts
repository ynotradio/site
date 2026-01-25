/* eslint-disable no-console */

/**
 * Global teardown for E2E tests
 *
 * Note: Docker cleanup is intentionally NOT performed here.
 * - In CI: The workflow cleanup step handles `docker compose down -v`
 *   This avoids duplicate teardown and prevents web server connection errors
 *   that occur when the database is terminated while the web server is still connected.
 * - In local dev: Containers are left running for faster re-runs.
 */
async function globalTeardown() {
  console.log('\n🧹 E2E test environment teardown...\n');

  if (process.env.CI) {
    console.log('⏭️  Skipping Docker shutdown (CI workflow cleanup handles this)\n');
  } else {
    console.log('⏭️  Skipping Docker shutdown (local dev - containers will keep running)');
    console.log('   To manually stop: docker compose down\n');
  }

  console.log('✅ E2E test environment teardown complete!\n');
}

export default globalTeardown;
