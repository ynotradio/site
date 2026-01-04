# Agent Testing Checklist

**For GitHub Copilot Agents: Use this checklist to verify your work is complete before submitting PRs.**

## Critical Success Criteria

Every agent PR **MUST** include proof of working functionality. This is **non-negotiable**.

### Definition of Done

- [ ] **Working environment accessible**
  - Payload: Screenshot of http://localhost:3000/admin showing login or dashboard
  - Legacy: Screenshot of http://localhost:8080 showing Y-Not homepage rendering
  - Both services respond to HTTP requests (not just "container started")

- [ ] **Functionality proven**
  - Can interact with the application (not just see an error page)
  - For Payload: Can access collections, see data, or create records
  - For Legacy: Pages render with content (not directory listings)

- [ ] **Tests pass**
  - `yarn test` exits with code 0
  - `yarn lint` exits with code 0
  - No new test failures introduced

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
- [ ] Legacy site: `./bin/refresh_local.sh` (imports production data)
- [ ] Payload: `yarn payload:seed` (creates sample data)
- [ ] Data visible in applications

### Phase 4: Application Access
- [ ] HTTP requests succeed (200, not 500/502)
- [ ] UI renders (not blank page or error)
- [ ] Can interact with application
- [ ] Screenshots prove functionality

**Stop at each phase if failures occur. Document and report before proceeding.**

## Database Seeding

**Why seed databases:**
- Empty applications are hard to test meaningfully
- Screenshots of empty dashboards don't prove functionality
- Seeded data helps verify relationships, queries, and UI work correctly

### For Legacy PHP/MySQL Site

**Script:** `./bin/refresh_local.sh`

This script:
1. Pulls latest production database snapshot
2. Stops containers and removes volumes
3. Starts fresh containers
4. Imports production data into MySQL

**Usage:**
```bash
# Full refresh with production data
./bin/refresh_local.sh

# Manual steps if needed:
./bin/pull_db.sh          # Download latest DB
./bin/import_db.sh        # Import into running container
```

**Expected outcome:**
- Site at http://localhost:8080 shows real content
- PHPMyAdmin at http://localhost:8181 shows populated tables
- Can browse shows, concerts, DJ profiles, etc.

**Files:**
- Database dump: `src/db/docker/ynot_db.sql` (gitignored)
- Import script: `bin/import_db.sh`
- Refresh script: `bin/refresh_local.sh`

### For Payload CMS

**Script:** `yarn payload:seed`

Creates sample data for testing:
- Admin user accounts
- Sample posts, shows, concerts
- Test media uploads
- Relationships between collections

**Usage:**
```bash
# After Payload is running
yarn payload:seed

# Or during startup in scripts:
yarn payload:migrate && yarn payload:seed && yarn payload:dev
```

**Expected outcome:**
- Admin UI shows populated collections
- Can browse and edit sample data
- Relationships work correctly
- API returns data at endpoints

**Note:** Payload seeding may not be fully implemented yet. If `yarn payload:seed` fails:
1. Document that it's not available
2. Create sample data manually via Admin UI
3. Take screenshots showing data entry works
4. Consider implementing seed script if needed for testing

### Seeding Checklist

- [ ] Know which system you're testing (Payload, Legacy, or both)
- [ ] Understand data dependencies (collections, relationships)
- [ ] Run appropriate seed script
- [ ] Verify data appears in UI
- [ ] Take screenshots showing populated application
- [ ] Test functionality with real-ish data

## Fallback Strategy

When full automation fails, provide partial success:

### If Containers Start But Are Slow
```markdown
## Status: Partial Success

✅ **What Works:**
- Docker images build successfully
- Containers start and run
- Services accessible on localhost

⚠️ **Performance Issues:**
- yarn install takes 5+ minutes (timeout)
- Total startup: 8 minutes (expected < 3 minutes)

📋 **Recommendations:**
- Use pre-built Docker images
- Implement layer caching
- Switch to Debian base (faster than Alpine)

📸 **Evidence:**
[Screenshots showing services eventually work]
```

### If Services Don't Start
```markdown
## Status: Infrastructure Ready, Runtime Blocked

✅ **What Works:**
- Docker images build
- Configuration files valid
- Scripts execute without syntax errors

❌ **Blockers:**
- Port 3000 unavailable
- PostgreSQL connection fails
- yarn install times out

📋 **Next Steps:**
1. [Specific actions to unblock]
2. [Manual testing instructions for humans]
3. [Alternative approaches to try]
```

### If Can't Test at All
```markdown
## Status: Code Complete, Testing Environment Unavailable

✅ **Code Quality:**
- Syntax valid
- Linting passes
- Follows established patterns

❌ **Cannot Verify:**
- No Docker access in environment
- Network restrictions prevent package install
- Resource constraints prevent startup

📋 **Manual Testing Required:**
1. Steps for human to test locally
2. Expected outcomes
3. How to verify functionality

🔧 **Environment Needs:**
- [List specific requirements]
- [Allowlist domains needed]
- [Resource requirements]
```

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

Include this section in every PR:

```markdown
## Agent Verification Results

### Environment
- [ ] Local workstation / [ ] CI/CD
- [ ] Full network access / [ ] Restricted network
- Node version: [version]
- Docker version: [version]

### Testing Performed
- [ ] Payload accessible: http://localhost:3000/admin
- [ ] Legacy accessible: http://localhost:8080
- [ ] Database seeded (Payload: `yarn payload:seed` or Legacy: `./bin/refresh_local.sh`)
- [ ] Tests pass: `yarn test`
- [ ] Linting passes: `yarn lint`

### Evidence
[Screenshots or explain why not available]

### Performance Metrics
- Container startup: [time]
- yarn install: [time]
- Service ready: [time]

### Issues Encountered
[None / List specific issues and how resolved]

### Recommendations
[Any suggestions for improving agent testing workflow]
```

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
  - Legacy site: `./bin/refresh_local.sh` (pulls and imports production data)
  - Payload CMS: `yarn payload:seed` (creates sample data for testing)
- Local setup: `docs/LOCAL_SETUP_GUIDE.md`
- Agent examples: `docs/AGENT_VERIFICATION_EXAMPLES.md`
- Migration context: `docs/payload-migration/README.md`
- Automation status: `docs/AGENT_AUTOMATION_STATUS.md`

---

**Remember:** Quality and honesty > Speed. Partial success with evidence > Untested code.
