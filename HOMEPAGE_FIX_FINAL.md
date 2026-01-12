# Homepage Story Order - Final Fix

## Problem
Localhost homepage was showing wrong order and duplicate MixCloud widget:
- **Localhost:** Top 11, Rodney, Support (LEFT) / CD, Top 225, MixCloud (RIGHT) + MixCloud in sidebar
- **Production:** Top 11, CD, Rodney (LEFT) / Top 225, Support (RIGHT) + MixCloud in sidebar only

## Root Cause
1. **Wrong database:** Was updating PROD database (`ep-winter-lab`) but PHP connects to DEV database (`ep-fragrant-butterfly`)
2. **Duplicate MixCloud:** Story ID 1522 in database PLUS hardcoded widget in sidebar
3. **Wrong priorities:** Priority order didn't match visual left-to-right reading order
4. **Too many old stories:** 42 "permanent" archive stories with end_date=2099-12-31 were still active

## Solution

### Database: DEV (ep-fragrant-butterfly-ahf3gnej)
**Connection used by PHP:**
- Host: `ep-fragrant-butterfly-ahf3gnej.c-3.us-east-1.aws.neon.tech`
- From env var: `POSTGRES_HOST`

### Changes Applied
```sql
-- 1. Hide MixCloud story (sidebar already has hardcoded widget)
UPDATE posts SET end_date = '2026-01-11' WHERE id = 1522;

-- 2. Hide 42 old archive stories
UPDATE posts SET end_date = '2026-01-11' WHERE id IN (763, 780, 1152, ...);

-- 3. Set correct priorities for visual order
--    Index 0,2,4 → LEFT column
--    Index 1,3,5 → RIGHT column
UPDATE posts SET priority = 1 WHERE id = 1177;  -- Top 11 (index 0 → LEFT)
UPDATE posts SET priority = 2 WHERE id = 1311;  -- Top 225 (index 1 → RIGHT)
UPDATE posts SET priority = 3 WHERE id = 917;   -- CD (index 2 → LEFT)
UPDATE posts SET priority = 4 WHERE id = 1046;  -- Support (index 3 → RIGHT)
UPDATE posts SET priority = 5 WHERE id = 860;   -- Rodney (index 4 → LEFT)

-- 4. Publish Rodney (was draft)
UPDATE posts SET _status = 'published' WHERE id = 860;

-- 5. Fix CD start date (was future-dated)
UPDATE posts SET start_date = '2026-01-01' WHERE id = 917;
```

## Final Result ✅
**LEFT COLUMN:**
1. Top 11 @ 11: Vote & Win Shame Tickets
2. CD of The Week
3. Rodney Anonymous Tells You How To Live

**RIGHT COLUMN:**
4. Y-Not's Top 225 of 2025 + Year End Poll
5. Support Y-Not Radio + Get Y-Not Sessions 2025

**SIDEBAR:**
- MixCloud widget (hardcoded in `_featured_concerts_and_ads.php` lines 55-58)
- Featured Concerts
- Ads

## Key Learnings
1. **Two Neon databases:** DEV vs PROD - always check POSTGRES_HOST to confirm which one PHP uses
2. **Two-column layout logic:** index % 2 === 0 → LEFT, index % 2 === 1 → RIGHT
3. **MixCloud widget:** Hardcoded in sidebar template, should NOT be a database story
4. **Archive stories:** Many old stories had end_date=2099-12-31 making them "permanent" - need to hide them
5. **Content updates:** Updates to PROD database were wasted effort since PHP connects to DEV

## Files Involved
- `/src/partials/_featured_concerts_and_ads.php` - Hardcoded MixCloud widget (lines 55-58)
- `/src/index.php` - Calls `getAll()` and splits into left/right columns
- `/src/models/implementations/PostgresStory.php` - Query logic, column splitting
- `/src/lib/Database.php` - Postgres connection using POSTGRES_HOST env var
