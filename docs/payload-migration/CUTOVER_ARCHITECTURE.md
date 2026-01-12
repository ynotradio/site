# Payload CMS Cutover - Architecture Overview

Visual guide to understanding the migration architecture and what needs fixing.

---

## Current Architecture (Prod)

```
┌─────────────────┐
│  ynotradio.net  │
│  (PHP/Apache)   │
└────────┬────────┘
         │
         │ mysqli
         │
         ▼
┌─────────────────┐
│  MySQL 5.7      │
│  (Legacy DB)    │
└─────────────────┘

Data Flow:
1. User requests /ondemand.php
2. PHP calls OnDemandFactory::create($db)
3. Factory returns SqlOnDemand($mysqlDb)
4. SqlOnDemand queries MySQL
5. Response rendered
```

---

## Target Architecture (After Cutover)

```
┌─────────────────────────────────────┐
│         localhost:8080              │
│         (PHP/Apache)                │
└────────┬────────────────────────────┘
         │
         │ Feature Flags
         ├──────────┬──────────────┐
         │          │              │
    ENABLED?   DISABLED?        FALLBACK
         │          │              │
         ▼          ▼              ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐
   │ Postgres│  │ MySQL   │  │ MySQL   │
   │  (New)  │  │ (Legacy)│  │ (Error) │
   └─────────┘  └─────────┘  └─────────┘
        │
        │ PDO
        │
        ▼
┌──────────────────┐      ┌──────────────────┐
│  Neon Postgres   │◄────►│  Payload CMS     │
│  (Production DB) │      │  (localhost:3001)│
└──────────────────┘      └──────────────────┘

Data Flow (when feature flag enabled):
1. User requests /ondemand.php
2. PHP calls OnDemandFactory::create($db)
3. Factory checks: FeatureManager::isEnabled('use_postgres_ondemand')
4. If TRUE → PostgresOnDemand($postgresDb)
5. If FALSE → SqlOnDemand($mysqlDb)
6. PostgresOnDemand queries Postgres + JOINs media table
7. Response rendered
```

---

## Factory Pattern (How Routing Works)

### Example: OnDemand (WORKING)

```php
// File: src/models/OnDemandFactory.php

class OnDemandFactory {
    public static function create($db) {
        // 1. Check feature flag
        if (FeatureManager::isEnabled('use_postgres_ondemand')) {
            
            // 2. Try Postgres
            try {
                $pgDb = Database::getPostgres();
                return new PostgresOnDemand($pgDb);  // ← Use Postgres
                
            } catch (\PDOException $e) {
                // 3. Fallback to MySQL on error
                error_log("Postgres failed: " . $e->getMessage());
                return new SqlOnDemand($db);  // ← Fallback
            }
        }
        
        // 4. Default to MySQL
        return new SqlOnDemand($db);  // ← Default
    }
}
```

### Example: CustomText (MISSING - Need to Create)

```php
// File: src/models/CustomTextFactory.php

class CustomTextFactory {
    public static function create($db): CustomText {
        // ❌ NO POSTGRES ROUTING - Always returns MySQL
        return new SqlCustomText($db);
    }
}
```

**Fix:** Add same pattern as OnDemandFactory

---

## Database Schema Differences

### MySQL Schema (Legacy)

```sql
-- ondemand table
CREATE TABLE ondemand (
    id INT AUTO_INCREMENT,
    date DATE,
    image VARCHAR(255),           -- ← Direct URL string
    headline VARCHAR(255),
    note TEXT,
    songs TEXT,
    audio_url VARCHAR(255),
    deleted ENUM('yes', 'no'),
    PRIMARY KEY (id)
);
```

### Postgres Schema (Payload)

```sql
-- ondemand table
CREATE TABLE ondemand (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE,
    image_id INTEGER,                    -- ← Foreign key!
    headline VARCHAR(255),
    description JSONB,                   -- ← Lexical JSON (was 'note')
    songs INTEGER[],                     -- ← Array of IDs (was text)
    audio_url VARCHAR(255),
    _status VARCHAR(50),                 -- ← 'published' / 'draft'
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (image_id) REFERENCES media(id)
);

-- media table (NEW)
CREATE TABLE media (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255),      -- Cloudinary filename
    url TEXT,                   -- Full URL
    alt TEXT,
    mime_type VARCHAR(100),
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Key Difference:** Postgres normalizes images into separate `media` table

---

## The 6 Blocking Issues - Architectural View

### Issue #1: OnDemand Missing JOIN

```
❌ Current (BROKEN):
PostgresOnDemand.php
    SELECT id, image, headline FROM ondemand
                 ↑
            ERROR: column "image" does not exist

