#!/bin/bash

# Script to import database into local MySQL container
# Usage: ./import_db.sh

set -e  # Exit on error

LOCAL_PATH="src/db/docker/ynot_db.sql"

if [ ! -f "$LOCAL_PATH" ]; then
    echo "❌ Error: SQL file not found at $LOCAL_PATH"
    echo "Run ./bin/pull_db.sh first to download the database"
    exit 1
fi

echo "🔄 Importing database into local MySQL container..."
docker-compose exec mysql mysql -u root -proot -e "CREATE DATABASE IF NOT EXISTS ynot_site;" 2>/dev/null || true
docker-compose exec -T mysql mysql -u root -proot ynot_site < "$LOCAL_PATH"
echo "✅ Database imported successfully"