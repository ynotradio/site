#!/usr/bin/env bash
#
# validate-migrations.sh — Pre-build check for Payload migration status.
#
# Runs `payload migrate:status` with a timeout to detect schema drift early.
# If the check times out or fails, the build is aborted with a clear message
# instead of hanging indefinitely.
#
# Common cause: running `yarn payload:dev` pushes schema changes to the
# database on the fly, without generating migration files.  The next build
# then sees a mismatch and hangs waiting for interactive input.
#
# Usage (called automatically from netlify.toml):
#   npm run validate:migrations
#
# Manual run:
#   bash scripts/validate-migrations.sh

# Note: -e is intentionally omitted so we can inspect $? after `timeout`
# and print a specific error message before exiting.
set -uo pipefail

TIMEOUT_SECONDS="${VALIDATE_MIGRATIONS_TIMEOUT:-60}"

echo "🔍 Validating Payload migration status..."

timeout "$TIMEOUT_SECONDS" npm run payload:migrate:status
EXIT_CODE=$?

if [ "$EXIT_CODE" -eq 124 ]; then
  echo ""
  echo "❌ Migration validation timed out after ${TIMEOUT_SECONDS}s!"
  echo ""
  echo "This usually means Payload detected schema drift and is waiting"
  echo "for interactive input — which can never arrive in a CI environment."
  echo ""
  echo "Your Payload schema likely has changes made in dev mode"
  echo "(yarn payload:dev) that don't have corresponding migration files."
  echo ""
  echo "To fix this:"
  echo "  1. Run 'yarn payload:migrate:create' locally to generate a migration"
  echo "  2. Commit the generated files in payload/migrations/"
  echo "  3. Push again"
  echo ""
  exit 1
fi

if [ "$EXIT_CODE" -ne 0 ]; then
  echo ""
  echo "❌ Migration validation failed (exit code ${EXIT_CODE})!"
  echo ""
  echo "The migration status check was unable to complete successfully."
  echo "This may indicate:"
  echo "  - Schema changes made in dev mode without migration files"
  echo "  - A database connection problem"
  echo "  - An incompatible Payload configuration"
  echo ""
  echo "To fix schema drift:"
  echo "  1. Run 'yarn payload:migrate:create' locally to generate a migration"
  echo "  2. Commit the generated files in payload/migrations/"
  echo "  3. Push again"
  echo ""
  exit 1
fi

echo ""
echo "✅ Migration status is clean — build can proceed"