✅ Fixed:
PostgresOnDemand.php
    SELECT od.id, m.url as image, od.headline 
    FROM ondemand od
    LEFT JOIN media m ON od.image_id = m.id
                          ↑
                    Use foreign key
```

### Issue #2: CD of the Week Missing Factory

```
❌ Current (BROKEN):
cdoftheweek.php
    ↓
CdOfTheWeekFactory::create()  ← MISSING FILE!
    ↓
ERROR: Class not found

✅ Fixed:
cdoftheweek.php
    ↓
CdOfTheWeekFactory::create()
    ↓ (checks feature flag)
    ├─ TRUE → PostgresCdOfTheWeek (already implemented!)
    └─ FALSE → SqlCdOfTheWeek
```

### Issue #3: Schedule Missing Lexical Converter

```
❌ Current (BROKEN):
PostgresSchedule.php
    SELECT note FROM shows
        ↓
    Returns: {"root":{"children":[{"type":"paragraph"...}]}}
        ↓
    Displays raw JSON on page

✅ Fixed:
PostgresSchedule.php
    SELECT note FROM shows
        ↓
    convertLexicalToHtml(note)
        ↓
    Returns: "<p>The Cure reissue special</p>"
        ↓
    Displays formatted HTML
```

### Issue #4: Top 11 Session Order

```
❌ Current (BROKEN):
top11.php
    echo "<!DOCTYPE html>";        ← Output starts
    ...
    session_start();               ← Too late! Error!

✅ Fixed:
top11.php
    session_start();               ← FIRST
    echo "<!DOCTYPE html>";        ← Then output
```

### Issue #5: CustomText Missing Implementation

```
❌ Current (BROKEN):
page.php needs custom text
    ↓
CustomTextFactory::create()
    ↓
SqlCustomText($mysqlDb)  ← Always MySQL
    ↓
SELECT * FROM custom_text WHERE slug = 'about'
    ↓
Returns MySQL data (OLD)

✅ Fixed:
page.php needs custom text
    ↓
CustomTextFactory::create()
    ↓ (checks feature flag)
PostgresCustomText($pgDb)  ← NEW
    ↓
SELECT * FROM posts WHERE type='custom_text' AND slug='about'
    ↓
Returns Postgres data (CURRENT)
```

### Issue #6: DeeJays Incomplete Query

```
❌ Current (BROKEN):
PostgresDeejay.php
    SELECT * FROM djs 
    WHERE _status = 'published'
    LIMIT 10  ← Wrong limit? Wrong filter?
        ↓
    Returns 12 DJs (should be 82)

✅ Fixed:
PostgresDeejay.php
    SELECT * FROM djs 
    WHERE _status = 'published'
    ORDER BY display_name
        ↓
    Returns all 82 DJs
```

---

## Feature Flags (Control Panel)

```php
// File: src/models/FeatureManager.php

class FeatureManager {
    private static $features = [
        // ✅ Working
        'use_postgres_ondemand'    => true,   // After fix #1
        'use_postgres_schedule'    => true,   // After fix #3
        'use_postgres_deejays'     => true,   // After fix #6
        
        // ⚠️ Need to add/verify
        'use_postgres_cdoftheweek' => true,   // Fix #2
        'use_postgres_customtext'  => true,   // Fix #5
        
        // 🔄 May already exist
        'use_postgres_music'       => true,
        'use_postgres_concerts'    => true,
        'use_postgres_posts'       => true,
    ];
    
    public static function isEnabled(string $feature): bool {
        return self::$features[$feature] ?? false;
    }
}
```

**Emergency Rollback:** Set all flags to `false` → instant MySQL fallback

---

## Data Flow - Before vs After

### Before (MySQL)

```
Page Request → Factory → MySQL Implementation → MySQL DB → Response
                ↓
         SqlOnDemand.php
