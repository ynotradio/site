---
name: playwright-ci-workflow
description: End-to-end workflow for writing, running, and verifying Playwright E2E tests through CI. Use this skill whenever you are writing new e2e tests, adding tests to the Buildkite CI pipeline, troubleshooting CI e2e failures, monitoring Buildkite build results, or need to get Playwright tests passing in CI. Also use when you need faster CI feedback loops by temporarily disabling unrelated pipeline steps. This skill adapts to your environment — it works for both CLI agents (with Docker and `bk` CLI) and web agents (using GitHub MCP tools to monitor check runs). If you are doing ANY work involving Playwright tests and CI, use this skill.
---

# Playwright CI Workflow

**The complete lifecycle for writing e2e tests that pass in CI — from first draft to green build.**

This skill is about the _workflow_: how to write tests, verify them, monitor CI, and iterate. For debugging specific test failures (broken selectors, timeout issues, date picker quirks), see the `e2e-debugging-workflow` skill — it's the companion to this one.

## Know Your Environment

Before doing anything, figure out what tools you have. This determines your workflow.

```bash
source bin/agent-helpers/detect-environment.sh
print_environment
```

| Capability             | CLI Agent (local) | Web Agent (github.com) |
| ---------------------- | ----------------- | ---------------------- |
| Docker                 | ✅ Yes            | ❌ Usually no          |
| `bk` CLI               | ✅ Yes            | ❌ No                  |
| Run Playwright locally | ✅ Yes            | ❌ No                  |
| GitHub MCP tools       | ✅ Yes            | ✅ Yes                 |
| Push commits           | ✅ Yes            | ✅ Yes                 |
| Edit pipeline.yml      | ✅ Yes            | ✅ Yes                 |

**The core principle**: never push a test blindly. Always verify it works — locally if you can, via CI monitoring if you can't.

## ⚡ Fast Feedback Loop (CRITICAL)

**This is the single most important technique in this skill.** The full Buildkite pipeline takes 10-15 minutes. When iterating on e2e tests, temporarily disable unrelated steps to cut this to ~5 minutes:

```yaml
# In .buildkite/pipeline.yml, comment out ALL non-e2e steps:
steps:
  # - label: ":eslint: ESLint"
  #   command: yarn lint
  # - label: ":vitest: Vitest"
  #   command: yarn test:coverage
  # - label: ":storybook: Storybook"
  #   ...
  # - label: ":php: PHP Lint"
  #   ...
  # - label: ":docker: Build Images"
  #   ...
  - wait: ~
  - label: ':playwright: E2E Tests'
    # ... keep ONLY this step
```

**Include this edit in your commits while iterating.** Revert it once tests are green:

```bash
git checkout -- .buildkite/pipeline.yml
git add .buildkite/pipeline.yml
git commit --amend --no-edit
git push --force-with-lease
```

**Both CLI and web agents MUST do this.** It's especially critical for web agents who can't run tests locally — every CI cycle is your only feedback mechanism.

## CLI Agent Workflow (Docker + `bk` available)

This is the gold-standard workflow. You can run tests locally before pushing.

### Step 1: Write the Test

Follow these patterns (they work in both local and CI):

```typescript
import { test, expect } from '@playwright/test';
import { navigateWithRetry, captureScreenshot } from './utils/test-helpers';
import { navigateToPayloadCollection, waitForPayloadSave } from './utils/payload-helpers';

test.describe('Feature Name', () => {
  test('should do the thing', async ({ page }, testInfo) => {
    await test.step('Navigate', async () => {
      await navigateWithRetry(page, 'http://localhost:3000/admin');
    });

    await test.step('Act', async () => {
      // Your test actions here
    });

    await test.step('Assert', async () => {
      await expect(page.getByText('Expected')).toBeVisible();
      await captureScreenshot(page, testInfo, 'result');
    });
  });
});
```

**CI-critical patterns:**

- Always use `navigateWithRetry()` for URLs — Docker networking can be flaky
- Use `test.step()` for clear failure reporting
- Capture screenshots — they become CI artifacts on failure
- Use helper functions from `e2e/utils/` — they handle CI/local differences
- Use unique identifiers (`generateUniqueId()`) to avoid test pollution

### Step 2: Run Locally

```bash
# Start services if not already running
docker compose up -d
yarn payload:dev &
until curl -sf http://localhost:3000/admin > /dev/null 2>&1; do sleep 2; done

# Seed data
yarn seed:payload

# Run your specific test
npx playwright test e2e/your-test.spec.ts --headed

# If it fails, debug interactively
npx playwright test e2e/your-test.spec.ts --debug
```

If the test passes locally, it has a good chance of passing in CI. But "good chance" isn't certainty — the CI environment differs (Docker-in-Docker, different networking, UTC timezone). Move to Step 3.

### Step 3: Add to CI Test Suite (if needed)

Tests only run in CI if they're in the curated list in `playwright.config.ts`:

