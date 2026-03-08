#!/bin/bash
# Posts or updates a GitHub PR comment with a link to the Storybook build artifacts.
# Uses a GitHub token stored as a Buildkite secret (GITHUB_PR_TOKEN) to authenticate.
#
# Setup: Store a fine-grained GitHub PAT with pull_requests:write permission
# as a Buildkite secret named GITHUB_PR_TOKEN:
#   buildkite-agent secret set GITHUB_PR_TOKEN <your-token>
# Or add it in the Buildkite UI under Pipeline Settings → Secrets.
#
# Requires: BUILDKITE_PULL_REQUEST, BUILDKITE_REPO, BUILDKITE_BUILD_URL,
#           BUILDKITE_COMMIT, BUILDKITE_BUILD_NUMBER

set -euo pipefail

COMMENT_MARKER="<!-- storybook-preview -->"

# Only run on pull request builds
if [[ "${BUILDKITE_PULL_REQUEST:-false}" == "false" ]]; then
  echo "Not a pull request build, skipping Storybook comment"
  exit 0
fi

# Obtain a GitHub token — try Buildkite secrets first, then environment variable
echo "--- :github: Obtaining GitHub token"
GITHUB_TOKEN=""

# Method 1: Buildkite secret (preferred)
if command -v buildkite-agent &>/dev/null; then
  GITHUB_TOKEN=$(buildkite-agent secret get GITHUB_PR_TOKEN 2>/dev/null || true)
fi

# Method 2: Environment variable fallback
if [[ -z "${GITHUB_TOKEN}" ]]; then
  GITHUB_TOKEN="${GITHUB_PR_TOKEN:-}"
fi

if [[ -z "${GITHUB_TOKEN}" ]]; then
  echo "⚠️ No GitHub token found. To enable Storybook PR comments:"
  echo "   Store a fine-grained PAT (with pull_requests:write on this repo)"
  echo "   as a Buildkite secret named GITHUB_PR_TOKEN."
  echo ""
  echo "   Via CLI:  buildkite-agent secret set GITHUB_PR_TOKEN <token>"
  echo "   Via UI:   Pipeline Settings → Secrets → Add Secret"
  exit 0
fi

# Extract owner/repo from the Buildkite repo URL
# Handles: https://github.com/owner/repo.git, git@github.com:owner/repo.git
REPO_SLUG=$(echo "${BUILDKITE_REPO}" | sed -E 's#(https?://github\.com/|git@github\.com:)##; s/\.git$//')

PR_NUMBER="${BUILDKITE_PULL_REQUEST}"
BUILD_URL="${BUILDKITE_BUILD_URL}"
SHORT_SHA="${BUILDKITE_COMMIT:0:7}"
BUILD_NUMBER="${BUILDKITE_BUILD_NUMBER}"

COMMENT_BODY="${COMMENT_MARKER}
## 📖 Storybook Preview

**Build [#${BUILD_NUMBER}](${BUILD_URL})** — commit \`${SHORT_SHA}\`

The Storybook build artifacts are attached to the Buildkite build.

[**View Build →**](${BUILD_URL})

<details>
<summary>How to browse the Storybook locally</summary>

1. Install the Buildkite CLI or download the artifacts from the build page
2. Extract the \`storybook-static\` directory
3. Serve it locally:
   \`\`\`bash
   npx http-server storybook-static -o
   \`\`\`

</details>"

# Look for an existing Storybook comment to update (best-effort; if this
# fails we'll just create a new comment instead of updating).
echo "--- :github: Posting Storybook comment to PR #${PR_NUMBER}"
EXISTING_COMMENT_ID=$(curl -sSf \
  -H "Authorization: token ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/${REPO_SLUG}/issues/${PR_NUMBER}/comments?per_page=100" \
  | jq -r ".[] | select(.body | startswith(\"${COMMENT_MARKER}\")) | .id" \
  | head -n1 \
  || true)

if [[ -n "${EXISTING_COMMENT_ID}" ]]; then
  # Update the existing comment
  curl -sSf \
    -X PATCH \
    -H "Authorization: token ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/${REPO_SLUG}/issues/comments/${EXISTING_COMMENT_ID}" \
    -d "$(jq -n --arg body "$COMMENT_BODY" '{body: $body}')" > /dev/null
  echo "✅ Updated existing Storybook comment (ID: ${EXISTING_COMMENT_ID})"
else
  # Create a new comment
  curl -sSf \
    -X POST \
    -H "Authorization: token ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/${REPO_SLUG}/issues/${PR_NUMBER}/comments" \
    -d "$(jq -n --arg body "$COMMENT_BODY" '{body: $body}')" > /dev/null
  echo "✅ Posted Storybook comment to PR #${PR_NUMBER}"
fi
