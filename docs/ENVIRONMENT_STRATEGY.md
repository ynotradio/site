# Environment & Database Strategy Proposal

## Current Problems

1. **Too many .env files**: `.env.local`, `src/partials/.env`, `bin/migrations/.env`, plus overrides
2. **Unclear database targets**: Scripts use `--dev` and `--prod` flags that don't map clearly to actual databases
3. **Complex data flow**: Production MySQL → Local MySQL → Multiple Postgres databases
4. **Risk of production disruption**: Changes to env files or imports could accidentally affect ynotradio.net
5. **Duplicate environment variables**: Same vars in multiple files, causing override conflicts

## Proposed Architecture

### Database Landscape (Current Phase)

```
┌─────────────────────────────────────────────────────────────┐
│              PRODUCTION (ynotradio.net)                      │
│  - MySQL (primary, active) ← Serving real users now         │
└─────────────────────────────────────────────────────────────┘
                            ↓ mysqldump
┌─────────────────────────────────────────────────────────────┐
│              LOCAL DEVELOPMENT (Docker)                      │
│  - MySQL (mirror of prod, refreshed via script)             │
│  - Postgres (optional local testing)                         │
└─────────────────────────────────────────────────────────────┘
                            ↓ import scripts
┌─────────────────────────────────────────────────────────────┐
│    PREVIEW/PRODUCTION NEON (Netlify Preview URLs)           │
│  - Postgres/Neon (receiving imports, NOT serving users yet) │
│  - Safe to experiment - no real users affected              │
└─────────────────────────────────────────────────────────────┘
```

**Note:** "Production Neon" is currently safe to treat as preview/staging since
the feature flags on ynotradio.net are all `false`. Real users don't touch it yet.
Once we flip those flags, we'll implement proper prod/dev separation in Neon.

### Environment Files - NEW STRUCTURE

**ONE source of truth per environment:**

```
.env.production          # Production Neon (currently safe for preview/testing)
.env.local               # Local development (Docker containers)
.env.production.mysql    # Production MySQL credentials (read-only access)
```

**Remove these:**

- ❌ `src/partials/.env` (merged into above)
- ❌ `bin/migrations/.env` (merged into above)
- ❌ Multiple postgres flag overrides

**Future (when Neon serves real users):**

- Add `.env.development` for Neon dev branch (script exists to copy prod → dev)

### Import Script Clarity

**REMOVE ambiguous `--env dev|prod` flags**

**NEW approach - explicit database targets:**

```bash
# Import from production MySQL → production Neon (safe - no real users yet)
yarn import --from prod-mysql --to prod-neon

# Import from local MySQL → local Postgres (for local testing)
yarn import --from local-mysql --to local-postgres

# Future: when Neon serves real users, add preview target
# yarn import --from prod-mysql --to preview-neon
```

### Deployment Safety

**Key principle: Production ynotradio.net NEVER touched by import scripts**

1. **Production PHP site (ynotradio.net)**
   - Stays on MySQL (no changes)
   - Feature flags in PHP control Postgres access (currently all `false`)
   - Zero risk during import work

2. **Production Neon**
   - Receives imports but doesn't serve users yet
   - Safe to experiment with until feature flags flip
   - Can be wiped/reset if needed without affecting users

3. **Cutover plan** (future, when ready)
   - Final data sync during maintenance window
   - Toggle feature flags from `false` → `true` one at a time
   - Monitor each change
   - Can roll back instantly by toggling flags back

### File Structure

```
.env.production           # Neon production Postgres
.env.preview              # Neon development Postgres
.env.local                # Local Docker MySQL + Postgres
.env.production.mysql     # Production MySQL (read-only)

bin/
  import-from-mysql.ts    # Main import script (replaces quick-import, incremental-import)
  refresh-local-mysql.sh  # Pull prod MySQL → local MySQL

config/
  databases.ts            # All database configs (replaces bin/migrations/config.ts)

docs/
  DEPLOYMENT.md           # Safe deployment checklist
  DATABASES.md            # Database inventory & purpose
```

## Migration Plan

### Phase 1: Cleanup (THIS BRANCH)

- [x] Create new branch: `feat/simplify-environments`
- [x] Create centralized database config (`config/databases.ts`)
- [x] Create `.env.production.mysql.example` template
- [x] Update import scripts with clear `--from` and `--to` targets
- [ ] Test imports to prod Neon (safe - no real users)
- [ ] Verify production site unaffected

### Phase 2: Regular Imports

- [ ] Daily imports from prod MySQL → prod Neon
- [ ] Monitor data quality
- [ ] Compare prod Neon with prod MySQL

### Phase 3: Production Cutover (FUTURE - weeks/months away)

- [ ] Final data validation
- [ ] Toggle PHP feature flags to use Postgres
- [ ] Monitor production closely
- [ ] Keep MySQL as instant fallback

## Rollback Safety

**At ANY point, production can be rolled back:**

```bash
# In production PHP environment
USE_POSTGRES_* = false  # Back to MySQL
USE_POSTGRES_* = true   # Forward to Postgres
```

## Benefits

1. ✅ **Clear naming**: `--from prod-mysql --to prod-neon` (no ambiguity)
2. ✅ **Safe by default**: Production MySQL never modified, prod Neon not serving users yet
3. ✅ **Simple for now**: Only 3 databases to manage (prod MySQL, prod Neon, local Docker)
4. ✅ **Fast rollback**: Toggle feature flags instantly if/when Neon goes live
5. ✅ **Single source of truth**: One .env file per environment (3 total)
6. ✅ **Clear data flow**: Prod MySQL → Prod Neon → (Future: users)
7. ✅ **Netlify aligned**: Matches preview/production terminology

## Next Steps

1. ✅ Create new branch
2. ✅ Document current state
3. Consolidate to 3 .env files
4. Update import scripts
5. Test on prod Neon (safe - no users)
6. Merge when production safety verified
