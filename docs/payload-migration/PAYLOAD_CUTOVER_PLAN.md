# Payload CMS Cutover Plan

**Generated:** 2026-01-12  
**Status:** Ready for Implementation

## Executive Summary

Based on side-by-side comparison of localhost:8080 (Payload/Postgres) vs ynotradio.net (MySQL), we have **7 blocking issues** preventing cutover. All issues are fixable within 1-2 days of focused work.

### Critical Blockers (Must Fix)
1. **Home Page (Front Page)** - Missing images, wrong number/sort order of stories
2. **OnDemand** - Fatal DB error (missing `image` column handling)
3. **CD of the Week** - Data not loading
4. **Schedule** - Raw JSON showing instead of formatted content
5. **Top 11** - Session warnings breaking page layout
6. **Custom Texts** - No Postgres read implementation exists
7. **DeeJays** - Incomplete roster data

### Lower Priority (Can defer)
- New Music content staleness (data sync issue)
- Mixed-content warnings (prod HTTPS issue)
- Missing 404 assets (mostly cosmetic)

---

## Priority 1: Critical Fixes (MUST complete before cutover)

### 1.1 Fix Home Page Issues ⚠️ BLOCKING

**Problem:**
Dev homepage (localhost:8080/) shows:
- Missing story images
- Different number of stories than prod
- Different sort order than prod

**Investigation Required:**
The PostgresStory implementation already includes media JOIN (line 77: `LEFT JOIN media m ON p.image_id = m.id`), so the issue may be:

1. **Data Issue:** Story records in Postgres missing `image_id` values?
2. **Query Logic:** Different filtering/sorting causing different results
3. **Date Range:** start_date/end_date filtering differently than prod
4. **Priority Field:** Different priority values in Postgres vs MySQL

**Root Cause Analysis:**

```php
// PostgresStory.php (lines 78-81)
WHERE p._status = 'published'
    AND p.start_date <= CURRENT_DATE
    AND p.end_date >= CURRENT_DATE
ORDER BY p.priority ASC

// SqlStory.php (line 29)
WHERE deleted = 'n' 
    AND start_date <= now() 
    AND end_date >= now() 
ORDER BY priority
```

Queries look identical in logic, so likely causes:

**A. Missing image_id values in Postgres**
```sql
-- Check if stories have images linked:
SELECT id, headline, image_id FROM posts 
WHERE type='story' AND _status='published' 
AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE;
```

**B. Different data imported**
- Check if import included all active stories with correct dates
- Verify start_date/end_date were migrated correctly
- Check priority values match

**C. Timezone issues**
- PostgreSQL uses `CURRENT_DATE` (could be UTC)
- MySQL uses `now()` (could be server local time)
- May cause different results if server timezone differs

**Solution Steps:**

1. [ ] Query both databases and compare results:
   ```bash
   # MySQL (prod)
   SELECT id, headline, pic, start_date, end_date, priority 
   FROM stories 
   WHERE deleted='n' AND start_date <= now() AND end_date >= now()
   ORDER BY priority LIMIT 10;
   
   # Postgres (dev)
   SELECT p.id, p.headline, p.image_id, m.url, p.start_date, p.end_date, p.priority
   FROM posts p LEFT JOIN media m ON p.image_id = m.id
   WHERE p.type='story' AND p._status='published'
   AND p.start_date <= CURRENT_DATE AND p.end_date >= CURRENT_DATE
   ORDER BY p.priority LIMIT 10;
   ```

2. [ ] Compare counts:
   ```sql
   -- Should match!
   SELECT COUNT(*) FROM stories WHERE deleted='n' AND start_date <= now() AND end_date >= now();
   SELECT COUNT(*) FROM posts WHERE type='story' AND _status='published' 
       AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE;
   ```

3. [ ] Fix missing images:
   - If `image_id` is NULL → Re-run import with image migration
   - If images exist in media table → Update posts.image_id references
   - Check `IMPORT_STATUS.md` - story images may not have been imported

4. [ ] Fix timezone if needed:
   ```php
   // In PostgresStory.php, consider using timestamptz comparison:
   WHERE p.start_date::date <= CURRENT_DATE
   AND p.end_date::date >= CURRENT_DATE
   ```

5. [ ] Verify StoryFactory routing:
   ```php
   // Check if feature flag enabled:
   FeatureManager::isEnabled('use_postgres_story') // or 'use_postgres_posts'
   ```

