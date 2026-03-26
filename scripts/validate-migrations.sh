#!/usr/bin/env bash
#
# validate-migrations.sh — Pre-build check for Payload migration status.
#
# Runs `payload migrate:status --forceAcceptWarning` with a timeout to detect
# schema drift early.  If the check times out or fails, the build is aborted
# with a clear message instead of hanging indefinitely.
#
# Common cause: running `yarn payload:dev` pushes schema changes to the
# database on the fly, without generating migration files.  The next build
# then sees a mismatch.  `--forceAcceptWarning` prevents the command from
# waiting for interactive confirmation, so drift is detected immediately.
#
# Usage (called automatically from netlify.toml):
#   yarn validate:migrations
#
# Manual run:
#   bash scripts/validate-migrations.sh

# Note: -e is intentionally omitted so we can inspect $? after `timeout`
# and print a specific error message before exiting.
set -uo pipefail

TIMEOUT_SECONDS="${VALIDATE_MIGRATIONS_TIMEOUT:-60}"

echo "🔍 Validating Payload migration status..."

timeout "$TIMEOUT_SECONDS" yarn payload:migrate:status
EXIT_CODE=$?

if [ "$EXIT_CODE" -eq 124 ]; then
  echo ""
  echo "❌ Migration validation timed out after ${TIMEOUT_SECONDS}s!"
  echo ""
  echo "Payload was unable to report migration status — this usually means"
  echo "a database connection problem or an unexpected hang."
  echo ""
  echo "If schema drift is suspected:"
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
  echo "Payload detected unapplied migrations or schema drift."
  echo "This may have been caused by running 'yarn payload:dev', which"
  echo "can push schema changes to the database without creating migration files."
  echo ""
  echo "To fix this:"
  echo "  1. Run 'yarn payload:migrate:create' locally to generate a migration"
  echo "  2. Commit the generated files in payload/migrations/"
  echo "  3. Push again"
  echo ""
  exit 1
fi

echo ""
echo "✅ Migration status is clean — build can proceed"

