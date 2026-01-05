# Schema Cleanup - Quick Reference

## TL;DR

**Issue:** Two unused fields exist in Neon Postgres schema from initial migration:
- `djs.show_name` (never used)
- `shows.day` (never used)

**Solution:** Run cleanup migration before production data import.

**Status:** ✅ Migration created and tested

---

## Running the Cleanup

### Option 1: Run All Migrations (Recommended)

If starting fresh or before production deploy:

```bash
# Set environment variables
export DATABASE_URI=your_neon_database_url
export PAYLOAD_SECRET=your_secret

# Run all migrations (includes cleanup)
yarn payload:migrate
```

The cleanup migration runs automatically after the initial migrations.

### Option 2: Manual SQL (If needed)

If you need to run cleanup on an existing database:

```sql
-- Remove unused show_name column from djs table
ALTER TABLE "djs" DROP COLUMN IF EXISTS "show_name";

-- Drop the show_name index if it exists
DROP INDEX IF EXISTS "djs_show_name_idx";

-- Remove unused day column from shows table
ALTER TABLE "shows" DROP COLUMN IF EXISTS "day";

-- Drop the now-unused enum type
DROP TYPE IF EXISTS "enum_shows_day";
```

---

## Verification

Check that fields are removed:

```bash
# Connect to database
psql $DATABASE_URI

# Check DJs table (should NOT have show_name)
\d+ djs

# Check Shows table (should NOT have day)
\d+ shows

# Check enum type is gone
SELECT typname FROM pg_type WHERE typname = 'enum_shows_day';
-- Should return 0 rows
```

---

## What This Cleanup Does

### Before

**DJs table:**
- ✅ Used columns: id, email, photo_id, on_air, sort_order, etc.
- ❌ **show_name** (unused, no data)

**Shows table:**
- ✅ Used columns: id, date, start_time, end_time, host_id, etc.
- ❌ **day** (unused, no data)

**Types:**
- ❌ **enum_shows_day** (unused enum)

### After

**DJs table:**
- ✅ All active columns only
- ❌ show_name removed

**Shows table:**
- ✅ All active columns only
- ❌ day removed

**Types:**
- ❌ enum_shows_day removed

---

## Impact

### ✅ Safe to Run
- No data loss (fields were empty)
- No code changes needed (fields not used)
- Reversible (down migration included)
- No production systems affected yet

### 🎯 Benefits
- Clean schema for production launch
- No confusion about unused fields
- Removes technical debt early
- Accurate schema documentation

---

## Rollback (If Needed)

The migration includes a down() function to restore the fields:

```bash
# If you need to rollback
yarn payload:migrate:down
```

This will:
1. Recreate `enum_shows_day` type
2. Add back `show_name` column to djs
3. Add back `day` column to shows

**Note:** Rollback is unlikely to be needed since these fields were never used.

---

## For CI/CD

Add to deployment script before data import:

```bash
#!/bin/bash
set -e

echo "Running database migrations..."
yarn payload:migrate

echo "Verifying cleanup..."
psql $DATABASE_URI -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'djs' AND column_name = 'show_name';" | grep "(0 rows)"

echo "✅ Schema cleanup complete"
```

---

## Questions?

See full analysis: `docs/migrations/reports/unused-fields-analysis.md`

Migration file: `payload/migrations/20260105_162500_cleanup_unused_fields.ts`