**Files to Check:**
- `src/models/implementations/PostgresStory.php` (query already correct)
- `src/models/StoryFactory.php` (verify routing to Postgres)
- `bin/migrations/importPosts.ts` (check if images were migrated)
- Database data (check actual values)

**Testing:**
```bash
# After fix:
curl http://localhost:8080/ > dev_homepage.html
curl https://ynotradio.net/ > prod_homepage.html
diff <(grep -o '<img.*src="[^"]*"' dev_homepage.html | wc -l) \
     <(grep -o '<img.*src="[^"]*"' prod_homepage.html | wc -l)
# Counts should be close
```

---

### 1.2 Fix OnDemand Fatal Error ⚠️ BLOCKING

**Problem:**
```
PDOException: column "image" does not exist
Location: /app/models/implementations/PostgresOnDemand.php:89
```

**Root Cause:**
- Payload schema defines `image` as **relationship to media collection**
- PostgresOnDemand.php tries to SELECT it as a **simple text column**
- MySQL has `image` as varchar(255) storing direct URLs
- Postgres has `image_id` (integer FK) + join required

**Solution:**
```php
// In PostgresOnDemand.php getAll() method (lines 73-89):
// BEFORE:
SELECT 
    id, date, image, headline, note, songs, audio_url
FROM ondemand

// AFTER:
SELECT 
    od.id,
    od.date,
    od.headline,
    od.note,
    od.songs,
    od.audio_url,
    CASE 
        WHEN m.filename IS NOT NULL THEN m.filename
        ELSE m.url
    END as image
FROM ondemand od
LEFT JOIN media m ON od.image_id = m.id
```

**Files to Edit:**
- `src/models/implementations/PostgresOnDemand.php` (3 methods: `getById`, `getAll`, `getAllForAdmin`)
- Update all SELECTs to LEFT JOIN media table

**Testing:**
```bash
# After fix, verify:
curl http://localhost:8080/ondemand.php
# Should render page without fatal error
```

---

### 1.3 Fix CD of the Week Loading ⚠️ BLOCKING

**Status:** Already implemented correctly in PostgresCdOfTheWeek.php (lines 34-110)

**Action Required:** Debug why it's not being used
1. Check feature flag: `use_postgres_cdoftheweek` (FeatureManager)
2. Verify CdOfTheWeekFactory routing
3. Check if data exists in Postgres:
   ```bash
   # Via Payload admin:
   http://localhost:3001/admin/collections/cdoftheweek
   
   # Verify 9 records imported (per IMPORT_TODO.md)
   ```

**Most Likely Issue:** Feature flag not enabled or factory not created yet

**Files to Check/Create:**
- `src/models/CdOfTheWeekFactory.php` - May not exist yet
- Add Postgres routing like OnDemandFactory.php pattern

---

### 1.4 Fix Schedule Rich Text Rendering ⚠️ BLOCKING

**Problem:**
Dev shows raw Lexical JSON artifacts:
```
{"root":{"children":[{"type":"paragraph","children":[{"type":"text","text":"The Cure reissue..."}]}]}}
```

Prod shows: "The Cure reissue..."

**Root Cause:**
PostgresSchedule.php reads `note` field as-is (line 135: `COALESCE(s.note::text, '') as note`), but doesn't convert Lexical JSON → HTML like PostgresCdOfTheWeek does.

**Solution:**
1. Copy `convertLexicalToHtml()` method from PostgresCdOfTheWeek.php (lines 242-385)
2. Add to PostgresSchedule.php
3. In `formatResult()` method, convert `note` field:
```php
// In formatResult() around line 333:
if (isset($row['note']) && !empty($row['note'])) {
    $row['note'] = $this->convertLexicalToHtml($row['note']);
}
```

**Files to Edit:**
- `src/models/implementations/PostgresSchedule.php`

---

### 1.5 Fix Top 11 Session Warnings ⚠️ BLOCKING

**Problem:**
```
PHP Warning: session_start(): Cannot start session when headers already sent
Warning: session_start() [function.session-start]: Cannot send session cookie
```

**Impact:** Breaks page layout, prevents login/voting

**Root Cause:**
- Output sent before `session_start()` called
- Auth0 session store initialization order issue

**Solution:**
1. Find where session_start() is called in top11.php
2. Move it to **very beginning** before any output
3. Check for Auth0 configuration differences between dev/prod
4. Ensure `ob_start()` at top of file if needed

**Files to Check:**
- `public/top11.php` or similar entry point
- Auth0 initialization code
- Any included headers that might output

---

