# Payload Cutover - Implementation Checklist

Quick reference for fixing the 7 blocking issues identified in the comparison report.

---

## 🔴 BLOCKER #1: Front Page Issues (Home)

**Files:** Need to investigate story display logic

**Problems:**
1. Missing images on front page stories
2. Wrong number of stories showing (dev vs prod mismatch)
3. Different sort order than production

**Investigation Steps:**

1. [ ] Find homepage story query implementation
   - Check `index.php` or `/` route handler
   - Look for StoryFactory usage
   
2. [ ] Check if using Postgres or MySQL for stories
   ```bash
   # Check feature flag
   grep -r "use_postgres.*story\|use_postgres.*post" src/models/FeatureManager.php
   ```

3. [ ] Compare queries:
   - [ ] Check LIMIT clause (how many stories fetched?)
   - [ ] Check ORDER BY (sort by date DESC, featured flag, etc.?)
   - [ ] Check WHERE conditions (status = published, featured = yes, etc.?)
   
4. [ ] Debug missing images:
   - [ ] Are images in `media` table?
   - [ ] Does query JOIN media table for story images?
   - [ ] Check for hero_image_id or featured_image_id field
   - [ ] Verify Cloudinary URLs are being constructed

5. [ ] Compare schema fields:
   ```sql
   -- MySQL (prod)
   SELECT * FROM stories WHERE featured='yes' ORDER BY date DESC LIMIT 10;
   
   -- Postgres (dev)
   SELECT * FROM posts WHERE type='story' AND _status='published' 
   ORDER BY published_at DESC LIMIT 10;
   ```

**Likely Issues:**
- PostgresStory implementation may not JOIN media table for images
- Sort order logic different (published_at vs date, featured flag handling)
- Different LIMIT or featured story logic

**Files to Check:**
- `src/models/implementations/PostgresStory.php`
- `src/models/StoryFactory.php`
- `public/index.php` or main homepage handler
- Homepage template that renders stories

**Test:** 
```bash
curl http://localhost:8080/ | grep -o '<img' | wc -l  # Count images
# Compare with prod image count
```

---

## 🔴 BLOCKER #2: OnDemand Fatal Error

**File:** `src/models/implementations/PostgresOnDemand.php`

**Problem:** Line 77 tries to SELECT non-existent `image` column

**Fix:** Replace all queries to JOIN media table

### Methods to Update:
- [ ] `getById()` (lines 26-52)
- [ ] `getAll()` (lines 62-92)
- [ ] `getAllForAdmin()` (lines 192-210)

### SQL Pattern:
```php
// OLD:
SELECT id, date, image, headline, note, songs, audio_url
FROM ondemand

// NEW:
SELECT 
    od.id,
    od.date,
    od.headline,
    od.note,
    od.songs,
    od.audio_url,
    COALESCE(m.url, m.filename, '') as image
FROM ondemand od
LEFT JOIN media m ON od.image_id = m.id
```

**Test:** `curl http://localhost:8080/ondemand.php` → Should load without PDOException

---

## 🔴 BLOCKER #3: CD of the Week Not Loading

**Files:** Check these in order

1. [ ] `src/models/CdOfTheWeekFactory.php` - Does it exist?
   - If NO → Create it (copy OnDemandFactory.php pattern)
   - If YES → Check feature flag routing

2. [ ] `src/models/FeatureManager.php` - Add flag if missing:
   ```php
   'use_postgres_cdoftheweek' => true,
   ```

3. [ ] Verify data exists:
   ```bash
   # Via Payload admin:
   http://localhost:3001/admin/collections/cdoftheweek
   # Should show 9 imported records
   ```

**Test:** `curl http://localhost:8080/cdoftheweek.php` → Should show review content

---

## 🔴 BLOCKER #4: Schedule Shows Raw JSON

**File:** `src/models/implementations/PostgresSchedule.php`

**Problem:** Line 135 reads `note` as text, doesn't convert Lexical → HTML

**Fix:**

