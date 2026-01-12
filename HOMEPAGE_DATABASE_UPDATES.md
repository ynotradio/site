# Database Updates for Homepage Story Matching

**Date:** 2026-01-12  
**Database:** Neon Postgres (ynotradio database)  
**Purpose:** Match localhost:8080 homepage to production ynotradio.net

## Summary

Updated Postgres database to match production homepage:
- ✅ 6 stories displayed in correct order
- ✅ All images loading with proper URLs
- ✅ Old/duplicate stories hidden
- ✅ Priority values aligned with production

## Changes Applied

### 1. Story Priority Updates

Stories reordered to match production display:

```sql
-- Update priorities to match production order
UPDATE posts SET priority = 1 WHERE id = 1177;  -- Top 11 Shame Tickets (was 2)
UPDATE posts SET priority = 2 WHERE id = 917;   -- CD of The Week (was 10)
UPDATE posts SET priority = 3 WHERE id = 860;   -- Rodney Anonymous (was 0)
UPDATE posts SET priority = 4 WHERE id = 1311;  -- Top 225 of 2025 (was 1)
UPDATE posts SET priority = 5 WHERE id = 1046;  -- Support Y-Not (was 4)
```

### 2. Story Status Updates

```sql
-- Publish CD of The Week
UPDATE posts SET _status = 'published', start_date = '2020-01-01' WHERE id = 917;

-- Publish Rodney Anonymous
UPDATE posts SET _status = 'published' WHERE id = 860;
```

### 3. Hide Old Stories

Set end_date to yesterday to remove from active display:

```sql
UPDATE posts SET end_date = '2026-01-11' WHERE id = 763;   -- Top 11 They Might Be Giants
UPDATE posts SET end_date = '2026-01-11' WHERE id = 780;   -- Top 11 Sun Airway
UPDATE posts SET end_date = '2026-01-11' WHERE id = 1152;  -- Y-Not Philly Best of 2015
UPDATE posts SET end_date = '2026-01-11' WHERE id = 683;   -- Y-Not Philly Best of 2011
UPDATE posts SET end_date = '2026-01-11' WHERE id = 1096;  -- Y-Not Philly Arc In Round
UPDATE posts SET end_date = '2026-01-11' WHERE id = 916;   -- Y-Not Philly Clark Park
UPDATE posts SET end_date = '2026-01-11' WHERE id = 1036;  -- Rodney Anonymous (duplicate)
```

### 4. Create Missing Story

```sql
-- Create MixCloud story
INSERT INTO posts (
    headline, slug, start_date, end_date, content, priority, 
    _status, created_at, updated_at
) VALUES (
    'Follow Y-Not Radio on MixCloud',
    'follow-y-not-radio-on-mixcloud',
    '2020-01-01',
    '2099-12-31',
    '{"root":{"type":"root","children":[{"type":"paragraph","children":[{"type":"text","text":"<iframe width=\"218\" height=\"250\" src=\"https://www.mixcloud.com/widget/follow/?dark=1&u=%2Fynotradio%2F&hide_followers=1\" frameborder=\"0\"></iframe>","version":1}],"direction":null,"format":"","indent":0,"version":1}],"direction":null,"format":"","indent":0,"version":1}}'::jsonb,
    6,
    'published',
    NOW(),
    NOW()
);
-- Result: ID 1522
```

### 5. Image URL Updates

Updated image_url to match production:

```sql
UPDATE posts SET image_url = 'https://cdn.etix.com/etix/performance-image/performance_image_150w/f199f4d4c62b8eecec7bb333071d98b7.jpg' WHERE id = 1177;
UPDATE posts SET image_url = 'https://f4.bcbits.com/img/a4213216818_2.jpg' WHERE id = 917;
UPDATE posts SET image_url = 'images/rodney.png' WHERE id = 860;
UPDATE posts SET image_url = 'https://i.imgur.com/aUQ4tUa.png' WHERE id = 1311;
UPDATE posts SET image_url = 'https://i.imgur.com/lIp8d4K.jpeg' WHERE id = 1046;
```

## Final Homepage Stories

After all updates, the homepage displays these 6 stories in order:

| Priority | ID | Headline | Image |
|----------|-----|----------|-------|
| 1 | 1177 | Top 11 @ 11: Vote & Win Shame Tickets | ✅ etix.com URL |
| 2 | 917 | CD of The Week | ✅ bcbits.com URL |
| 3 | 860 | Rodney Anonymous Tells You How To Live | ✅ images/rodney.png |
| 4 | 1311 | Y-Not's Top 225 of 2025 + Year End Poll | ✅ imgur.com URL |
| 5 | 1046 | Support Y-Not Radio + Get Y-Not Sessions 2025 | ✅ imgur.com URL |
| 6 | 1522 | Follow Y-Not Radio on MixCloud | (iframe widget) |

## Code Changes

File: `src/models/implementations/PostgresStory.php`

```php
// Line 81: Added id to ORDER BY for deterministic sorting
ORDER BY p.priority ASC, p.id ASC
```

**Why:** When multiple stories have the same priority, we need a secondary sort key to ensure consistent ordering across page loads. This prevents the two-column layout from splitting stories incorrectly.

## Verification

```bash
# Check active stories
SELECT id, headline, priority, image_url 
FROM posts 
WHERE _status = 'published' 
  AND start_date <= CURRENT_DATE 
  AND end_date >= CURRENT_DATE 
ORDER BY priority ASC, id ASC;

# Should return exactly 6 stories in correct order
```

## Comparison Results

**Before fixes:**
- 11 stories displaying (too many)
- Wrong priority order
- Missing images (showed placeholder URLs like "top11.php")
- Duplicate stories

**After fixes:**
- ✅ 6 stories (matches production)
- ✅ Correct priority order (1, 2, 3, 4, 5, 6)
- ✅ All images loading with proper URLs
- ✅ No duplicates

## Notes

1. **MixCloud appears twice:** Once in main stories (from posts table), once in sidebar (from `partials/_featured_concerts_and_ads.php`). This matches production behavior.

2. **Image URLs:** Some stories use dynamic URLs (e.g., "top11.php", "donate.php") while others use static image URLs. This is intentional for stories where the image is generated dynamically.

3. **Priority values:** Not all priority values are unique. Multiple stories can share the same priority (e.g., priority 2). The `ORDER BY ... id ASC` ensures deterministic ordering in these cases.

4. **Dates:** Stories with `end_date >= 2099` are "permanent" stories that should always display. Stories with past end_dates are automatically hidden from the homepage.

## Migration to Production

To apply these same changes to production Postgres:

1. Run the SQL statements above in order
2. Restart PHP-FPM to clear any caching: `docker restart site-phpfpm-1`
3. Verify homepage matches expected output
4. No code deployment needed (already in PR #170)
