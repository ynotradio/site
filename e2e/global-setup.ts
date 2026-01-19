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

    // Check if Docker services are running, start them if not
    console.log('🐳 Checking Docker services...');
    try {
      execSync('docker compose ps postgres', {
        cwd: projectRoot,
        stdio: 'pipe',
      });
      console.log('✅ Docker services are running\n');
    } catch {
      console.log('Starting Docker services...');
      execSync('docker compose up -d postgres mysql phpfpm apache', {
        cwd: projectRoot,
        stdio: 'inherit',
      });
      console.log('Waiting for PostgreSQL to be ready...');
      // Wait for postgres to be ready
      for (let i = 0; i < 30; i += 1) {
        try {
          execSync(
            'docker compose exec -T postgres pg_isready -U ynot_postgres_user -d ynot_payload_dev',
            {
              cwd: projectRoot,
              stdio: 'pipe',
            },
          );
          console.log('✅ PostgreSQL is ready\n');
          break;
        } catch {
          if (i === 29) {
            throw new Error('PostgreSQL failed to start after 60 seconds');
          }
          // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    // Clear existing data to ensure clean test environment
    // Drop and recreate the schema for a completely fresh state
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

    // Seed Payload database with test data
    // Note: The seed script will initialize Payload which automatically
    // pushes the schema to the database in development mode
    console.log('🌱 Seeding Payload database...');
    try {
      execSync('yarn seed:payload', {
        cwd: projectRoot,
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'development',
          // Use consistent test credentials for E2E tests
          PAYLOAD_DEV_EMAIL: 'admin@ynotradio.net',
          PAYLOAD_DEV_PASSWORD: 'password',
        },
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
