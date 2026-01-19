/* eslint-disable no-console, complexity */
import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

/**
 * Global setup for E2E tests
 * Ensures test environment is ready before Playwright starts
 * 
 * In CI: Docker services already started by setup-e2e-tests.sh
 * Locally: Starts Docker services if not running
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

    // Check if Docker services are running
    console.log('🐳 Checking Docker services...');
    try {
      execSync('docker compose ps postgres', {
        cwd: projectRoot,
        stdio: 'pipe',
      });
      console.log('✅ Docker services are running\n');
    } catch {
      console.log('⚠️  Docker services not running');
      console.log('   Starting services (this happens automatically locally)...\n');
      
      // Start services using the same script as CI
      execSync('docker compose up -d postgres mysql phpfpm apache', {
        cwd: projectRoot,
        stdio: 'inherit',
      });
      
      // Wait for Postgres using the shared script
      execSync('./bin/wait-for-docker-services.sh', {
        cwd: projectRoot,
        stdio: 'inherit',
      });
    }

    // Reset database for clean test state
    console.log('🗑️  Resetting database schema...');
    try {
      execSync(
        'docker compose exec -T postgres psql -U ynot_postgres_user -d ynot_payload_dev -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"',
        {
          cwd: projectRoot,
          stdio: 'pipe',
        },
      );
      console.log('✅ Database schema reset\n');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Failed to reset schema:', errorMessage);
      throw error;
    }

    // Seed Payload database
    // The seed script initializes Payload which auto-pushes schema in dev mode
    console.log('🌱 Seeding Payload database...');
    try {
      execSync('yarn seed:payload', {
        cwd: projectRoot,
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'development',
          PAYLOAD_DEV_EMAIL: 'admin@ynotradio.net',
          PAYLOAD_DEV_PASSWORD: 'password',
        },
      });
      console.log('✅ Payload database seeded\n');
    } catch (error) {
      console.error('❌ Failed to seed Payload database:', error);
      throw error;
    }

    console.log('✅ Global setup complete!\n');
  } catch (error) {
    console.error('❌ Error during global setup:', error);
    throw error;
  }
}

export default globalSetup;
