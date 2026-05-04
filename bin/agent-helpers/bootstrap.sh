#!/usr/bin/env bash
# Bootstrap the agent's Node.js development environment.
#
# Run this ONCE at the start of every coding agent session so that
# yarn lint, yarn test, and yarn test:e2e are available.
#
# IMPORTANT: Use `source` (not `bash`) so that the Node.js version switch
# takes effect in your current shell session:
#
#   source bin/agent-helpers/bootstrap.sh
#
# Timing:
#   ~12s   — warm Yarn cache (GitHub-hosted runner with existing cache)
#   ~3min  — cold runner (no cache, all packages downloaded)

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

# ── Node.js version check ─────────────────────────────────────────────────────
REQUIRED_NODE="$(cat .nvmrc)"
CURRENT_MAJOR="$(node --version 2>/dev/null | sed 's/v\([0-9]*\).*/\1/' || echo 0)"

if [ "$CURRENT_MAJOR" -lt "$REQUIRED_NODE" ]; then
  CURRENT_VER="$(node --version 2>/dev/null || echo 'not found')"
  echo "⚠️  Node.js ${CURRENT_VER} detected, but v${REQUIRED_NODE} is required (.nvmrc)."

  if [ -f "$HOME/.nvm/nvm.sh" ]; then
    echo "🔄 Activating nvm to switch to Node.js ${REQUIRED_NODE}…"
    # shellcheck source=/dev/null
    source "$HOME/.nvm/nvm.sh"

    if nvm use "$REQUIRED_NODE" 2>/dev/null || nvm install "$REQUIRED_NODE"; then
      echo "✅ Now using Node.js $(node --version)"
    else
      echo ""
      echo "❌ BLOCKER: Could not switch to Node.js ${REQUIRED_NODE} via nvm."
      echo ""
      echo "   STOP. Report this blocker before continuing:"
      echo "   > Bootstrap failed: Node.js ${REQUIRED_NODE} required but nvm install/use failed."
      echo "   > Manual fix: nvm install ${REQUIRED_NODE} && nvm use ${REQUIRED_NODE}"
      return 1 2>/dev/null || exit 1
    fi
  else
    echo ""
    echo "❌ BLOCKER: Node.js ${REQUIRED_NODE} is required (current: ${CURRENT_VER}) and nvm"
    echo "   is not available to switch automatically."
    echo ""
    echo "   STOP. Report this blocker before continuing:"
    echo "   > Bootstrap failed: Node.js ${REQUIRED_NODE} required, got ${CURRENT_VER}, nvm unavailable."
    return 1 2>/dev/null || exit 1
  fi
fi

# ── Install node_modules ──────────────────────────────────────────────────────

# Skip if already installed
if [ -f node_modules/.bin/eslint ] && [ -f node_modules/.bin/vitest ]; then
  echo "✅ node_modules already installed — skipping"
  return 0 2>/dev/null || exit 0
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
