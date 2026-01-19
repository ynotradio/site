#!/usr/bin/env bash
set -euo pipefail

#
# Complete E2E Test Setup
# Unified script used by both CI and local development
# Handles all setup steps from environment to database seeding
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "🚀 E2E Test Setup - Unified for CI and Local"
echo ""

# Step 1: Setup environment files
echo "📝 Step 1/7: Setting up environment files..."
./bin/setup-e2e-env.sh

# Step 2: Install Node dependencies (if needed)
if [ ! -d "node_modules" ] || [ "${SKIP_DEPS_CHECK:-false}" != "true" ]; then
  echo ""
  echo "📦 Step 2/7: Installing Node dependencies..."
  yarn install --frozen-lockfile
else
  echo ""
  echo "⏭️  Step 2/7: Skipping Node dependencies (already installed)"
fi

# Step 3: Install PHP dependencies (if needed)
if [ ! -d "src/vendor" ] || [ "${SKIP_DEPS_CHECK:-false}" != "true" ]; then
  echo ""
  echo "🐘 Step 3/7: Installing PHP dependencies..."
  cd src
  composer install --no-dev --optimize-autoloader
  cd ..
else
  echo ""
  echo "⏭️  Step 3/7: Skipping PHP dependencies (already installed)"
fi

# Step 4: Start Docker services
echo ""
echo "🐳 Step 4/7: Starting Docker services..."
docker compose up -d postgres mysql phpfpm apache
echo "Waiting for services to be ready..."

# Step 5: Wait for services
echo ""
echo "⏳ Step 5/7: Waiting for services..."
./bin/wait-for-docker-services.sh

# Step 6: Initialize MySQL
echo ""
echo "🗄️  Step 6/7: Initializing MySQL database..."
./bin/init-mysql-db.sh

# Step 7: Seed databases
echo ""
echo "🌱 Step 7/7: Seeding databases..."
yarn seed:legacy
# Payload seeding happens in global-setup.ts via Playwright

echo ""
echo "✅ E2E test environment is ready!"
echo ""
echo "Next steps:"
echo "  - Run tests: npx playwright test"
echo "  - Run with UI: npx playwright test --ui"
echo "  - Run specific test: npx playwright test payload-integration"
echo ""
