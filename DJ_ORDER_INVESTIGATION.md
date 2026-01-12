# DJ Page Order Investigation

## Issue
- **Production:** Shows 32 DJs starting with: Josh T. Landow, Adrienne, Carly M., Dan Baker...
- **Localhost:** Shows 64 (or 83) DJs starting with: Josh T. Landow, Brendan McNulty, Bob Grant, Gerry Song...

## Database Status

### PROD Postgres (ep-winter-lab-ah4kk1tw)
- Total DJs: 83
- All have `on_air = true` (updated)
- Query should return 83 DJs ordered by `sort_order`

### MySQL (local)
- deejays table: Does not exist
- stories table: 84 rows (but this might be wrong table name)

## Problems Identified

1. **DSN Format Fixed:** Changed from `options='project=X'` to `options=endpoint=X` in Database.php
   - Old format caused "password authentication failed" errors
   - New format connects successfully

2. **Localhost Still Shows 64 DJs:** Even with Postgres connection working, localhost returns 64 not 83
   - Suggests either:
     - Query has a LIMIT that's not accounted for
     - Some DJs are being filtered out
     - Still falling back to MySQL despite connection working

3. **Order Mismatch:** Production and localhost have completely different DJ orders
   - Production: Adrienne is #2
   - Localhost: Brendan McNulty is #2
   - This suggests they're querying different data sources or have different sort_order values

## Next Steps

1. ✅ Fixed Database.php DSN format
2. ⏸️ Need to verify why localhost shows 64 not 83 DJs
3. ⏸️ Need to compare sort_order values in Postgres vs production
4. ⏸️ Need to confirm production is actually using Postgres (not MySQL)

## SQL for Investigation

```sql
-- Check sort_order and names in PROD database
SELECT id, string_agg(p.name, ' & ') as name, d.sort_order
FROM djs d
LEFT JOIN djs_rels dr ON d.id = dr.parent_id AND dr.path = 'person'
LEFT JOIN people p ON dr.people_id = p.id
WHERE d.on_air = true
GROUP BY d.id, d.sort_order
ORDER BY d.sort_order ASC
LIMIT 35;
```