```typescript
// In playwright.config.ts, find the testMatch line:
testMatch: isCi
  ? /(payload-basic|mrm-postgres-fresh|mrm-postgres-extended|mrm-payload-admin|your-new-test)\.spec\.ts/
  : undefined,
```

Add your test file name to this regex. If your test depends on specific seed data, make sure the CI seeding (in `docker-compose.e2e.yml` payload service command) includes it.

### Step 4: Push and Monitor Buildkite

Push your changes (with pipeline already trimmed per the Fast Feedback Loop section above), then monitor with `bk`:

```bash
# Watch the build
bk build list --mine --pipeline site | head -5

# Get the build number from the output, then watch jobs
bk job list --build <build-number>

# Stream logs from the e2e job
bk job log <job-id>
```

**After tests pass:** revert the pipeline.yml changes before merging (see Fast Feedback Loop section above).

### Step 5: Iterate on Failures

If CI fails, check the logs and artifacts:

```bash
# Get the failing job's log
bk job log <job-id>

# Download playwright report artifacts
bk artifacts list --build <build-number>
bk artifacts download <artifact-id>
```

Common CI-only failures:

- **Timeout**: CI is slower. Increase timeout or add `{ timeout: 10000 }` to assertions
- **DNS resolution**: Playwright in Docker uses hostnames (`payload`, `apache`) not `localhost`
- **Timezone**: CI runs in UTC. Use `gmdate()`-style comparisons, not local time
- **Stale data**: CI gets fresh database each run. Don't assume data from previous runs exists
- **esbuild mismatch**: The CI payload container swaps native esbuild for wasm version

See `e2e-debugging-workflow` skill for detailed debugging of specific failure types.

## Web Agent Workflow (No Docker, No `bk`)

Web agents (triggered from github.com) can't run Docker or use the `bk` CLI. The workflow adapts: write carefully, push, then monitor via GitHub.

### Step 1: Write the Test (Extra Carefully)

Without local execution, you need to be more deliberate. Before writing:

1. **Study existing tests** — read 2-3 similar `.spec.ts` files in `e2e/` to understand patterns
2. **Study the helpers** — read `e2e/utils/test-helpers.ts` and `e2e/utils/payload-helpers.ts`
3. **Understand the CI environment** — tests run inside Docker where services are at hostnames like `payload:3000` and `apache:80`, but `playwright.config.ts` handles the URL mapping via `PLAYWRIGHT_BASE_URL` and `PLAYWRIGHT_LEGACY_URL`

Use proven patterns from existing tests. Don't innovate on infrastructure — innovate on test coverage.

### Step 2: Enable Fast CI Feedback

**MANDATORY**: Before pushing, modify `.buildkite/pipeline.yml` per the Fast Feedback Loop section above. This is your only way to iterate quickly since you can't run tests locally. Without this, each CI cycle takes 10-15 minutes instead of ~5.

### Step 3: Push and Monitor via GitHub

After pushing, use GitHub MCP tools to monitor the Buildkite results:

```
# First, check the PR's check runs to find the Buildkite build
github-mcp-server-pull_request_read:
  method: get_check_runs
  owner: ynotradio
  repo: site
  pullNumber: <pr-number>

# Look for a check run named "buildkite/site" in the response.
# Status meanings:
#   queued / in_progress — still running, wait 2-3 minutes and check again
#   completed + conclusion: success — tests passed 🎉
#   completed + conclusion: failure — tests failed, investigate

# If it failed, get the job logs:
github-mcp-server-get_job_logs:
  owner: ynotradio
  repo: site
  run_id: <run-id-from-check-run>
  failed_only: true
  return_content: true
  tail_lines: 200
```

**Monitoring cadence**: Check every 3-5 minutes. The e2e step alone takes ~5 minutes (with pipeline trimmed). Don't check more often than that.

### Step 4: Investigate Failures

When CI fails, get the details:

```
# Get job logs from GitHub (if Buildkite posts them)
github-mcp-server-get_job_logs:
  owner: <owner>
  repo: <repo>
  run_id: <workflow-run-id>
  failed_only: true
  return_content: true
```

Also check for Buildkite annotations on the PR — they often contain failure summaries.

If the GitHub MCP tools don't surface enough detail, look at the build URL from the check run output and note the failure patterns. Common fixes:

- **Selector not found**: Check Payload UI field IDs (`#field-{name}`) — use existing helpers
- **Timeout**: Increase assertion timeouts, add `navigateWithRetry()`
- **Connection refused**: Service probably wasn't healthy yet — check service dependencies

### Step 5: Fix, Push, Monitor Again

Make targeted fixes based on the error. Push again (with pipeline still trimmed). Repeat until green.

**Once tests pass**: revert the pipeline.yml changes in a final commit:

```bash
git checkout -- .buildkite/pipeline.yml
```

## Test Architecture Reference

### Which Tests Run in CI

Only tests matching this pattern in `playwright.config.ts` run in Buildkite:

```typescript
testMatch: /(payload-basic|mrm-postgres-fresh|mrm-postgres-extended|mrm-payload-admin)\.spec\.ts/;
```

