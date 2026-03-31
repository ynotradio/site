#!/usr/bin/env bash
#
# Checks for code-relevant file changes in PR builds.
#
# If only docs/markdown/agent-instruction files changed, skips CI to save
# build minutes. For non-PR builds (push to master, manual triggers) the
# full CI pipeline always runs.
#
# Called as the first step in pipeline.yml. Dynamically uploads either
# pipeline-ci.yml (full CI) or a lightweight "skipped" notification step.

set -euo pipefail

# Non-PR builds (push to master, manual, scheduled) always run full CI.
if [ "${BUILDKITE_PULL_REQUEST:-false}" = "false" ]; then
  echo "Not a PR build — running full CI pipeline."
  buildkite-agent pipeline upload .buildkite/pipeline-ci.yml
  exit 0
fi

# PR build — compare against the base branch.
echo "PR #${BUILDKITE_PULL_REQUEST}: checking for code changes vs origin/master..."
git fetch origin master --depth=1 2>/dev/null || true

CHANGED_FILES=$(git diff --name-only origin/master HEAD 2>/dev/null || echo "DIFF_FAILED")

# If the diff fails (e.g. very shallow clone), run CI to be safe.
if [ "$CHANGED_FILES" = "DIFF_FAILED" ]; then
  echo "Could not determine changed files — running full CI to be safe."
  buildkite-agent pipeline upload .buildkite/pipeline-ci.yml
  exit 0
fi

if [ -z "$CHANGED_FILES" ]; then
  echo "No files changed — skipping CI."
  exit 0
fi

echo "Changed files:"
echo "$CHANGED_FILES"
echo ""

# Skip CI only when ALL changes are docs/markdown/agent-instruction files.
# Any file outside these patterns is treated as a code change.
CODE_CHANGES=$(echo "$CHANGED_FILES" \
  | grep -vE '^(docs/|\.claude/)|\.md$|\.txt$' \
  || true)

if [ -z "$CODE_CHANGES" ]; then
  echo "All changes are docs/markdown/agent-instruction files only — skipping CI."
  cat << 'PIPELINE_EOF' | buildkite-agent pipeline upload
steps:
  - label: ":page_facing_up: Docs-only PR — CI skipped"
    command: |
      echo "All changes in this PR are documentation or markdown only."
      echo "Skipping CI to save build time."
    agents:
      queue: "default"
PIPELINE_EOF
  exit 0
fi

echo "Code changes detected:"
echo "$CODE_CHANGES"
echo ""

# Set metadata about which ecosystems changed so pipeline steps can skip
# unnecessary work (e.g. PHP lint on a JS-only PR).
HAS_PHP=$(echo "$CODE_CHANGES" | grep -qE '^src/|\.php$' && echo "true" || echo "false")
HAS_JS=$(echo "$CODE_CHANGES" | grep -qE '\.(tsx?|jsx?|mjs|cjs)$|^app/|^payload/|^\.storybook/|^e2e/|package\.json|yarn\.lock' && echo "true" || echo "false")
HAS_DOCKER=$(echo "$CODE_CHANGES" | grep -qE 'Dockerfile|docker-compose|\.buildkite/' && echo "true" || echo "false")

buildkite-agent meta-data set "has-php-changes" "$HAS_PHP"
buildkite-agent meta-data set "has-js-changes" "$HAS_JS"
buildkite-agent meta-data set "has-docker-changes" "$HAS_DOCKER"
echo "Metadata: php=$HAS_PHP js=$HAS_JS docker=$HAS_DOCKER"

# Derive skip flags (inverted: "false" changes → "true" skip)
SKIP_PHP="false"
SKIP_JS="false"
[ "$HAS_PHP" = "false" ] && SKIP_PHP="true"
[ "$HAS_JS" = "false" ] && SKIP_JS="true"

echo "Running full CI pipeline... (skip_php=$SKIP_PHP skip_js=$SKIP_JS)"

# Inject skip flags into the pipeline env block so steps can exit early.
# For non-PR builds this function isn't called — defaults in pipeline-ci.yml are "false".
sed \
  -e "s/SKIP_PHP: \"false\"/SKIP_PHP: \"$SKIP_PHP\"/" \
  -e "s/SKIP_JS: \"false\"/SKIP_JS: \"$SKIP_JS\"/" \
  .buildkite/pipeline-ci.yml | buildkite-agent pipeline upload
