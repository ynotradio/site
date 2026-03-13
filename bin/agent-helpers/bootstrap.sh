#!/usr/bin/env bash
# Bootstrap the agent's Node.js development environment.
#
# Run this ONCE at the start of every coding agent session so that
# yarn lint, yarn test, and yarn test:e2e are available.
#
# Timing:
#   ~12s   — warm Yarn cache (GitHub-hosted runner with existing cache)
#   ~3min  — cold runner (no cache, all packages downloaded)
#
# Usage:
#   source bin/agent-helpers/bootstrap.sh   # to get timing in current shell
#   bash   bin/agent-helpers/bootstrap.sh   # standalone

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

# Skip if already installed
if [ -f node_modules/.bin/eslint ] && [ -f node_modules/.bin/vitest ]; then
  echo "✅ node_modules already installed — skipping"
  exit 0
fi

echo "📦 Installing Node.js dependencies (yarn install --frozen-lockfile)…"
echo "   Warm cache: ~12s  |  Cold runner: up to 3min"
echo ""

START=$(date +%s)
yarn install --frozen-lockfile
END=$(date +%s)
ELAPSED=$((END - START))

echo ""
echo "✅ Done in ${ELAPSED}s. Available commands:"
echo "   yarn lint        — ESLint"
echo "   yarn test        — Vitest unit tests"
echo "   yarn test:e2e    — Playwright E2E tests (requires services running)"