### 1.6 Implement Postgres Custom Texts Reader ⚠️ BLOCKING

**Problem:**
CustomTextFactory ONLY returns SqlCustomText - no Postgres implementation exists.

**Status:**
- **Data:** 35/35 custom texts imported to Postgres (per IMPORT_STATUS.md)
- **Code:** Missing PostgresCustomText.php entirely

**Solution:**
1. Create `src/models/implementations/PostgresCustomText.php`
2. Model it after PostgresCdOfTheWeek.php (both use Lexical rich text)
3. Custom texts are stored in **`posts` collection** with type='custom_text'
4. Query structure:
```php
SELECT 
    p.id,
    p.slug,
    p.title,
    p.content, -- Lexical JSON
    p.legacy_id
FROM posts p
WHERE p.type = 'custom_text'
    AND p._status = 'published'
```
5. Update CustomTextFactory.php to route to Postgres when feature flag set

**Files to Create:**
- `src/models/implementations/PostgresCustomText.php`

**Files to Edit:**
- `src/models/CustomTextFactory.php` - Add Postgres routing

**Reference:**
- See IMPORT_STATUS.md - custom_texts have legacyId 10001-10073 range

---

### 1.7 Fix DeeJays Incomplete Data ⚠️ IMPORTANT

**Problem:**
Dev shows sparse DJ roster, prod shows full list

**Status:**
- **Data:** 82/83 DJs imported with photos (per IMPORT_TODO.md)
- **Code:** PostgresDeejay.php exists

**Action Required:**
1. Verify feature flag: `use_postgres_deejays`
2. Check if DeejayFactory routes to Postgres
3. Debug PostgresDeejay.php query - may be filtering incorrectly
4. Compare SQL query to prod working query

**Files to Check:**
- `src/models/implementations/PostgresDeejay.php`
- `src/models/DeejayFactory.php`

---

## Priority 2: Data Sync & Content Issues

### 2.1 New Music Staleness (Non-blocking)

**Problem:** Dev ends at 2026-01-05, prod shows 2026-01-12

**Root Cause:** Import ran with 3-month window filter

**Solution:**
```bash
# Re-run music import to get latest week:
cd /app
node --loader ts-node/esm bin/migrations/importMusic.ts
```

**Note:** This is **operational**, not a code bug. Plan for weekly/daily imports.

---

### 2.2 Concert Ordering Differences (Non-blocking)

**Problem:** Minor event ordering/formatting differences

**Action:** Compare sort logic in PostgresConcert vs SqlConcert

---

## Priority 3: Asset & Infrastructure Issues

### 3.1 Mixed Content Warnings (Prod only)

**Problem:** Prod requests HTTP resources over HTTPS page (cdoftheweek.php)

**Solution:**
- Upgrade hardcoded HTTP URLs to HTTPS in database content
- Use protocol-relative URLs: `//domain.com/image.jpg`
- Serve all assets via HTTPS

**Not a blocker for dev cutover** - This is prod config issue

---

### 3.2 Missing 404 Assets

**Problem:** Dev logs 404s for images/CSS/JS

**Action Required:**
1. Capture full network HAR from Playwright
2. List exact missing URLs
3. Fix path mappings or deploy missing assets

**Command to capture:**
```bash
# Use playwright-browser_network_requests with includeStatic:true
# Filter for 404 responses
```

---

## Implementation Sequence (Recommended)

### Day 1: Morning (2-3 hours)
1. ✅ Debug Home Page images/sorting (1.1) - **60 mins**
2. ✅ Fix OnDemand media JOIN (1.2) - **30 mins**
3. ✅ Fix Schedule Lexical rendering (1.4) - **30 mins**
4. ✅ Test all three fixes - **30 mins**

### Day 1: Afternoon (2-3 hours)
5. ✅ Create PostgresCustomText implementation (1.6) - **60 mins**
6. ✅ Debug CD of the Week factory/flag (1.3) - **45 mins**
7. ✅ Fix Top 11 session warnings (1.5) - **45 mins**
8. ✅ Debug DeeJays incomplete data (1.7) - **45 mins**

### Day 2: Morning (2 hours)
9. ✅ Re-run New Music import (2.1) - **15 mins**
10. ✅ Capture 404 HAR and fix assets (3.2) - **60 mins**
11. ✅ Final Playwright crawl verification - **30 mins**

### Day 2: Afternoon (Go/No-Go)
12. ✅ Review Playwright report - All green?
13. ✅ Manual smoke test critical paths
14. 🚀 **CUTOVER DECISION**

