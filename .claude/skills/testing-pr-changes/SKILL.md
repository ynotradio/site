---
name: testing-pr-changes
description: Comprehensive testing and verification checklist for agent-created pull requests. Use when preparing to submit a PR, verifying changes work correctly, or ensuring all evidence requirements are met. Covers Docker setup, database seeding, performance baselines, and proof-of-functionality requirements.
---

# Agent Testing Checklist

**For GitHub Copilot Agents: Use this checklist to verify your work is complete before submitting PRs.**

## Critical Success Criteria

Every agent PR **MUST** include proof of working functionality. This is **non-negotiable**.

**BEFORE you push any code**:
1. Run `yarn lint` - must exit 0
2. Run `yarn test` - must exit 0
3. Run `yarn build` - must exit 0
4. If UI/API changes: run `yarn test:e2e` - must exit 0
5. Take screenshots with Playwright showing functionality works

**Never push code that fails CI checks. Repeated CI failures on the same branch are unacceptable.**

### Definition of Done

- [ ] **Working environment accessible**
  - Payload: Screenshot of http://localhost:3000/admin showing login or dashboard
  - Legacy: Screenshot of http://localhost:8080 showing Y-Not homepage rendering
  - Both services respond to HTTP requests (not just "container started")

- [ ] **Functionality proven**
  - Can interact with the application (not just see an error page)
  - For Payload: Can access collections, see data, or create records
  - For Legacy: Pages render with content (not directory listings)

- [ ] **Tests pass locally**
  - `yarn lint` exits with code 0
  - `yarn test` exits with code 0
  - `yarn build` exits with code 0 (if applicable)
  - No new test failures introduced

- [ ] **Screenshots taken with Playwright**
  - Use Playwright browser tools to navigate and capture evidence
  - Show actual working functionality, not just "service started"
  - Include screenshots in PR for human review

## Using Playwright for Verification

**You MUST use Playwright browser tools to verify your work visually.**

### Required Workflow

1. **Start the service** you're testing:
   - Payload: `yarn payload:dev` → http://localhost:3000/admin
   - Legacy: `docker compose up -d` → http://localhost:8080

2. **Navigate with Playwright MCP tools**:
   - `playwright-browser_navigate` to the URL
   - `playwright-browser_snapshot` to see the page structure
   - `playwright-browser_take_screenshot` to capture evidence

3. **Verify functionality**:
   - Check that the page loads correctly
   - Verify no error messages appear
   - Test interactive elements work (if applicable)
   - Confirm data displays correctly

4. **Include in PR**:
   - Attach screenshot showing working functionality
   - Brief caption explaining what the screenshot shows

### Example Verification Flow

```bash
# Start Payload
yarn payload:dev

# In another terminal, use Playwright tools:
# 1. playwright-browser_navigate: http://localhost:3000/admin
# 2. playwright-browser_snapshot: Verify page structure
# 3. playwright-browser_take_screenshot: Capture for PR

# Verify the screenshot shows:
# - Page loaded successfully
# - No error messages
# - Expected UI elements visible
```

**Purpose**: Screenshots prove you tested the application end-to-end, not just that build commands succeeded.

## Performance Baselines

**Know when to stop and report issues:**

| Metric | Expected | Warning | Failure |
|--------|----------|---------|---------|
| Container startup | < 60s | 60-120s | > 120s |
| yarn install | < 120s | 120-300s | > 300s |
| Service ready (total) | < 180s | 180-360s | > 360s |
| Docker image pull | < 30s | 30-60s | > 60s |

⚠️ **If you exceed "Warning" thresholds:** Document the issue and investigate alternatives (pre-built images, optimized containers, etc.)

❌ **If you hit "Failure" thresholds:** Stop and report the blocker. Do not proceed with untested work.

## Environment Detection

Detect your environment early and adjust expectations:

```bash
# Am I in CI/CD?
if [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ]; then
  # Use optimized workflow: pre-built images, skip heavy installs
  echo "CI environment detected"
fi

# Do I have network access?
if ! curl -s https://registry.npmjs.org > /dev/null; then
  # Report network restrictions, recommend allowlist additions
  echo "Network restricted - cannot pull packages"
fi

# Can I bind to required ports?
if lsof -ti:3000 > /dev/null 2>&1; then
  echo "Port 3000 in use - cannot start Payload"
fi
```

