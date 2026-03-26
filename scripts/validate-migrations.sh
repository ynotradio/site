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

# Ensure `timeout` is available before attempting to use it.
if ! command -v timeout > /dev/null 2>&1; then
  echo "⚠️  'timeout' command not found — running without a time limit."
  yarn payload:migrate:status
  EXIT_CODE=$?
else
  echo "🔍 Validating Payload migration status..."

  # Capture output so it can be echoed in the failure message.
  STATUS_OUTPUT=$(timeout "$TIMEOUT_SECONDS" yarn payload:migrate:status 2>&1)
  EXIT_CODE=$?

  # Always print what the command produced so CI logs have full context.
  echo "$STATUS_OUTPUT"
fi

# timeout itself can fail with 125 (internal error), 126 (command not
# executable), or 127 (command not found) — these are environment problems,
# not migration drift.
if [ "$EXIT_CODE" -eq 125 ] || [ "$EXIT_CODE" -eq 126 ] || [ "$EXIT_CODE" -eq 127 ]; then
  echo ""
  echo "❌ Migration validation failed — could not run 'yarn payload:migrate:status' (exit code ${EXIT_CODE})."
  echo ""
  echo "This is an environment problem, not a migration issue."
  echo "  exit 125 — timeout encountered an internal error"
  echo "  exit 126 — the command was found but not executable"
  echo "  exit 127 — the command was not found (check that node_modules are installed)"
  echo ""
  exit 1
fi

if [ "$EXIT_CODE" -eq 124 ]; then
  echo ""
  echo "❌ Migration validation timed out after ${TIMEOUT_SECONDS}s!"
  echo ""
  echo "Payload was unable to report migration status within the allowed time."
  echo "Possible causes:"
  echo "  - Database connection problem (check DATABASE_URL / Neon credentials)"
  echo "  - Schema drift from running 'yarn payload:dev' without generating migrations"
  echo ""
  echo "If this is schema drift:"
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
  echo "Possible causes:"
  echo "  - Unapplied migrations (run 'yarn payload:migrate' locally and push)"
  echo "  - Schema drift from 'yarn payload:dev' (run 'yarn payload:migrate:create',"
  echo "    commit the files in payload/migrations/, then push)"
  echo "  - Database connection error (check DATABASE_URL / Neon credentials)"
  echo "  - Missing or invalid environment variables"
  echo ""
  exit 1
fi

echo ""
echo "✅ Migration status is clean — build can proceed"

