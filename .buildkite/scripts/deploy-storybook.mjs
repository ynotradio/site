#!/usr/bin/env node
/**
 * Deploy Storybook to Netlify and post a PR comment on GitHub.
 *
 * Uses only Node.js built-ins (no npm packages required).
 * Designed to run inside the node:22-slim Docker container in Buildkite.
 *
 * Environment variables:
 *   NETLIFY_AUTH_TOKEN  — Netlify personal access token
 *   GITHUB_PR_TOKEN     — GitHub fine-grained PAT with pull_requests:write
 *   BUILDKITE_PULL_REQUEST, BUILDKITE_BUILD_URL, BUILDKITE_COMMIT,
 *   BUILDKITE_BUILD_NUMBER, BUILDKITE_REPO — set automatically by Buildkite
 *
 * Usage: node .buildkite/scripts/deploy-storybook.mjs [storybook-static]
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const NETLIFY_SITE_ID = 'e26d50b9-3a3c-47c3-8bc1-399c045baf2a';
const NETLIFY_TOKEN = process.env.NETLIFY_AUTH_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_PR_TOKEN;
const PR_NUMBER = process.env.BUILDKITE_PULL_REQUEST;
const BUILD_URL = process.env.BUILDKITE_BUILD_URL || '';
const COMMIT = (process.env.BUILDKITE_COMMIT || '').slice(0, 7);
const BUILD_NUM = process.env.BUILDKITE_BUILD_NUMBER || '';
const REPO_SLUG = (process.env.BUILDKITE_REPO || '')
  .replace(/https?:\/\/github\.com\//, '')
  .replace(/git@github\.com:/, '')
  .replace(/\.git$/, '');

const COMMENT_MARKER = '<!-- storybook-preview -->';

// ---------------------------------------------------------------------------
// Netlify deploy via file-digest API
// ---------------------------------------------------------------------------

function walkDir(dir, prefix = '') {
  const files = {};
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      Object.assign(files, walkDir(full, rel));
    } else {
      const hash = createHash('sha1').update(readFileSync(full)).digest('hex');
      files[`/${rel}`] = hash;
    }
  }
  return files;
}

async function deployToNetlify(dir) {
  if (!NETLIFY_TOKEN) throw new Error('NETLIFY_AUTH_TOKEN is not set');

  console.error('📦 Scanning files…');
  const files = walkDir(dir);
  const count = Object.keys(files).length;
  console.error(`   ${count} files found`);

  // 1. Create the deploy (sends file manifest with SHA-1 digests)
  console.error('🚀 Creating Netlify deploy…');
  const createRes = await fetch(
    `https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/deploys`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NETLIFY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files }),
    },
  );
  if (!createRes.ok) {
    throw new Error(
      `Netlify create-deploy failed: ${createRes.status} ${await createRes.text()}`,
    );
  }
  const deploy = await createRes.json();
  const required = deploy.required || [];
  console.error(`   Deploy ${deploy.id} — ${required.length} files to upload`);

  // 2. Upload files the CDN doesn't already have
  const hashToPath = Object.fromEntries(
    Object.entries(files).map(([p, h]) => [h, p]),
  );

  for (let i = 0; i < required.length; i++) {
    const filePath = hashToPath[required[i]];
    if (!filePath) continue;

    console.error(`   ⬆ [${i + 1}/${required.length}] ${filePath}`);
    const body = readFileSync(join(dir, filePath));
    const up = await fetch(
      `https://api.netlify.com/api/v1/deploys/${deploy.id}/files${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${NETLIFY_TOKEN}`,
          'Content-Type': 'application/octet-stream',
        },
        body,
      },
    );
    if (!up.ok) console.error(`   ⚠️  upload failed (${up.status})`);
  }

  return deploy.deploy_ssl_url || deploy.ssl_url;
}

// ---------------------------------------------------------------------------
// GitHub PR comment
// ---------------------------------------------------------------------------

async function postPRComment(deployUrl) {
  if (!GITHUB_TOKEN || !PR_NUMBER || PR_NUMBER === 'false' || !REPO_SLUG) {
    console.error('ℹ️  Skipping PR comment (missing token, PR number, or repo)');
    return;
  }

  const body = [
    COMMENT_MARKER,
    '## 📖 Storybook Preview',
    '',
    `**Build [#${BUILD_NUM}](${BUILD_URL})** — commit \`${COMMIT}\``,
    '',
    `**[View Storybook →](${deployUrl})**`,
  ].join('\n');

  const headers = {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'buildkite-storybook',
  };

  // Look for an existing comment to update
  let existingId = null;
  try {
    const listRes = await fetch(
      `https://api.github.com/repos/${REPO_SLUG}/issues/${PR_NUMBER}/comments?per_page=100`,
      { headers },
    );
    if (listRes.ok) {
      const comments = await listRes.json();
      const match = comments.find((c) => c.body.startsWith(COMMENT_MARKER));
      if (match) existingId = match.id;
    }
  } catch {
    /* best-effort */
  }

  const url = existingId
    ? `https://api.github.com/repos/${REPO_SLUG}/issues/comments/${existingId}`
    : `https://api.github.com/repos/${REPO_SLUG}/issues/${PR_NUMBER}/comments`;

  const res = await fetch(url, {
    method: existingId ? 'PATCH' : 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });

  if (res.ok) {
    console.error(`✅ ${existingId ? 'Updated' : 'Posted'} Storybook PR comment`);
  } else {
    console.error(`⚠️  PR comment failed: ${res.status} ${await res.text()}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const dir = process.argv[2] || 'storybook-static';

try {
  const url = await deployToNetlify(dir);
  console.error(`✅ Deployed: ${url}`);
  console.log(url); // stdout — usable by callers
  await postPRComment(url);
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exit(1);
}