To add a new test to CI, append its filename to this regex.

### CI Service Architecture

```
postgres:5432 ─┬─► payload:3000 ──┬─► playwright
               ├─► phpfpm:9000 ──►├─► (runs tests)
mysql:3306 ────┘    apache:8080 ──┘
```

- Payload runs in **production mode** (`yarn build` + `yarn start`) in CI
- PHP runs behind Apache with mod_proxy_fcgi
- Playwright container adds service hostnames to `/etc/hosts` for Chromium DNS

### CI Seed Data

The payload container runs `yarn payload:migrate` then `bin/seed-mrm-fresh.ts` on startup. MySQL imports `src/db/docker/ynot_db.sql` automatically. If your test needs specific data, either:

1. Seed it in the test itself (via Payload API)
2. Add it to the CI seed scripts

### Timeouts

| Context                | Default          | Max Reasonable                     |
| ---------------------- | ---------------- | ---------------------------------- |
| Test assertion (CI)    | 60s              | 60s (increase with care)           |
| Test assertion (local) | 20s              | 30s                                |
| Service health (CI)    | 300s for Payload | Already configured                 |
| E2E step overall       | 20min            | Don't increase without good reason |

## Writing Tests That Work in CI

These patterns prevent the most common CI failures:

### Use Environment-Aware URLs

Don't hardcode `localhost`. The helpers and config handle this:

```typescript
// ✅ Good — uses config
const PAYLOAD_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

// ❌ Bad — breaks in Docker
await page.goto('http://localhost:3000/admin');
```

### Handle Flaky Navigation

Docker networking hiccups are real. Always retry:

```typescript
// ✅ Good
await navigateWithRetry(page, `${BASE_URL}/admin`);

// ❌ Bad — fails on first network blip
await page.goto(`${BASE_URL}/admin`);
```

### Check for PHP Errors

When testing legacy pages, always verify no PHP errors leaked through:

```typescript
import { checkForPhpErrors } from './utils/test-helpers';

const errors = checkForPhpErrors(await page.content());
expect(errors).toHaveLength(0);
```

### Use the Payload Helper Functions

Don't reinvent CRUD interactions. The helpers in `e2e/utils/payload-helpers.ts` handle:

- Navigation to collections (`navigateToPayloadCollection`)
- Form filling (text, date, time, relationship, rich text, slug, checkbox fields)
- Save and publish workflows (`clickPayloadSave`, `waitForPayloadSave`, `clickPayloadPublish`)
- Legacy PHP navigation with feature flags (`navigateToLegacySiteWithPostgres`)

### Date and Time Handling

CI runs in UTC. This causes subtle failures:

```typescript
// ✅ Good — timezone-safe
const futureDate = getFutureDate(7); // from test-helpers

// ❌ Bad — timezone-dependent
const date = new Date().toLocaleDateString(); // Different in UTC vs local
```

### PHP/Legacy-Specific CI Gotchas

These bite you when testing legacy PHP pages in CI:

- **POSTGRES_SSL_MODE**: PHP's `Database::getPostgres()` defaults to `sslmode=require`. The CI postgres container has SSL disabled. Without `POSTGRES_SSL_MODE=disable` in phpfpm env vars, PDO connects silently fail and the app falls back to MySQL. This is already configured in `docker-compose.e2e.yml` but watch for it if modifying Docker config.
- **Feature flags**: Legacy PHP pages require explicit feature flag query parameters (e.g., `?ff=use_postgres_schedule`). The `navigateToLegacySiteWithPostgres()` helper handles this — use it instead of building URLs manually.
- **Seed data coverage**: CI only runs `bin/seed-mrm-fresh.ts` (for MRM tournament data). If your test needs shows, concerts, or other data, you must either add seeding to `seed-mrm-fresh.ts` or create the data in the test itself via the Payload API.
- **PHP timezone**: The phpfpm container may have a non-UTC timezone. PostgreSQL queries use `AT TIME ZONE 'UTC'` and PHP should use `gmdate()` not `date()`. Date-based assertions can break if the test assumes local time.

## Checklist Before Pushing

Run through this mentally (or literally) before every push:

- [ ] Test uses `navigateWithRetry()` for all page navigations
- [ ] Test uses helper functions from `e2e/utils/` where possible
- [ ] Test uses unique identifiers (not hardcoded names that might collide)
- [ ] Test captures screenshots at key steps
- [ ] Test uses `test.step()` blocks for clarity
- [ ] If new to CI: test filename added to `playwright.config.ts` testMatch
- [ ] If needs seed data: data available in CI seed scripts
- [ ] Pipeline.yml temporarily trimmed for fast feedback (will revert after)

## Related Skills

- **e2e-debugging-workflow** — Debugging specific Playwright failures (selectors, timing, dates)
- **detecting-agent-environment** — Environment detection utilities (`detect_docker`, `detect_ci`, etc.)
- **agent-automation-infrastructure** — Pre-built Docker images, CI pipeline details
- **testing-pr-changes** — PR verification checklist and proof requirements
