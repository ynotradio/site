#!/usr/bin/env bash
set -euo pipefail

#
# Initialize MySQL Database Schema
# This script encapsulates MySQL database initialization from .github/workflows/e2e.yml
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "🗄️  Initializing MySQL database..."

# Wait a bit more for MySQL to be fully ready
sleep 5

# Create database and verify it worked
echo "   Creating database..."
if docker compose exec -T mysql bash -c 'MYSQL_PWD=root mysql -u root -e "CREATE DATABASE IF NOT EXISTS ynot_site;"'; then
  echo "✅ Database created"
else
  echo "❌ Failed to create database"
  exit 1
fi

# Import schema if available
if [ -f "src/db/docker/ynot_db.sql" ]; then
  echo "   Importing MySQL schema..."
  docker compose exec -T mysql bash -c 'MYSQL_PWD=root mysql -u root ynot_site' < src/db/docker/ynot_db.sql
  echo "✅ Schema imported successfully"
else
  echo "⚠️  Warning: Schema file not found at src/db/docker/ynot_db.sql"
  echo "   Seeding may fail without schema"
fi

echo "✅ MySQL database initialized!"
