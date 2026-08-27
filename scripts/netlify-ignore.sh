#!/usr/bin/env bash
#
# Netlify ignore-build script — skips builds when no deployable files changed.
#
# How it works:
#   Netlify runs this before every build. Exit 0 = skip build, exit 1 = build.
#   Uses git diff against $CACHED_COMMIT_REF to check if any Payload/Next.js
#   files changed. Skips builds triggered by doc-only, CI-only, Storybook-only,
#   or PHP-only changes.
#
# Docs: https://docs.netlify.com/configure-builds/ignore-builds/

set -euo pipefail

# Directories/files that trigger a Netlify build (Payload CMS / Next.js app)
DEPLOY_PATHS=(
  app/
  payload/
  netlify/
  public/
  next.config.mjs
  middleware.ts
  payload.config.ts
  package.json
  yarn.lock
  tsconfig.json
  tsconfig.build.json
  next-env.d.ts
  netlify.toml
)

# File patterns to always ignore even if they're under a deploy path.
# These never affect the Next.js/Payload production build.
is_non_deploy_file() {
  local file="$1"
  case "$file" in
    *.stories.tsx|*.stories.ts|*.stories.jsx|*.stories.js) return 0 ;;
    *.test.tsx|*.test.ts|*.test.jsx|*.test.js)             return 0 ;;
    *.spec.tsx|*.spec.ts|*.spec.jsx|*.spec.js)             return 0 ;;
    *.md)                                                   return 0 ;;
    .storybook/*)                                           return 0 ;;
    *)                                                      return 1 ;;
  esac
}

# If CACHED_COMMIT_REF is empty (first build), always build
if [ -z "${CACHED_COMMIT_REF:-}" ]; then
  echo "No cached commit ref — first build, proceeding."
  exit 1
fi

echo "Comparing $CACHED_COMMIT_REF...$COMMIT_REF"
echo "Checking for changes in deploy-relevant paths..."

CHANGED_FILES=$(git diff --name-only "$CACHED_COMMIT_REF" "$COMMIT_REF" 2>/dev/null || echo "DIFF_FAILED")

# If git diff fails (e.g. shallow clone), build to be safe
if [ "$CHANGED_FILES" = "DIFF_FAILED" ]; then
  echo "git diff failed — building to be safe."
  exit 1
fi

if [ -z "$CHANGED_FILES" ]; then
  echo "No files changed at all — skipping build."
  exit 0
fi

echo "Changed files:"
echo "$CHANGED_FILES" | head -30
TOTAL=$(echo "$CHANGED_FILES" | wc -l | tr -d ' ')
[ "$TOTAL" -gt 30 ] && echo "... and $((TOTAL - 30)) more"

# Check if any changed file is under a deploy-relevant path AND is not excluded
for file in $CHANGED_FILES; do
  # Skip files that never affect the production build
  if is_non_deploy_file "$file"; then
    continue
  fi

  for path in "${DEPLOY_PATHS[@]}"; do
    if [[ "$file" == "$path"* ]] || [[ "$file" == "$path" ]]; then
      echo ""
      echo "Deploy-relevant change detected: $file (matches $path)"
      echo "Proceeding with build."
      exit 1
    fi
  done
done

echo ""
echo "No deploy-relevant changes found — skipping build."
exit 0