1. [ ] Copy `convertLexicalToHtml()` from PostgresCdOfTheWeek.php (lines 242-385)
2. [ ] Copy `convertLexicalNodeToHtml()` (lines 278-330)
3. [ ] Copy `convertLexicalChildren()` (lines 338-349)
4. [ ] Copy `isValidUrl()` (lines 358-384)
5. [ ] Copy format constants (lines 17-19)
6. [ ] Add to `formatResult()` around line 333:
   ```php
   if (isset($row['note']) && !empty($row['note'])) {
       $row['note'] = $this->convertLexicalToHtml($row['note']);
   }
   ```

**Test:** `curl http://localhost:8080/schedule.php` → Should show readable text, not JSON

---

## 🔴 BLOCKER #5: Top 11 Session Warnings

**File:** Find top11.php entry point

**Problem:** `session_start()` called after output sent

**Fix:**

1. [ ] Find where `session_start()` is called
2. [ ] Move to **very top** of file (before any echo/HTML)
3. [ ] Add `ob_start()` at top if needed:
   ```php
   <?php
   ob_start();
   session_start();
   // ... rest of code
   ```

4. [ ] Check Auth0 initialization order

**Test:** `curl http://localhost:8080/top11.php` → Should have no warnings in output

---

## 🔴 BLOCKER #6: Custom Texts Missing

**Files:** Need to create + update

### Step 1: Create PostgresCustomText Implementation

Create `src/models/implementations/PostgresCustomText.php`:

```php
<?php
namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\CustomText;
use PDO;

class PostgresCustomText implements CustomText {
    private PDO $db;
    
    public function __construct(PDO $db) {
        $this->db = $db;
    }
    
    public function getById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT 
                id,
                slug,
                title,
                content,
                legacy_id as legacyId
            FROM posts
            WHERE id = :id 
                AND type = 'custom_text'
                AND _status = 'published'
        ");
        
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();
        
        if (!$result) return null;
        
        // Convert Lexical JSON to HTML
        if (isset($result['content'])) {
            $result['content'] = $this->convertLexicalToHtml($result['content']);
        }
        
        return $result;
    }
    
    public function getAll(): array {
        $stmt = $this->db->prepare("
            SELECT 
                id,
                slug,
                title,
                content,
                legacy_id as legacyId
            FROM posts
            WHERE type = 'custom_text'
                AND _status = 'published'
            ORDER BY title ASC
        ");
        
        $stmt->execute();
        $results = $stmt->fetchAll();
        
        // Convert Lexical to HTML for each
        return array_map(function($row) {
            if (isset($row['content'])) {
                $row['content'] = $this->convertLexicalToHtml($row['content']);
            }
            return $row;
        }, $results);
    }
    
    // TODO: Copy convertLexicalToHtml() from PostgresCdOfTheWeek.php
    // (same as Schedule fix above)
}
```

### Step 2: Update CustomTextFactory

Edit `src/models/CustomTextFactory.php`:

```php
<?php
namespace YNotRadio\Models;

require_once(__DIR__ . "/CustomText.php");
require_once(__DIR__ . "/implementations/SqlCustomText.php");
require_once(__DIR__ . "/implementations/PostgresCustomText.php"); // ADD
require_once(__DIR__ . "/FeatureManager.php"); // ADD
require_once(__DIR__ . "/../lib/Database.php"); // ADD

use YNotRadio\Models\FeatureManager; // ADD
use YNotRadio\Lib\Database; // ADD

class CustomTextFactory
{
    public static function create($db): CustomText
    {
        // ADD THIS BLOCK:
        if (FeatureManager::isEnabled('use_postgres_customtext')) {
            try {
                $pgDb = Database::getPostgres();
                return new \YNotRadio\Models\Implementations\PostgresCustomText($pgDb);
            } catch (\PDOException $e) {
                error_log("PostgreSQL connection failed, falling back to MySQL: " . $e->getMessage());
                return new \YNotRadio\Models\Implementations\SqlCustomText($db);
            }
        }
        
        return new \YNotRadio\Models\Implementations\SqlCustomText($db);
    }
}
```

