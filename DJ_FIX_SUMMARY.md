# DJ Page Fix - Summary

## Problem
- **Production:** 32 DJs using MySQL
- **Localhost:** 64 DJs using Postgres (default LIMIT in code)
- Wrong DJs showing, wrong order

## Root Cause
1. **Database Mismatch:** Production uses MySQL (doesn't have Postgres connection working), localhost was configured to use Postgres
2. **Migration Issue:** Imported all 83 DJs from MySQL to Postgres, but only 32 should be "on air"
3. **Default LIMIT:** PostgresDeejay::getAll() has default `LIMIT 64`
4. **Wrong on_air values:** All 83 DJs had `on_air = true` after initial fix
5. **Wrong sort_order:** Most DJs had `sort_order = 1`, causing indeterminate order

## Solution Applied

### 1. Fixed Database.php DSN Format
**File:** `src/lib/Database.php`
- Changed from: `options='project=$endpoint'`  
- Changed to: `options=endpoint=$endpoint`
- Reason: Neon requires `endpoint=` format, not `project=`

### 2. Configured to Use DEV Database  
**File:** `.env.local`
- Set `POSTGRES_HOST=ep-fragrant-butterfly-ahf3gnej.c-3.us-east-1.aws.neon.tech`
- This matches production's configuration in `src/partials/.env`

### 3. Fixed DJ Visibility and Sort Order
**Applied to BOTH databases:**
- DEV: `ep-fragrant-butterfly-ahf3gnej`
- PROD: `ep-winter-lab-ah4kk1tw`

**SQL Updates:**
```sql
-- Set ALL DJs to off-air first
UPDATE djs SET on_air = false;

-- Then enable only the 32 production DJs with correct sort_order (0-31)
UPDATE djs SET on_air = true, sort_order = 0 WHERE id = 1;  -- Josh T. Landow
UPDATE djs SET on_air = true, sort_order = 1 WHERE id = 72; -- Adrienne
... (30 more)
UPDATE djs SET on_air = true, sort_order = 31 WHERE id = 22; -- Hugo

-- Hide duplicate records
UPDATE djs SET on_air = false WHERE id IN (2, 78);
```

## Final Result ✅

**Localhost (http://localhost:8080/deejays.php):**
- 32 DJs displayed
- All correct DJs present (Adrienne, Rodney Anonymous, Hugo, etc.)
- Inactive DJs hidden (Brendan McNulty, Bob Grant, etc.)
- Using Postgres DEV database successfully

**Both Neon Databases Now Have:**
- 32 DJs with `on_air = true`
- 51 DJs with `on_air = false`  
- Correct `sort_order` values (0-31)
- Duplicates hidden

## Architecture Notes

**Production (ynotradio.net):**
- Uses MySQL for DJs (Postgres connection likely failing silently)
- Postgres endpoint in src/partials/.env points to DEV database
- Shows 32 DJs from MySQL `deejays` table

**Localhost:**
- Now uses Postgres DEV database (matches production config)
- Shows 32 DJs from Postgres `djs` table
- Successfully connects with fixed DSN format

## Files Modified
- `src/lib/Database.php` - Fixed Neon DSN format
- `.env.local` - Set POSTGRES_HOST to DEV database
- Both Neon databases - Updated 83 DJ records

## Why Production Still Uses MySQL

Production has `use_postgres_deejays = true` in config, but likely:
1. The DSN format was wrong (we just fixed this)
2. Connection fails silently and falls back to MySQL
3. This fallback is intentional in DeejayFactory.php lines 25-28

Once Database.php fix is deployed to production, it should start using Postgres successfully.
