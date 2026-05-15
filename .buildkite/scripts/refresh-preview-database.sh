#!/usr/bin/env bash
# Refresh the preview database from the production database using pg_dump/psql.
# This is provider-neutral and works for Neon today and Netlify Databases later.

set -euo pipefail

: "${PRODUCTION_DATABASE_URL:?PRODUCTION_DATABASE_URL must be set}"
: "${PREVIEW_DATABASE_URL:?PREVIEW_DATABASE_URL must be set}"

echo "--- :mag: Verifying database connectivity"
pg_isready -d "$PRODUCTION_DATABASE_URL" >/dev/null || {
  echo "❌ Unable to connect to PRODUCTION_DATABASE_URL"
  exit 1
}
pg_isready -d "$PREVIEW_DATABASE_URL" >/dev/null || {
  echo "❌ Unable to connect to PREVIEW_DATABASE_URL"
  exit 1
}

mkdir -p tmp
checkout_path="${BUILDKITE_BUILD_CHECKOUT_PATH:-$PWD}"
dump_file="$(mktemp "${checkout_path}/tmp/preview-refresh.XXXXXX.sql")"
trap 'rm -f "$dump_file"' EXIT

echo "--- :floppy_disk: Dumping production database"
pg_dump \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --format=plain \
  "$PRODUCTION_DATABASE_URL" \
  > "$dump_file"

echo "--- :floppy_disk: Restoring preview database"
psql "$PREVIEW_DATABASE_URL" < "$dump_file"

echo "✅ Preview database refresh complete"
