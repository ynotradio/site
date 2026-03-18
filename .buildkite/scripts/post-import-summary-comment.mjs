#!/usr/bin/env node
/**
 * Post an import summary as a comment on a GitHub issue.
 *
 * Uses only Node.js built-ins (no npm packages required).
 * Designed to run inside the node:22-slim Docker container in Buildkite.
 *
 * Environment variables:
 *   GITHUB_PR_TOKEN        — GitHub fine-grained PAT with issues:write
 *   GAP_REPORT_ISSUE_NUMBER — GitHub issue number to comment on
 *   BUILDKITE_REPO         — Repository URL (set automatically by Buildkite)
 *   BUILDKITE_BUILD_URL    — Buildkite build URL (set automatically)
 *   BUILDKITE_BUILD_NUMBER — Buildkite build number (set automatically)
 *
 * Usage: node .buildkite/scripts/post-import-summary-comment.mjs <summary-file>
 */

import { readFileSync } from 'node:fs';

const GITHUB_TOKEN = process.env.GITHUB_PR_TOKEN;
const ISSUE_NUMBER = process.env.GAP_REPORT_ISSUE_NUMBER;
const BUILD_URL = process.env.BUILDKITE_BUILD_URL || '';
const BUILD_NUM = process.env.BUILDKITE_BUILD_NUMBER || '';
const REPO_SLUG = (process.env.BUILDKITE_REPO || '')
  .replace(/https?:\/\/github\.com\//, '')
  .replace(/git@github\.com:/, '')
  .replace(/\.git$/, '');

if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_PR_TOKEN is not set');
  process.exit(1);
}

if (!ISSUE_NUMBER) {
  console.error('❌ GAP_REPORT_ISSUE_NUMBER is not set');
  process.exit(1);
}

if (!REPO_SLUG) {
  console.error('❌ BUILDKITE_REPO is not set or could not be parsed');
  process.exit(1);
}

const summaryFile = process.argv[2];
if (!summaryFile) {
  console.error('Usage: node post-import-summary-comment.mjs <summary-file>');
  process.exit(1);
}

let summaryContent;
try {
  summaryContent = readFileSync(summaryFile, 'utf8');
} catch (err) {
  console.error(`❌ Could not read summary file: ${summaryFile}\n${err.message}`);
  process.exit(1);
}

const buildInfo = BUILD_NUM
  ? `\n\n---\n*Posted by [Buildkite build #${BUILD_NUM}](${BUILD_URL})*`
  : '';

const commentBody = `${summaryContent}${buildInfo}`;

const headers = {
  Authorization: `token ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json',
  'User-Agent': 'buildkite-import-summary',
};

console.error(`💬 Posting import summary comment on issue #${ISSUE_NUMBER} in ${REPO_SLUG}…`);

const res = await fetch(
  `https://api.github.com/repos/${REPO_SLUG}/issues/${ISSUE_NUMBER}/comments`,
  {
    method: 'POST',
    headers,
    body: JSON.stringify({ body: commentBody }),
  },
);

if (res.ok) {
  const comment = await res.json();
  console.error(`✅ Posted comment on issue #${ISSUE_NUMBER}: ${comment.html_url}`);
  console.log(comment.html_url);
} else {
  const text = await res.text();
  console.error(`❌ Failed to post comment: ${res.status} ${text}`);
  process.exit(1);
}
