#!/bin/bash
# Posts or updates a GitHub PR comment with a link to the Storybook build artifacts.
# Requires: GITHUB_TOKEN, BUILDKITE_PULL_REQUEST, BUILDKITE_REPO, BUILDKITE_BUILD_URL,
#           BUILDKITE_COMMIT, BUILDKITE_BUILD_NUMBER

set -euo pipefail

COMMENT_MARKER="<!-- storybook-preview -->"

# Only run on pull request builds
if [[ "${BUILDKITE_PULL_REQUEST:-false}" == "false" ]]; then
  echo "Not a pull request build, skipping Storybook comment"
  exit 0
fi

# Require a GitHub token
if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "⚠️ GITHUB_TOKEN not set, skipping Storybook PR comment"
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