---

## Testing Checklist (Before Cutover)

Run Playwright crawl and verify:

- [ ] **Home** - No errors, content renders
- [ ] **Concerts** - Events display correctly
- [ ] **Top 11** - No PHP warnings, login works
- [ ] **New Music** - Current week shows
- [ ] **Schedule** - Rich text renders (no JSON artifacts)
- [ ] **DeeJays** - Full roster visible
- [ ] **On Demand** - No fatal errors, images load
- [ ] **CD of the Week** - Review content displays
- [ ] **Y-Mail** - Renders correctly
- [ ] **Donate** - Form displays
- [ ] **Console** - No fatal errors
- [ ] **Network** - No 4xx errors (except acceptable 404s)

---

## Rollback Plan

If cutover fails:

1. **Disable feature flags** in FeatureManager:
   ```php
   'use_postgres_ondemand' => false,
   'use_postgres_cdoftheweek' => false,
   'use_postgres_schedule' => false,
   'use_postgres_deejays' => false,
   'use_postgres_customtext' => false,
   ```

2. **Restart PHP-FPM** to clear any caches

3. **Verify MySQL fallback** works

4. **Document failure reasons** for next attempt

---

## Post-Cutover Tasks (Future)

These can be deferred until after successful cutover:

1. Import historical data (currently 3-month window)
2. Migrate all legacy images to Cloudinary
3. Set up automated daily imports (Music, Concerts)
4. Custom text images - Link media IDs to post content
5. Performance optimization
6. Full image migration to Media collection

---

## Files Reference

### Must Edit (Priority 1)
```
src/models/implementations/PostgresOnDemand.php      - Add media JOIN
src/models/implementations/PostgresSchedule.php      - Add Lexical converter
src/models/implementations/PostgresCustomText.php    - CREATE NEW
src/models/CustomTextFactory.php                     - Add Postgres routing
src/models/CdOfTheWeekFactory.php                    - May need creation
public/top11.php (or similar)                        - Fix session_start
```

### Check/Debug (Priority 1)
```
src/models/implementations/PostgresDeejay.php        - Check query logic
src/models/implementations/PostgresCdOfTheWeek.php   - Already correct
src/models/DeejayFactory.php                         - Check routing
src/models/FeatureManager.php                        - Verify flags
```

### Data Verification
```bash
# Check Postgres data exists:
http://localhost:3001/admin/collections/ondemand       # Should show 3+ records
http://localhost:3001/admin/collections/cdoftheweek    # Should show 9 records
http://localhost:3001/admin/collections/shows          # Should show 291 records
http://localhost:3001/admin/collections/djs            # Should show 82-83 records
http://localhost:3001/admin/collections/posts          # Should show 797 records
```

---

## Success Criteria

### Minimum Viable Cutover
- ✅ All 10 navigation pages render without fatal errors
- ✅ No PHP warnings/errors in console
- ✅ MySQL-backed content displays correctly from Postgres
- ✅ Rich text renders as HTML (no raw JSON)
- ✅ Images load (or graceful fallback)

### Nice to Have
- ✅ No 404 asset errors
- ✅ All images serve via HTTPS
- ✅ Content is current (latest week)
- ✅ Performance matches or exceeds prod

---

**Timeline Estimate

**Conservative:** 2 full working days (18 hours)  
**Optimistic:** 1.5 days (14 hours)  
**Aggressive:** 1 day (9 hours) - if no surprises

**Recommended:** Plan for **2 days**, cutover on Day 3 morning.

---

## Questions for Stakeholders

1. **Cutover window:** What time/day is safest? (Suggest: Weekday morning, avoid peak traffic)
2. **Content freeze:** Can MySQL writes pause during verification? (1-2 hours)
3. **Rollback tolerance:** Max acceptable downtime if rollback needed? (Target: < 5 mins)
4. **Asset 404s:** Can we deploy with some missing images? (Non-critical assets OK to fix post-cutover)

---

## Next Steps

**Immediate actions:**
1. Review this plan with team
2. Assign developer(s) to Priority 1 fixes
3. Set cutover date/time
4. Create feature flags if they don't exist
5. Begin Day 1 implementation sequence

**Before starting:**
- Back up production MySQL database
- Verify Postgres backup/restore process
- Test rollback procedure in dev environment
- Prepare monitoring/alerting for cutover

---

*Generated from side-by-side Playwright comparison report*  
*See original report for detailed per-page findings*
