# Troubleshooting Guide

Common issues encountered during Payload CMS cutover and their solutions.

## Database Connection Issues

### Problem: "password authentication failed for user 'neondb_owner'"

**Cause:** Wrong DSN format for Neon Postgres

**Solution:**
```php
// WRONG - causes auth failures
$dsn .= ";options='project=$endpoint'";

// CORRECT - works properly  
$dsn .= ";options=endpoint=$endpoint";
```

**File:** `src/lib/Database.php` line 56

### Problem: "Endpoint ID is not specified"

**Cause:** Missing endpoint parameter in DSN

**Solution:** Ensure endpoint is extracted from hostname and added to DSN:
```php
if (preg_match('/^(ep-[a-z0-9-]+)/', $host, $matches)) {
    $endpoint = $matches[1];
    $dsn .= ";options=endpoint=$endpoint";
}
```

## Display Issues

### Problem: Wrong number of items showing (e.g., 64 DJs instead of 32)

**Cause:** Check `on_air` or visibility flags in database

**Solution:**
```sql
-- Check current status
SELECT COUNT(*) FROM djs WHERE on_air = true;

-- Set correct visibility
UPDATE djs SET on_air = true WHERE id IN (...active IDs...);
UPDATE djs SET on_air = false WHERE id NOT IN (...active IDs...);
```

### Problem: Items in wrong order

**Cause:** Two-column layouts need interleaved sort_order

**Explanation:**
- Array split: even indexes → LEFT column, odd indexes → RIGHT column
- Visual order must account for this split
- Database order: 0, 1, 2, 3, 4, 5...
- Visual order: 0 (L), 1 (R), 2 (L), 3 (R)...

**Solution:**
Set sort_order to match visual left-to-right, top-to-bottom reading:
```sql
UPDATE djs SET sort_order = 0 WHERE id = X;  -- LEFT row 1
UPDATE djs SET sort_order = 1 WHERE id = Y;  -- RIGHT row 1
UPDATE djs SET sort_order = 2 WHERE id = Z;  -- LEFT row 2
UPDATE djs SET sort_order = 3 WHERE id = W;  -- RIGHT row 2
```

### Problem: Escaped HTML tags showing as text (e.g., `&lt;font&gt;`)

**Cause:** Lexical converter calling `htmlspecialchars()` on already-escaped content

**Solution:** Remove `htmlspecialchars()` from text node case:
```php
// WRONG - double-escapes content
case 'text':
    return htmlspecialchars($node['text']);

// CORRECT - content already safe
case 'text':
    return $node['text'];
```

**Files to fix:**
- PostgresStory.php
- PostgresSchedule.php
- PostgresCdOfTheWeek.php
- PostgresCustomText.php

**Security Note:** This is safe because content comes from Payload CMS (admin-only), not user input.

## PHP Errors

### Problem: "mysqli_fetch_assoc() expects parameter 1 to be mysqli_result, bool given"

**Cause:** MySQL query failing (table doesn't exist)

**Solution:** Update function to use proper model layer or handle failure gracefully:
```php
// OLD - direct MySQL query
$result = mysqli_query($db, "SELECT * FROM table");
$row = mysqli_fetch_assoc($result);  // Fails if query fails

// NEW - use Factory pattern
$model = \YNotRadio\Models\ModelFactory::create($db);
$data = $model->getData();

// OR handle failure
$result = @mysqli_query($db, "SELECT * FROM table");
if (!$result) {
    return [];  // or default value
}
```

### Problem: "RuntimeException: Error fetching current Ads: Table doesn't exist"

**Cause:** SqlAd throwing exception for missing table

**Solution:** Return empty array instead of throwing:
```php
// OLD
if (!$result) {
    throw new \RuntimeException("Error: " . mysqli_error($this->db));
}

// NEW
if (!$result) {
    error_log("Warning: " . mysqli_error($this->db));
    return [];
}
```

## Data Issues

### Problem: Duplicate records (e.g., two "Josh T. Landow" DJs)

**Cause:** Migration created duplicates

**Solution:**
```sql
-- Find duplicates
SELECT name, COUNT(*) 
FROM (
    SELECT d.id, string_agg(p.name, ' & ') as name
    FROM djs d
    LEFT JOIN djs_rels dr ON d.id = dr.parent_id
    LEFT JOIN people p ON dr.people_id = p.id
    GROUP BY d.id
) sub
GROUP BY name
HAVING COUNT(*) > 1;

-- Hide older duplicate
UPDATE djs SET on_air = false WHERE id = <older_id>;
```

### Problem: Too many old records showing (archive stories with end_date=2099)

**Cause:** "Permanent" records with far-future end dates

**Solution:**
```sql
-- Find permanent records
SELECT id, headline, end_date 
FROM posts 
WHERE end_date > '2030-01-01';

-- Hide old ones
UPDATE posts SET end_date = CURRENT_DATE WHERE id IN (...old IDs...);
```

## Image Issues

### Problem: Images not loading

**Check:**
1. Cloudinary credentials in `.env.local`
2. Image URLs in database (should start with Cloudinary domain)
3. Media table has correct URLs

**Solution:**
```sql
-- Check image URLs
SELECT id, url, legacy_url FROM media LIMIT 10;

-- Verify Cloudinary format
SELECT id, filename FROM media WHERE filename LIKE 'dev/uploads/%';
```

## Query Performance

### Problem: Slow page loads

**Check:**
1. Missing indexes on sort_order columns
2. Complex JOINs in queries  
3. N+1 query problems

**Solution:**
```sql
-- Add index if missing
CREATE INDEX idx_djs_sort_order ON djs(sort_order) WHERE on_air = true;
CREATE INDEX idx_posts_priority ON posts(priority) WHERE _status = 'published';
```

## Feature Flag Issues

### Problem: Still showing MySQL data after enabling Postgres flag

**Cause:** Connection failing silently, falling back to MySQL

**Check:** Error logs for connection failures

**Solution:**
1. Verify DSN format (see Database Connection Issues above)
2. Check credentials match database
3. Test connection:
```php
try {
    $pdo = Database::getPostgres();
    echo "Connected successfully!";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
```

## Environment Issues

### Problem: Different results on localhost vs production

**Check:**
1. Which database is configured:
   - `POSTGRES_HOST` in `.env.local`
   - Production uses `src/partials/.env`
2. Feature flags enabled
3. PHP error_reporting level

**Solution:** Ensure both environments use same database:
```bash
# Localhost should use DEV database (matches production)
POSTGRES_HOST=ep-fragrant-butterfly-ahf3gnej.c-3.us-east-1.aws.neon.tech
```

## Getting Help

1. Check error logs: `docker logs site-phpfpm-1`
2. Test database connection: Run SQL queries directly
3. Review similar issues in this guide
4. Check consolidated documentation in `docs/payload-migration/`

## Quick Diagnostic Commands

```bash
# Check database connection
docker exec site-phpfpm-1 php -r "
  \$pdo = new PDO('pgsql:host=HOST;dbname=ynotradio;options=endpoint=ENDPOINT', 'user', 'pass');
  echo 'Connected!';
"

# Test query
docker exec -i site-postgres-1 psql "postgresql://user:pass@host/db" -c "SELECT COUNT(*) FROM posts;"

# Check PHP errors
curl -s http://localhost:8080/page.php 2>&1 | grep -E "Warning|Error|Fatal"

# Verify feature flags
grep "use_postgres" src/config/features.php
```
