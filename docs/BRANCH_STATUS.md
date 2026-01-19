# Branch Status: feat/simplify-environments

## What We've Done ✅

1. **Created comprehensive documentation:**
   - `ENVIRONMENT_STRATEGY.md` - The simplified architecture
   - `CURRENT_ENVIRONMENT_AUDIT.md` - Honest assessment of the mess
   - `DEPLOYMENT_SAFETY.md` - Critical pre-deployment checklist

2. **Clarified terminology:**
   - Using "production Neon" (safe - no users yet)
   - Removed unnecessary staging/preview Neon branch complexity
   - Aligned with Netlify preview/production URLs
   - Deferred dev/staging split until Neon serves real users

3. **Established safety principles:**
   - Production MySQL stays untouched (read-only for imports)
   - Production Neon can be experimented with safely
   - Feature flags control cutover (instant rollback)
   - Clear documentation prevents accidents

## Current State

**Production (ynotradio.net):**

- MySQL: Active, serving all users
- Feature flags: All `false` (MySQL mode)
- Safe to deploy code changes

**Production Neon:**

- Receiving imports
- NOT serving users yet
- Safe to experiment

**Local Docker:**

- MySQL: Mirror of production (refreshed via script)
- Postgres: Optional local testing

## What's NOT Done Yet 🚧

### Phase 1 Implementation (Next Session):

1. **Consolidate .env files** (from 4+ to 3)
   - Create `.env.production` (Neon prod)
   - Keep `.env.local` (Docker)
   - Create `.env.production.mysql` (read-only prod MySQL)
   - Remove `src/partials/.env` complexity
   - Remove `bin/migrations/.env`

2. **Update import scripts**
   - Replace `--env dev|prod` with explicit targets
   - New: `yarn import --from prod-mysql --to prod-neon`
   - Update all 7 import scripts

3. **Fix refresh_local.sh**
   - Point at new consolidated configs
   - Test it works with new structure

4. **Test everything**
   - Verify production site still works
   - Verify imports work
   - Verify local development works

## Merge Criteria

Before merging to main:

- [ ] All 3 .env files created and working
- [ ] Import scripts use clear `--from/--to` syntax
- [ ] No more ambiguous `--dev/--prod` flags
- [ ] refresh_local.sh works
- [ ] Production site tested (still on MySQL)
- [ ] Deployment safety checklist verified
- [ ] All tests pass

## Questions/Decisions Needed

1. **Production MySQL credentials** - Need read-only access for imports
   - What's the hostname?
   - What credentials should we use?

2. **Deployment timeline** - When do you want to merge this?
   - Can wait for proper implementation
   - Or merge docs now, implement later

3. **Immediate workaround** - For today's missing data issue:
   - Re-run `./bin/refresh_local.sh` to get latest MySQL
   - Then run `yarn import:incremental`
   - This gets the "Mitski" songs imported

## Safety Status

✅ **Current main branch:** Safe to deploy (production on MySQL)
✅ **This branch:** Documentation only, safe to review
⚠️ **After implementation:** Must verify before merging

**Bottom line:** Your production site is safe. All changes are isolated to this branch.
