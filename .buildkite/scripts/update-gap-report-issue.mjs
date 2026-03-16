#!/usr/bin/env node
/**
 * Update a GitHub issue with the latest Import Gap Report.
 *
 * Uses only Node.js built-ins (no npm packages required).
 * Designed to run inside the node:22-slim Docker container in Buildkite.
 *
 * Environment variables:
 *   GITHUB_PR_TOKEN        — GitHub fine-grained PAT with issues:write
 *   GAP_REPORT_ISSUE_NUMBER — GitHub issue number to update (required)
 *   BUILDKITE_REPO         — Repository URL (set automatically by Buildkite)
 *   BUILDKITE_BUILD_URL    — Buildkite build URL (set automatically)
 *   BUILDKITE_BUILD_NUMBER — Buildkite build number (set automatically)
 *
 * Usage: node .buildkite/scripts/update-gap-report-issue.mjs <report-file>
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

const reportFile = process.argv[2];
if (!reportFile) {
  console.error('Usage: node update-gap-report-issue.mjs <report-file>');
  process.exit(1);
}

let reportContent;
try {
  reportContent = readFileSync(reportFile, 'utf8');
} catch (err) {
  console.error(`❌ Could not read report file: ${reportFile}\n${err.message}`);
  process.exit(1);
}

const buildInfo = BUILD_NUM
  ? `\n\n---\n*Updated by [Buildkite build #${BUILD_NUM}](${BUILD_URL})*`
  : '';

const issueBody = `${reportContent}${buildInfo}`;

const headers = {
  Authorization: `token ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json',
  'User-Agent': 'buildkite-gap-report',
};

console.error(`📝 Updating GitHub issue #${ISSUE_NUMBER} in ${REPO_SLUG}…`);

const res = await fetch(
  `https://api.github.com/repos/${REPO_SLUG}/issues/${ISSUE_NUMBER}`,
  {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ body: issueBody }),
  },
);

if (res.ok) {
  const issue = await res.json();
  console.error(`✅ Updated issue #${ISSUE_NUMBER}: ${issue.html_url}`);
  console.log(issue.html_url);
} else {
  const text = await res.text();
  console.error(`❌ Failed to update issue: ${res.status} ${text}`);
  process.exit(1);
}