```

### After (Postgres with Lexical)

```
Page Request → Factory → Feature Flag Check
                             ↓
                    (if enabled)
                             ↓
                  Postgres Implementation → Query Postgres
                             ↓                      ↓
                  PostgresOnDemand.php    JOIN media table
                             ↓                      ↓
                  Format Results          Get image URL
                             ↓                      ↓
                  Convert Lexical → HTML ← Parse JSON
                             ↓
                          Response
```

---

## Collections in Payload (Data Model)

```
┌─────────────────────────────────────────────────┐
│              Payload Collections                │
├─────────────────────────────────────────────────┤
│                                                 │
│  posts (797)                                    │
│  ├─ type='story' (761)                          │
│  └─ type='custom_text' (35)   ← Fix #5         │
│                                                 │
│  ondemand (3+)                 ← Fix #1         │
│  cdoftheweek (9)               ← Fix #2         │
│  shows (291)                   ← Fix #3         │
│  djs (82)                      ← Fix #6         │
│  music (67)                                     │
│  concerts (308)                                 │
│  ads (2)                                        │
│                                                 │
│  media (images)                ← Used by Fix #1 │
│  artists (created during import)                │
│  venues (created during import)                 │
│  records (for CD reviews)                       │
│  people (for authors/reviewers)                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Testing Strategy

### Unit Test (Query Level)

```php
// Test PostgresOnDemand query
$ondemand = new PostgresOnDemand($pgDb);
$result = $ondemand->getById(522);

assert($result['image'] !== null);      // Has image
assert(!str_contains($result['image'], '{"root"')); // Not JSON
```

### Integration Test (Page Level)

```bash
curl http://localhost:8080/ondemand.php
# Should return 200 OK
# Should contain <img> tags
# Should NOT contain "PDOException"
```

### End-to-End Test (Browser)

```javascript
// Playwright test
await page.goto('http://localhost:8080/ondemand.php');
await expect(page.locator('.ondemand-entry')).toBeVisible();
const errors = await page.locator('.error').count();
expect(errors).toBe(0);
```

---

## Rollback Architecture

### If Issue Detected After Cutover

```
1. Edit FeatureManager.php
   Set flag to false: 'use_postgres_ondemand' => false

2. System automatically routes to MySQL
   ┌─────────────┐
   │ Page Request│
   └──────┬──────┘
          │
          ▼
   ┌─────────────────┐
   │ OnDemandFactory │
   └──────┬──────────┘
          │
    Flag = FALSE ────────────┐
          │                  │
          ▼                  ▼
   ┌──────────────┐   ┌──────────────┐
   │ SKIP Postgres│   │ USE MySQL    │
   └──────────────┘   └──────┬───────┘
                              │
                              ▼
                       ┌─────────────┐
                       │ SqlOnDemand │
                       └──────┬──────┘
                              │
                              ▼
                       ┌─────────────┐
                       │  MySQL DB   │
                       └─────────────┘

3. No code deployment needed - just config change
4. No data loss - MySQL data still intact
5. Recovery time < 5 minutes
```

---

## Success Metrics Visualization

### Before Cutover
```
Page Status:
├─ Home              ✅ Working
├─ Concerts          ⚠️  Minor issues
├─ Top 11            ❌ PHP warnings
├─ Music             ⚠️  Stale data
├─ Schedule          ❌ Raw JSON
├─ DeeJays           ❌ Incomplete
├─ On Demand         ❌ Fatal error
├─ CD of the Week    ❌ Not loading
├─ Y-Mail            ✅ Working
└─ Donate            ✅ Working

Score: 3/10 pages fully working
```

### After Cutover
```
Page Status:
├─ Home              ✅ Working
├─ Concerts          ✅ Working
├─ Top 11            ✅ Working
├─ Music             ✅ Working
├─ Schedule          ✅ Working
├─ DeeJays           ✅ Working
├─ On Demand         ✅ Working
├─ CD of the Week    ✅ Working
├─ Y-Mail            ✅ Working
└─ Donate            ✅ Working

Score: 10/10 pages fully working ✨
```

---

*See PAYLOAD_CUTOVER_PLAN.md for implementation details*
