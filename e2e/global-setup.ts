/* eslint-disable no-console */
import { execSync } from 'child_process';
import { join } from 'path';

/**
 * Playwright Global Setup
 *
 * CI: Skip all checks (services started externally by Buildkite)
 * Local: Start Docker services if not running
 */
async function globalSetup() {
  console.log('\n🚀 Playwright Global Setup...\n');

  if (process.env.CI) {
    console.log('⏭️  CI mode: Services started externally\n');
    return;
  }

  const projectRoot = join(__dirname, '..');

  // Check if Docker services are running
  try {
    const postgresStatus = execSync('docker compose ps postgres --format "{{.Status}}"', {
      cwd: projectRoot,
      encoding: 'utf-8',
    }).trim();

    if (postgresStatus.includes('Up') && postgresStatus.includes('healthy')) {
      console.log('✅ Docker services are running\n');
      return;
    }
  } catch {
    // Services not running
  }

  console.log('⚠️  Starting Docker services...\n');
  execSync('docker compose up -d postgres mysql phpfpm apache', {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  console.log('⏳ Waiting for services to be healthy...');
  execSync('./bin/wait-for-docker-services.sh', {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  console.log('✅ Global setup complete!\n');
}

export default globalSetup;
