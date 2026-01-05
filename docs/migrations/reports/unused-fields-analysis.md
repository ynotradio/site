# Unused Fields Analysis - Neon Postgres Schema

**Date:** January 5, 2026  
**Status:** Analysis Complete  
**Action Required:** Yes - Cleanup migration needed

---

## Executive Summary

After analyzing the Payload CMS migration files and collection schemas, **two unused fields** have been identified in the Neon Postgres database schema:

1. **`djs.show_name`** - VARCHAR column that was never populated or used
2. **`shows.day`** - ENUM column that was never populated or used

These fields exist in the database migration files but are not defined in the current Payload collection schemas, meaning they are orphaned columns that serve no purpose.

---

## Detailed Findings

### 1. DJs Table: `show_name` Column

**Status:** ❌ UNUSED  
**Type:** `VARCHAR`  
**Created in:** Migration `20251231_210218`  
**Still present in:** Migration `20260103_032237_dj_multiple_people`

**Analysis:**
- This field was defined in the original schema design (see `docs/payload-migration/03-core-data-models.md`)
- It was included in the first Payload migration that created all collections
- The current `DJs.ts` collection uses `description` (RichText) instead
- The DJ import script (`bin/migrations/importDJs.ts`) never populates this field
- The `displayName` field is auto-generated from the `person` relationship

**Current DJs Schema Uses:**
- `displayName` (text, auto-generated from person names)
- `person` (hasMany relationship to People collection)
- `description` (richText, for show descriptions)

**Evidence:** 
```bash
# No references to show_name in import scripts
$ grep -r "show_name" bin/migrations/importDJs.ts
# (no results)
```

---

### 2. Shows Table: `day` Column

**Status:** ❌ UNUSED  
**Type:** `enum_shows_day` (monday, tuesday, wednesday, thursday, friday, saturday, sunday)  
**Created in:** Migration `20251231_210218`  
**Still present in:** Migration `20260103_032237_dj_multiple_people`

**Analysis:**
- This enum field was included in the original schema
- The current `Shows.ts` collection does NOT define this field
- The Shows import script uses `date` field instead, which includes day-of-week information
- No code references this field

**Current Shows Schema Uses:**
- `date` (date field with full date including day-of-week)
- `startTime` (text, HH:MM format)
- `endTime` (text, HH:MM format)
- `name` (text, optional show name)

**Evidence:**
```bash
# No references to day field in Shows collection or import script
$ grep -r "\"day\":" payload/src/collections/Shows.ts bin/migrations/importSchedule.ts
# (no results)
```

---

## Why These Fields Exist

These unused fields were included in the initial migration files for one of these reasons:

1. **Over-planning:** Fields were defined in the initial schema design but not implemented in the actual Payload collections
2. **Schema evolution:** The schema design changed between planning and implementation, but old migration files weren't cleaned up
3. **Payload auto-generation:** Migration JSON files snapshot the database state, including fields that may have been briefly present

---

## Impact Assessment

### Current Impact: ✅ LOW
- These unused columns do not cause errors or performance issues
- Local fresh installs do NOT create these fields (Payload uses current collection schemas)
- Data integrity is not affected

### Production Risk: ⚠️ MEDIUM
- If production Neon database was migrated from the historical migration files, these fields **do exist**
- Storage overhead is minimal (empty VARCHAR and ENUM columns)
- Could cause confusion during debugging or schema reviews
- Best practice: Clean up before production deployment

---

## Recommendation

### ✅ YES - Clean up these fields before production deployment

**Rationale:**
1. **Schema clarity:** Remove technical debt before production launch
2. **Prevent confusion:** Future developers might think these fields are used
3. **Best practice:** Start production with a clean, accurate schema
4. **Safe operation:** Both fields are unused and contain no data

---

## Action Plan

### Step 1: Create Cleanup Migration

Create a new Payload migration to drop these unused columns:

```typescript
// payload/migrations/YYYYMMDD_HHMMSS_cleanup_unused_fields.ts
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Remove unused show_name column from djs table
    ALTER TABLE "djs" DROP COLUMN IF EXISTS "show_name";
    
    -- Remove unused day column from shows table
    ALTER TABLE "shows" DROP COLUMN IF EXISTS "day";
    
    -- Drop the now-unused enum type
    DROP TYPE IF EXISTS "enum_shows_day";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Recreate enum type
    CREATE TYPE "enum_shows_day" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
    
    -- Re-add show_name column to djs table
    ALTER TABLE "djs" ADD COLUMN "show_name" varchar;
    
    -- Re-add day column to shows table
    ALTER TABLE "shows" ADD COLUMN "day" "enum_shows_day";
  `)
}
```

### Step 2: Test Migration Locally

```bash
# Run migration against local PostgreSQL
yarn payload:migrate

# Verify columns are removed
psql -h localhost -U ynot_postgres_user -d ynot_payload_dev \
  -c "\d+ djs" \
  -c "\d+ shows"
```

### Step 3: Deploy to Production (When Ready)

```bash
# Before production data import, run migration
DATABASE_URI=$NEON_PROD_DATABASE_URL yarn payload:migrate
```

---

## Alternative: Do Nothing

**If you choose NOT to clean up:**
- Document these fields as unused in code comments
- Monitor for any unexpected usage
- Clean up in a future schema refactor

However, cleaning up NOW is recommended since:
- No production data migration has occurred yet
- Simple, safe operation
- Prevents technical debt

---

## Verification Checklist

After running cleanup migration:

- [ ] Verify `djs.show_name` column is removed
- [ ] Verify `shows.day` column is removed  
- [ ] Verify `enum_shows_day` type is removed
- [ ] Verify all Payload collections still load correctly
- [ ] Verify admin UI works for DJs and Shows collections
- [ ] Run test suite to ensure no breakage
- [ ] Document the cleanup in migration history

---

## Conclusion

**Recommendation:** ✅ **YES - Create and run cleanup migration before production deployment**

These unused fields represent technical debt from the schema design phase. Cleaning them up now is a low-risk, high-value operation that will result in a cleaner production database schema.

---

**Next Steps:**
1. Generate cleanup migration: `yarn payload:migrate:create`
2. Test locally with Docker PostgreSQL
3. Review and approve PR
4. Deploy to production Neon database before data import
