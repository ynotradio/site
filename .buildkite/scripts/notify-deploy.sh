#!/usr/bin/env bash
# .buildkite/scripts/notify-deploy.sh
# Sends a natural language email summary after a successful legacy PHP
# production deploy to Lightsail.
#
# Runs as a soft-fail Buildkite step inside node:22-slim so bash is available.
#
# Required Buildkite secrets (fetched by pre-command hook):
#   RESEND_API_KEY       — Resend API key
#   DEPLOY_NOTIFY_EMAIL  — Recipient email address
#   GITHUB_PR_TOKEN      — GitHub PAT (used for commit lookup + AI summary)
#
# Optional env vars:
#   DEPLOY_PR_NUMBER     — PR number; set automatically for PR deploy pipeline

set -euo pipefail

apt-get update -qq && apt-get install -y --no-install-recommends jq curl >/dev/null 2>&1

: "${RESEND_API_KEY:?RESEND_API_KEY missing}"
: "${DEPLOY_NOTIFY_EMAIL:?DEPLOY_NOTIFY_EMAIL missing}"

REPO_SLUG=$(echo "${BUILDKITE_REPO:-}" \
  | sed 's|https://github.com/||;s|git@github.com:||;s|\.git$||')
SHORT_SHA=$(echo "${BUILDKITE_COMMIT:-unknown}" | cut -c1-8)

# --- Get commits ---
COMMITS=""
if [ -n "${DEPLOY_PR_NUMBER:-}" ] && [ -n "${GITHUB_PR_TOKEN:-}" ]; then
  COMMITS=$(curl -sf \
    -H "Authorization: token ${GITHUB_PR_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/${REPO_SLUG}/pulls/${DEPLOY_PR_NUMBER}/commits?per_page=50" \
    | jq -r '.[] | .sha[:8] + " " + .commit.message' 2>/dev/null | head -20 || true)
fi

if [ -z "${COMMITS:-}" ]; then
  COMMITS=$(git log --oneline -10 HEAD 2>/dev/null || true)
fi

if [ -z "${COMMITS:-}" ]; then
  # If git history is truly unavailable, skip AI and send a simple confirmation
  echo "✅ Deploy notification sent (no commit history available)"
  curl -sf -X POST https://api.resend.com/emails \
    -H "Authorization: Bearer ${RESEND_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
      --arg to   "${DEPLOY_NOTIFY_EMAIL}" \
      --arg sha  "${SHORT_SHA}" \
      --arg url  "${BUILDKITE_BUILD_URL:-}" \
      '{
        from: "noreply@resend.dev",
        to: [$to],
        subject: ("🚀 Legacy PHP site deployed to production (" + $sha + ")"),
        text: ("Legacy PHP Site Production Deploy\n\nCommit: " + $sha + "\nBuild: " + $url)
      }')" && exit 0 || exit 0
fi

# --- Generate natural language summary via GitHub Models ---
SUMMARY=""
if [ -n "${GITHUB_PR_TOKEN:-}" ]; then
  RESPONSE=$(curl -sf \
    "https://models.inference.ai.azure.com/chat/completions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${GITHUB_PR_TOKEN}" \
    -d "$(jq -n \
      --arg commits "${COMMITS}" \
      '{
        model: "gpt-4o-mini",
        max_tokens: 250,
        messages: [{
          role: "user",
          content: ("Write a 2-4 sentence natural language summary of what changed in this production deployment of the Y-Not Radio legacy PHP website. Be friendly and concise. Focus on what is new or fixed for users or operators.\n\nCommits:\n" + $commits)
        }]
      }')" 2>/dev/null || true)
  SUMMARY=$(echo "${RESPONSE}" | jq -r '.choices[0].message.content // empty' 2>/dev/null || true)
fi

if [ -z "${SUMMARY:-}" ]; then
  SUMMARY=$(echo "${COMMITS}" | head -10 | sed 's/^[a-f0-9]* /• /')
fi

# --- Send email via Resend ---
if [ -n "${DEPLOY_PR_NUMBER:-}" ]; then
  SUBJECT="🚀 Legacy PHP site PR #${DEPLOY_PR_NUMBER} deployed to production (${SHORT_SHA})"
else
  SUBJECT="🚀 Legacy PHP site deployed to production (${SHORT_SHA})"
fi

curl -sf -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer ${RESEND_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$(jq -n \
    --arg to      "${DEPLOY_NOTIFY_EMAIL}" \
    --arg subject "${SUBJECT}" \
    --arg sha     "${SHORT_SHA}" \
    --arg url     "${BUILDKITE_BUILD_URL:-}" \
    --arg summary "${SUMMARY}" \
    '{
      from: "deploys@ynotradio.net",
      to: [$to],
      subject: $subject,
      text: ("Legacy PHP Site Production Deploy\n\nCommit: " + $sha + "\nBuild: " + $url + "\n\n" + $summary)
    }')" \
  && echo "✅ Deploy notification sent to ${DEPLOY_NOTIFY_EMAIL}" \
  || echo "⚠️  Email send failed — check RESEND_API_KEY and that ynotradio.net is verified in Resend"
