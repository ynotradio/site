/* eslint-disable no-console, complexity */
import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

async function globalSetup() {
  console.log('\n🚀 Playwright Global Setup...\n');

  const projectRoot = join(__dirname, '..');

  try {
    checkEnvFile(projectRoot);
    await handleDockerServices(projectRoot);
    await handleDatabaseSeeding(projectRoot);
    
    console.log('✅ Global setup complete!\n');
  } catch (error) {
    console.error('❌ Error during global setup:', error);
    throw error;
  }
}

function checkEnvFile(projectRoot: string): void {
  const envPath = join(projectRoot, '.env.local');
  try {
    readFileSync(envPath);
    console.log('✅ .env.local exists\n');
  } catch {
    console.warn('⚠️  .env.local not found');
    console.warn('   Run: yarn setup:e2e\n');
  }
}

async function handleDockerServices(projectRoot: string): Promise<void> {
  if (process.env.CI) {
    console.log('⏭️  CI mode: Skipping Docker service checks (services started externally)\n');
    return;
  }

  console.log('🐳 Checking Docker services...');
  
  if (areDockerServicesHealthy(projectRoot)) {
    console.log('✅ Docker services are running and healthy\n');
  } else {
    startDockerServices(projectRoot);
  }
}

function areDockerServicesHealthy(projectRoot: string): boolean {
  try {
    const postgresStatus = execSync('docker compose ps postgres --format "{{.Status}}"', {
      cwd: projectRoot,
      encoding: 'utf-8',
    }).trim();

    const apacheStatus = execSync('docker compose ps apache --format "{{.Status}}"', {
      cwd: projectRoot,
      encoding: 'utf-8',
    }).trim();

    return postgresStatus.includes('Up')
      && postgresStatus.includes('healthy')
      && apacheStatus.includes('Up');
  } catch {
    return false;
  }
}

function startDockerServices(projectRoot: string): void {
  console.log('⚠️  Docker services not running or unhealthy');
  console.log('   Starting services...\n');

  execSync('docker compose up -d postgres mysql phpfpm apache', {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  console.log('⏳ Waiting for services to be healthy...');
  execSync('./bin/wait-for-docker-services.sh', {
    cwd: projectRoot,
    stdio: 'inherit',
  });
}

async function handleDatabaseSeeding(projectRoot: string): Promise<void> {
  if (process.env.SKIP_PAYLOAD_SEED) {
    console.log('⏭️  Skipping database seeding - SKIP_PAYLOAD_SEED is set\n');
    return;
  }

  if (!process.env.CI) {
    console.log('⏭️  Skipping database seeding - assuming data already exists');
    console.log('   To re-seed manually: yarn seed:payload\n');
    return;
  }

  console.log('🌱 Setting up Payload database (CI mode)...\n');

  try {
    console.log('🌱 Seeding Payload database...');
    execSync('yarn --ignore-engines seed:payload', {
      cwd: projectRoot,
      stdio: 'inherit',
      timeout: 60000,
    });
    console.log('✅ Payload database ready\n');
  } catch (error) {
    console.error('❌ Failed to setup Payload database:', error);
    throw error;
  }
}

export default globalSetup;