## Incremental Verification Strategy

**Test each layer before building the next:**

### Phase 1: Infrastructure
- [ ] Docker installed and running
- [ ] Can pull base images: `docker pull node:22-alpine`
- [ ] Can access npm registry: `yarn --version`
- [ ] Required ports available: 3000, 8080, 5432

### Phase 2: Build
- [ ] Dockerfile syntax valid
- [ ] Image builds successfully: `docker build -f Dockerfile.payload .`
- [ ] Build completes in < 5 minutes
- [ ] No build errors in logs

### Phase 3: Service Startup
- [ ] Containers start: `docker compose up -d`
- [ ] Health checks pass
- [ ] Services respond on localhost
- [ ] Startup completes in < 3 minutes

### Phase 4: Database Seeding (Optional but Recommended)
- [ ] Legacy site: `yarn seed:legacy` (sample data) or `./bin/refresh_local.sh` (production)
- [ ] Payload: `yarn seed:payload` (sample data based on Y-Not structure)
- [ ] Data visible in applications

### Phase 5: Application Access & Playwright Verification
- [ ] HTTP requests succeed (200, not 500/502)
- [ ] UI renders (not blank page or error)
- [ ] **Use Playwright tools to navigate and verify** (see "Using Playwright for Verification" above)
- [ ] Screenshots prove functionality
- [ ] Can interact with application

**Critical**: This phase requires Playwright browser tools. Visual verification is mandatory.

**Stop at each phase if failures occur. Document and report before proceeding.**

## Database Seeding

**Why seed databases:**
- Empty applications are hard to test meaningfully
- Screenshots of empty dashboards don't prove functionality
- Seeded data helps verify relationships, queries, and UI work correctly

### For Legacy PHP/MySQL Site

**Quick seed (sample data):** `yarn seed:legacy`

Creates minimal sample data for testing without requiring production database access.

**Production data:** `./bin/refresh_local.sh`

This script:
1. Pulls latest production database snapshot (`./bin/pull_db.sh`)
2. Stops containers and removes volumes
3. Starts fresh containers
4. Imports production data into MySQL (`./bin/import_db.sh`)

**Usage:**
```bash
# Quick seed with sample data (no production DB needed)
yarn seed:legacy

# Or use production data (requires DB access)
./bin/refresh_local.sh

# Manual steps if needed:
./bin/pull_db.sh          # Download latest DB
./bin/import_db.sh        # Import into running container
```

**Expected outcome:**
- Site at http://localhost:8080 shows content (sample or real)
- PHPMyAdmin at http://localhost:8181 shows populated tables
- Can browse shows, concerts, DJ profiles, etc.

**Files:**
- Sample seed: `bin/seed-legacy.sh` (in repo)
- Production dump: `src/db/docker/ynot_db.sql` (gitignored, requires access)
- Import script: `bin/import_db.sh`
- Refresh script: `bin/refresh_local.sh`

### For Payload CMS

**Option 1: Use Pre-seeded Postgres Container (Fastest)**

The pre-built Postgres image includes schema and sample data pre-installed:

```bash
# Using docker-compose (recommended)
docker-compose up postgres

# Or pull pre-built image directly
docker pull ghcr.io/ynotradio/site/postgres-seeded:latest
docker run -d -p 5432:5432 ghcr.io/ynotradio/site/postgres-seeded:latest
```

**Performance:**
- ✅ First start: ~2-3 minutes (seeds automatically)
- ✅ Subsequent starts: ~10 seconds (data persists)
- ⚠️ Requires GHCR access for pre-built image

**Option 2: Manual Seeding**

If you need custom data or don't have GHCR access:

```bash
# After Payload is running with empty database
yarn seed:payload
```

**What's included in seed data:**
- People (DJs like "Josh T. Landow", Artists)
- Venues (The Foundry, Union Transfer, World Cafe Live)
- Concerts with dates, artists, venues
- Posts (news stories, contest announcements)
- Shows (Top 11 @ 11, specialty shows)
- Songs, Records, Artists (music catalog)

**Expected outcome:**
- Admin UI shows populated collections
- Can browse and edit sample data (DJs, venues, concerts, posts, shows)
- Relationships work correctly (concerts → artists & venues, shows → DJs)
- API returns data at endpoints

