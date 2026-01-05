# Schema Cleanup Summary

**Date:** January 5, 2026  
**Issue:** Check for unused fields in Neon Postgres schema  
**Status:** ✅ Complete - Migration created and tested

---

## Answer to Original Question

> "Are there any unused fields in the new neon postgres schema after we've run a few migrations? If so, should we clean them up before we start doing real imports / deploys in production?"

### **YES** - Two unused fields found:

1. **`djs.show_name`** - VARCHAR column never used
2. **`shows.day`** - ENUM column never used

### **YES** - We should clean them up before production:

✅ **Cleanup migration created:** `payload/migrations/20260105_162500_cleanup_unused_fields.ts`  
✅ **Tested locally:** Verified removal works correctly  
✅ **Safe operation:** No data loss, no code changes needed  
✅ **Recommendation:** Run before production data import

---

## Why These Fields Exist

These fields were included in the initial Payload migration (`20251231_210218`) but are **not defined** in the current collection schemas:

- `DJs.ts` uses `description` and `displayName` instead of `show_name`
- `Shows.ts` uses `date` field instead of separate `day` enum

The fields exist in migration JSON files as historical artifacts but serve no purpose.

---

## What Was Done

### 1. Analysis
- ✅ Examined all Payload collection schemas
- ✅ Compared with migration JSON files
- ✅ Identified unused fields
- ✅ Verified no code references
- ✅ Confirmed no data would be lost

### 2. Documentation
- ✅ Created detailed analysis report
- ✅ Created quick reference guide
- ✅ Added test documentation

**Files Created:**
- `docs/migrations/reports/unused-fields-analysis.md` - Full analysis
- `docs/migrations/SCHEMA_CLEANUP.md` - Quick reference
- `test/schema-cleanup.test.ts` - Documentation test

### 3. Migration
- ✅ Created cleanup migration
- ✅ Added to migration index
- ✅ Tested locally with Docker PostgreSQL
- ✅ Verified columns removed correctly
- ✅ Verified enum type removed
- ✅ Included rollback migration

**Files Created:**
- `payload/migrations/20260105_162500_cleanup_unused_fields.ts`

### 4. Testing
Local PostgreSQL test results:

**Before cleanup:**
```
DJs: id, show_name, email, ..., legacy_id (12 columns)
Shows: id, date, day, start_time, ..., legacy_id (11 columns)
Enums: enum_shows_day
```

**After cleanup:**
```
DJs: id, email, ..., legacy_id (11 columns) ✅ show_name removed
Shows: id, date, start_time, ..., legacy_id (10 columns) ✅ day removed
Enums: (none) ✅ enum_shows_day removed
```

---

## Next Steps

### For Production Deployment

1. **Run migrations before data import:**
   ```bash
   DATABASE_URI=$NEON_PROD_DATABASE_URL yarn payload:migrate
   ```

2. **Verify cleanup:**
   ```sql
   -- Check show_name is gone
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'djs' AND column_name = 'show_name';
   -- Should return 0 rows
   
   -- Check day is gone
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'shows' AND column_name = 'day';
   -- Should return 0 rows
   ```

3. **Proceed with data import:**
   ```bash
   yarn seed:payload  # Or your import scripts
   ```

### For Local Development

Migrations run automatically with Payload. Fresh database installations will include the cleanup.

---

## Impact Assessment

| Category | Impact | Notes |
|----------|--------|-------|
| **Data Loss** | None | Fields were never populated |
| **Code Changes** | None | Fields not referenced in code |
| **Breaking Changes** | None | No APIs or features affected |
| **Performance** | Minimal improvement | Slightly smaller table size |
| **Maintenance** | Positive | Removes technical debt |

---

## Technical Details

### Migration Strategy

The cleanup migration uses `IF EXISTS` clauses for safety:

```sql
ALTER TABLE "djs" DROP COLUMN IF EXISTS "show_name";
DROP INDEX IF EXISTS "djs_show_name_idx";
ALTER TABLE "shows" DROP COLUMN IF EXISTS "day";
DROP TYPE IF EXISTS "enum_shows_day";
```

### Rollback Available

If needed, the migration can be rolled back:

```bash
yarn payload:migrate:down
```

This will restore the unused fields (though this is unlikely to be needed).

---

## Recommendation

### ✅ **RUN THE CLEANUP MIGRATION**

**Why:**
1. **Best practice:** Start production with clean schema
2. **Prevents confusion:** No orphaned fields for future developers
3. **Documentation accuracy:** Schema matches documentation
4. **Safe operation:** Zero risk, zero data loss
5. **Right timing:** Before production data import

**When:**
- Before first production data import
- As part of initial production deployment
- Now is the ideal time

---

## Conclusion

Two unused fields were found in the Neon Postgres schema:
- ✅ Identified and documented
- ✅ Cleanup migration created and tested
- ✅ Safe to run before production deployment
- ✅ Recommended to clean up now

The cleanup migration is ready to deploy and will result in a cleaner, more maintainable production schema.

---

## Related Documentation

- [Full Analysis Report](./reports/unused-fields-analysis.md)
- [Quick Reference Guide](./SCHEMA_CLEANUP.md)
- [Migration File](../../payload/migrations/20260105_162500_cleanup_unused_fields.ts)
- [Test Documentation](../../test/schema-cleanup.test.ts)

---

**Status:** ✅ Ready for production deployment
