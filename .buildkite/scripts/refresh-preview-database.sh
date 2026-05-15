#!/usr/bin/env bash
# Refresh the preview database from the production database using pg_dump/psql.
# This is provider-neutral and works for Neon today and Netlify Databases later.

set -euo pipefail

: "${PRODUCTION_DATABASE_URL:?PRODUCTION_DATABASE_URL must be set}"
: "${PREVIEW_DATABASE_URL:?PREVIEW_DATABASE_URL must be set}"

echo "--- :floppy_disk: Dumping production database and restoring into preview"
pg_dump \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --format=plain \
  "$PRODUCTION_DATABASE_URL" \
  | psql "$PREVIEW_DATABASE_URL"

echo "✅ Preview database refresh complete"
