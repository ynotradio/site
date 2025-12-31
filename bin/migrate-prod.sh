#!/bin/bash
# Run Payload migrations against production database
# Usage: ./bin/migrate-prod.sh [command]
# Commands: status (default), migrate, create

set -e

# Load .env.local and get production database URL
if [ -f .env.local ]; then
  export $(grep "^NEON_PROD_DATABASE_URL=" .env.local | xargs)
  export DATABASE_URI="$NEON_PROD_DATABASE_URL"
else
  echo "Error: .env.local file not found"
  exit 1
fi

# Check if DATABASE_URI is set
if [ -z "$DATABASE_URI" ]; then
  echo "Error: NEON_PROD_DATABASE_URL not found in .env.local"
  exit 1
fi

COMMAND="${1:-status}"

echo "Running migration command against PRODUCTION database..."
echo "Database: $(echo $DATABASE_URI | sed 's/@.*/@.../g')"
echo ""

case "$COMMAND" in
  status)
    npx tsx node_modules/.bin/payload migrate:status
    ;;
  migrate)
    npx tsx node_modules/.bin/payload migrate
    ;;
  create)
    npx tsx node_modules/.bin/payload migrate:create
    ;;
  *)
    echo "Unknown command: $COMMAND"
    echo "Valid commands: status, migrate, create"
    exit 1
    ;;
esac
