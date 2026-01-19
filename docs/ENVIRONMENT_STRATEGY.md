# Environment & Database Strategy Proposal

## Current Problems

1. **Too many .env files**: `.env.local`, `src/partials/.env`, `bin/migrations/.env`, plus overrides
2. **Unclear database targets**: Scripts use `--dev` and `--prod` flags that don't map clearly to actual databases
3. **Complex data flow**: Production MySQL → Local MySQL → Multiple Postgres databases
4. **Risk of production disruption**: Changes to env files or imports could accidentally affect ynotradio.net
5. **Duplicate environment variables**: Same vars in multiple files, causing override conflicts

## Proposed Architecture

### Database Landscape

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION (ynotradio.net)                │
│  - MySQL (primary, read/write) ← Current production site    │
│  - Postgres/Neon (future, read-only during migration)       │
└─────────────────────────────────────────────────────────────┘
                            ↓ mysqldump
┌─────────────────────────────────────────────────────────────┐
│              LOCAL DEVELOPMENT (Docker)                      │
│  - MySQL (read-only mirror of prod)                         │
│  - Postgres (local testing)                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓ import scripts
┌─────────────────────────────────────────────────────────────┐
│              STAGING (Neon Dev Branch)                       │
│  - Postgres/Neon (safe testing of imports)                  │
└─────────────────────────────────────────────────────────────┘
```

### Environment Files - NEW STRUCTURE

**ONE source of truth per environment:**

```
.env.production          # Production Neon Postgres (for future cutover)
.env.staging             # Staging Neon Postgres (for testing imports)
.env.local               # Local development (Docker containers)
.env.production.mysql    # Production MySQL credentials (read-only access)
```

**Remove these:**

- ❌ `src/partials/.env` (merged into above)
- ❌ `bin/migrations/.env` (merged into above)
- ❌ Multiple postgres flag overrides

### Import Script Clarity

**REMOVE ambiguous `--env dev|prod` flags**

**NEW approach - explicit database targets:**

```bash
# Import from production MySQL → staging Neon
yarn import --from prod-mysql --to staging-neon

# Import from production MySQL → production Neon
yarn import --from prod-mysql --to prod-neon

# Import from local MySQL → local Postgres
yarn import --from local-mysql --to local-postgres
```

### Deployment Safety

**Key principle: Production ynotradio.net NEVER touched by import scripts**

1. **Production PHP site (ynotradio.net)**
   - Stays on MySQL (no changes)
   - Feature flags in PHP control Postgres access (currently all `false`)
   - Zero risk during migration work

2. **Staging environment**
   - All import testing happens here
   - Uses Neon branch database
   - Can be reset/wiped safely

3. **Cutover plan** (future, when ready)
   - Change PHP feature flags from `false` → `true`
   - Site switches from MySQL → Postgres
   - Can roll back instantly by toggling flags

### File Structure

```
.env.production           # Neon production Postgres
.env.staging              # Neon staging Postgres
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

- [ ] Create new branch: `feat/simplify-environments`
- [ ] Consolidate .env files
- [ ] Update import scripts with clear targets
- [ ] Test imports to staging Neon
- [ ] Verify production site unaffected

### Phase 2: Testing

- [ ] Regular imports from prod MySQL → staging Neon
- [ ] Compare staging Neon data with prod MySQL
- [ ] Test PHP site pointing at staging Neon

### Phase 3: Production Cutover (FUTURE)

- [ ] Final sync: prod MySQL → prod Neon
- [ ] Toggle PHP feature flags to use Postgres
- [ ] Monitor production
- [ ] Keep MySQL as fallback (flags can toggle back)

## Rollback Safety

**At ANY point, production can be rolled back:**

```bash
# In production PHP environment
USE_POSTGRES_* = false  # Back to MySQL
USE_POSTGRES_* = true   # Forward to Postgres
```

## Benefits

1. ✅ **Clear naming**: No more guessing what `--env dev` means
2. ✅ **Safe by default**: Production MySQL never modified
3. ✅ **Easy testing**: Staging environment for all experiments
4. ✅ **Fast rollback**: Toggle feature flags instantly
5. ✅ **Single source of truth**: One .env file per environment
6. ✅ **Clear data flow**: Prod MySQL → Staging → Prod Neon

## Next Steps

1. Create new branch
2. Implement Phase 1 changes
3. Test thoroughly on staging
4. Merge only when production safety verified
