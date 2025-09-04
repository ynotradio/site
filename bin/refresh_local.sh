#!/bin/bash

# Script to refresh local development environment with latest data
# Usage: ./refresh_local.sh

set -e  # Exit on error

echo "🔄 Refreshing local development environment..."

echo "📥 Step 1: Pulling latest database..."
./bin/pull_db.sh

echo "🗑️  Step 2: Stopping containers and removing volumes..."
docker-compose down -v

echo "🚀 Step 3: Starting containers..."
docker-compose up -d

echo "⏳ Step 4: Waiting for MySQL to be ready..."
sleep 10

echo "📊 Step 5: Importing database..."
./bin/import_db.sh

echo "✅ Local environment refreshed! Site available at http://localhost:8080"