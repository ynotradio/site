#!/usr/bin/env bash
# .buildkite/scripts/build-storybook.sh
# Builds Storybook and deploys preview to Netlify for PRs.
# Called by pipeline-ci.yml — extracted from inline YAML for testability.

set -euo pipefail

export DEBIAN_FRONTEND=noninteractive
apt-get update >/dev/null
apt-get install -y git >/dev/null

# Skip if no storybook-relevant files changed (saves Netlify credits + build time)
if [ "${BUILDKITE_PULL_REQUEST:-false}" != "false" ]; then
  # Fetch the tip of master so we can diff against it. Buildkite shallow-clones
  # only the PR branch, so origin/master won't exist otherwise.
  # Use two-endpoint diff (no merge base needed — works with shallow clones).
  git fetch origin master --depth=1 2>/dev/null || true
  echo "HEAD: $(git rev-parse HEAD)"
  echo "origin/master: $(git rev-parse origin/master 2>/dev/null || echo 'NOT FOUND')"
  STORYBOOK_CHANGES=$(git diff --name-only origin/master HEAD -- \
    'app/' 'payload/src/' '.storybook/' 'package.json' 'yarn.lock' \
    | grep -v '\.test\.\|\.spec\.' || true)
else
  STORYBOOK_CHANGES=$(git diff --name-only HEAD~1 HEAD -- \
    'app/' 'payload/src/' '.storybook/' 'package.json' 'yarn.lock' \
    | grep -v '\.test\.\|\.spec\.' || true)
fi

if [ -z "$STORYBOOK_CHANGES" ]; then
  echo "No storybook-relevant files changed — skipping build."
  exit 0
fi
echo "Storybook-relevant changes detected:"
echo "$STORYBOOK_CHANGES"

corepack enable && yarn install --immutable && yarn build-storybook
if [ "${BUILDKITE_PULL_REQUEST:-false}" != "false" ]; then
  node .buildkite/scripts/deploy-storybook.mjs storybook-static
fi