**Files:**
- Pre-seeded image: `bin/docker/postgres/Dockerfile`
- Seed script: `bin/seed-payload.ts` (TypeScript, uses Payload API)
- Based on structure from `src/db/docker/ynot_db.sql`

**Connection details:**
```env
DATABASE_URI=postgresql://ynot_postgres_user:ynot_postgres_pass@localhost:5432/ynot_payload_dev
DATABASE_SSL=disable
```

### Seeding Checklist

- [ ] Know which system you're testing (Payload, Legacy, or both)
- [ ] Understand data dependencies (collections, relationships)
- [ ] Run appropriate seed script
- [ ] Verify data appears in UI
- [ ] Take screenshots showing populated application
- [ ] Test functionality with real-ish data

## Fallback Strategy

When full verification fails, be brief and specific:

### If Blockers Exist
```markdown
## Changes
- [Brief description]

## Blocker
@owner - [Specific issue blocking verification]

Examples: Port unavailable, network timeout, resource constraints

## What's Complete
- Code changes made
- Syntax/linting passes locally
- [Any partial testing completed]
```

### If Partial Success
```markdown
## Changes
- [Brief description]

## Verification Status
✅ Partial: [What works - e.g., "Builds complete, containers slow"]
⚠️ Issue: [Specific problem - e.g., "Startup exceeds 3min threshold"]

@owner - Manual verification needed

## Evidence
[Screenshot of what does work]
```

**Key points**:
- Be specific about the blocker
- Don't make excuses or recommendations
- Show what actually works with screenshots
- Tag the maintainer for help

## Common Pitfalls

### ❌ DON'T: Submit Without Proof
```markdown
"The scripts are production-ready and will work in real environments."
```
This is **not acceptable**. Provide proof or explain why you cannot.

### ✅ DO: Provide Evidence or Explain Why Not
```markdown
"The scripts work on local workstations (see manual test results).
Cannot test in CI due to yarn install timeout (5+ min).
Recommend pre-built images for CI automation. See alternatives in [link]."
```

### ❌ DON'T: Fake Screenshots
Never include generic/placeholder screenshots that don't show actual functionality.

### ✅ DO: Show Real State
Show what actually works, even if incomplete:
- Loading spinner if that's as far as it gets
- Error message if that's what appears
- Actual data if it works

### ❌ DON'T: Ignore Performance
```bash
# Still running after 10 minutes
# "It will finish eventually"
```

### ✅ DO: Set Reasonable Timeouts
```bash
timeout 180 bash -c 'until service_ready; do sleep 5; done'
if [ $? -eq 124 ]; then
  echo "❌ Service failed to start in 3 minutes"
  exit 1
fi
```

## PR Template Checklist

**Keep PR descriptions brief. Your code and screenshots speak for themselves.**

Include this minimal section in every PR:

```markdown
## Changes
- [2-3 bullet points maximum]

## Verification
- [x] All checks pass locally before push (lint, test, build)
- [x] Playwright verification completed
- [x] Screenshot attached

## Evidence
[Single screenshot showing working functionality]
```

**If there's a blocker requiring human action**, expand to:

```markdown
## Changes
- [Brief description]

## Verification
- [x] All checks pass locally
- [x] Screenshot attached

## Blocker
@owner - [Specific action needed from maintainer]

## Evidence
[Screenshot]
```

**Don't include**: verbose summaries, technical comparisons, "recommendations", performance metrics unless they reveal a problem.

## When to Ask for Help

Ask for human assistance when:

1. **Can't meet success criteria** after reasonable attempts
2. **Performance far exceeds thresholds** without clear solution
3. **Environment blockers** require infrastructure changes
4. **Conflicting requirements** need human decision
5. **Security concerns** about testing approach

**Asking for help is better than submitting unverified work.**

## Resources

- **Database seeding:**
  - Payload: `yarn seed:payload` (sample data based on ynot_db.sql structure)
  - Legacy (sample): `yarn seed:legacy` (quick test data)
  - Legacy (production): `./bin/refresh_local.sh` (real data, requires access)
- Local setup: `docs/LOCAL_SETUP_GUIDE.md`
- Agent examples: `docs/AGENT_VERIFICATION_EXAMPLES.md`
- Migration context: `docs/payload-migration/README.md`
- Automation status: See the `agent-automation-infrastructure` skill

---

**Remember:** Quality and honesty > Speed. Partial success with evidence > Untested code.
