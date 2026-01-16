/* eslint-disable no-console, complexity */
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Helper function to wait for a service with retries
 */
async function waitForService(
  checkFn: () => void,
  serviceName: string,
  maxAttempts = 30,
  delayMs = 2000,
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      checkFn();
      console.log(`✅ ${serviceName} is ready\n`);
      return;
    } catch (error) {
      if (attempt >= maxAttempts) {
        throw new Error(`${serviceName} failed to become ready in time`);
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        setTimeout(resolve, delayMs);
      });
    }
  }
}

/**
 * Global setup for E2E tests
 * - Starts Docker Compose services (MySQL, Postgres, PHP, Apache)
 * - Waits for services to be healthy
 * - Seeds databases with test data
 */
async function globalSetup() {
  console.log('\n🚀 Starting E2E test environment setup...\n');

  const projectRoot = join(__dirname, '..');

  try {
    // Check if Docker is running
    console.log('🐳 Checking Docker status...');
    execSync('docker info', { stdio: 'ignore' });
    console.log('✅ Docker is running\n');

    // Check if .env.local exists
    const envPath = join(projectRoot, '.env.local');
    try {
      readFileSync(envPath);
      console.log('✅ .env.local exists\n');
    } catch (error) {
      console.warn('⚠️  .env.local not found, copying from .env.example...');
      execSync('cp .env.example .env.local', { cwd: projectRoot });
      console.log('✅ Created .env.local from .env.example\n');
      console.log('⚠️  Note: You may need to update DATABASE_URI and other credentials\n');
    }

    // Stop any existing containers
    console.log('🛑 Stopping any existing containers...');
    execSync('docker compose down', { cwd: projectRoot, stdio: 'inherit' });
    console.log('✅ Containers stopped\n');

    // Start Docker Compose services
    console.log('🐳 Starting Docker Compose services...');
    console.log('   This includes: MySQL, Postgres, PHP-FPM, Apache...\n');
    execSync('docker compose up -d', { cwd: projectRoot, stdio: 'inherit' });
    console.log('✅ Docker services started\n');

    // Wait for Postgres to be healthy
    console.log('⏳ Waiting for Postgres to be healthy...');
    await waitForService(() => {
      execSync(
        'docker compose exec -T postgres pg_isready -U ynot_postgres_user -d ynot_payload_dev',
        { cwd: projectRoot, stdio: 'ignore' },
      );
    }, 'Postgres');

    // Wait for MySQL to be ready
    console.log('⏳ Waiting for MySQL to be ready...');
    await waitForService(() => {
      execSync('docker compose exec -T mysql mysqladmin ping -h localhost -u root -proot', {
        cwd: projectRoot,
        stdio: 'ignore',
      });
    }, 'MySQL');

    // Check if Apache is responding
    console.log('⏳ Waiting for Apache to be ready...');
    try {
      await waitForService(() => {
        execSync('curl -f http://localhost:8080 > /dev/null 2>&1', { stdio: 'ignore' });
      }, 'Apache');
    } catch (error) {
      console.warn('⚠️  Apache may not be fully ready, but continuing...\n');
    }

    // Seed legacy MySQL database
    console.log('🌱 Seeding legacy MySQL database...');
    try {
      execSync('yarn seed:legacy', { cwd: projectRoot, stdio: 'inherit' });
      console.log('✅ Legacy database seeded\n');
    } catch (error) {
      console.warn('⚠️  Failed to seed legacy database, continuing...\n');
    }

    // Seed Payload Postgres database
    console.log('🌱 Seeding Payload Postgres database...');
    try {
      execSync('yarn seed:payload', { cwd: projectRoot, stdio: 'inherit' });
      console.log('✅ Payload database seeded\n');
    } catch (error) {
      console.warn('⚠️  Failed to seed Payload database, continuing...\n');
    }

    console.log('✅ E2E test environment setup complete!\n');
    console.log('   Legacy site: http://localhost:8080');
    console.log('   Payload admin: http://localhost:3000/admin (start with yarn payload:dev)\n');
  } catch (error) {
    console.error('❌ Error during E2E test environment setup:', error);
    throw error;
  }
}

export default globalSetup;