### Step 3: Enable Feature Flag

Add to `src/models/FeatureManager.php`:
```php
'use_postgres_customtext' => true,
```

**Test:** Find pages that use custom texts → Should display content from Postgres

---

## 🔴 BLOCKER #7: DeeJays Incomplete

**Files:** Check these in order

1. [ ] `src/models/FeatureManager.php` - Verify flag exists:
   ```php
   'use_postgres_deejays' => true,
   ```

2. [ ] `src/models/DeejayFactory.php` - Check if routes to Postgres

3. [ ] `src/models/implementations/PostgresDeejay.php` - Check query:
   - Does it filter by `_status = 'published'`?
   - Does it exclude any records incorrectly?
   - Compare to SqlDeejay.php query

4. [ ] Verify data: http://localhost:3001/admin/collections/djs
   - Should show 82-83 DJs

**Test:** `curl http://localhost:8080/deejays.php` → Should show full roster

---

## 🟡 NON-BLOCKER: New Music Stale

**Command:**
```bash
cd /app  # or wherever Node is
node --loader ts-node/esm bin/migrations/importMusic.ts
```

**Purpose:** Import latest week of music (currently ends at 2026-01-05)

---

## Final Verification (Before Cutover)

Run this command sequence:

```bash
# Test all critical pages:
curl -s http://localhost:8080/ | grep -i error
curl -s http://localhost:8080/concerts.php | grep -i error
curl -s http://localhost:8080/top11.php | grep -i error
curl -s http://localhost:8080/music.php | grep -i error
curl -s http://localhost:8080/schedule.php | grep -i error
curl -s http://localhost:8080/deejays.php | grep -i error
curl -s http://localhost:8080/ondemand.php | grep -i error
curl -s http://localhost:8080/cdoftheweek.php | grep -i error
curl -s http://localhost:8080/ymail.php | grep -i error
curl -s http://localhost:8080/donate.php | grep -i error

# All should return empty (no errors found)
```

### Manual Checks:

- [ ] Home renders with content
- [ ] Concerts show events
- [ ] Top 11 has no PHP warnings
- [ ] Music shows current week
- [ ] Schedule has readable notes (no JSON)
- [ ] DeeJays shows full list (82+ people)
- [ ] On Demand loads without crash
- [ ] CD of the Week shows review
- [ ] Y-Mail displays
- [ ] Donate form appears

### Browser Console:
- [ ] No fatal JavaScript errors
- [ ] No 500/504 server errors
- [ ] 404s are acceptable (missing images OK for v1)

---

## Emergency Rollback

If something breaks during cutover:

1. **Edit FeatureManager.php** - Set all `use_postgres_*` flags to `false`
2. **Restart PHP-FPM:** `systemctl restart php-fpm` (or equivalent)
3. **Clear caches** if applicable
4. **Test MySQL fallback** works

---

## Time Estimates

| Task | Estimated Time |
|------|----------------|
| OnDemand media JOIN | 30 mins |
| Schedule Lexical converter | 30 mins |
| CustomText implementation | 60 mins |
| CD of Week factory debug | 45 mins |
| Top 11 session fix | 45 mins |
| DeeJays debug | 45 mins |
| Testing/verification | 60 mins |
| **TOTAL** | **5.75 hours** |

Add buffer: **Plan for 8 hours (1 day)**

---

## Success Metrics

### Before Cutover:
- ❌ 6 pages broken on dev
- ❌ Fatal errors on On Demand
- ❌ Raw JSON on Schedule
- ❌ PHP warnings on Top 11

### After Cutover:
- ✅ 10/10 pages render successfully
- ✅ No fatal errors
- ✅ No PHP warnings
- ✅ Content displays from Postgres
- ✅ Rich text renders as HTML

---

*Reference: See PAYLOAD_CUTOVER_PLAN.md for detailed context*
