# Quick Fix Reference - Code Snippets

Ready-to-use code snippets for the 6 blocking issues.

---

## Fix #1: PostgresOnDemand - Media JOIN

### File: `src/models/implementations/PostgresOnDemand.php`

#### Update getById() method (lines 26-52)

Replace lines 27-39 with:
```php
$stmt = $this->db->prepare("
    SELECT 
        od.id,
        od.date,
        COALESCE(m.url, m.filename, '') as image,
        od.headline,
        od.note,
        od.songs,
        od.audio_url,
        COALESCE(od.source, 'opendrive') as source
    FROM ondemand od
    LEFT JOIN media m ON od.image_id = m.id
    WHERE od.id = :id
");
```

#### Update getAll() method (lines 62-92)

Replace lines 73-84 with:
```php
$stmt = $this->db->prepare("
    SELECT 
        od.id,
        od.date,
        COALESCE(m.url, m.filename, '') as image,
        od.headline,
        od.note,
        od.songs,
        od.audio_url
    FROM ondemand od
    LEFT JOIN media m ON od.image_id = m.id
    ORDER BY $orderBy
    LIMIT :limit OFFSET :offset
");
```

#### Update getAllForAdmin() method (lines 192-210)

Replace lines 193-204 with:
```php
$stmt = $this->db->prepare("
    SELECT 
        od.id,
        od.date,
        COALESCE(m.url, m.filename, '') as image,
        od.headline,
        od.note,
        od.songs,
        od.audio_url,
        COALESCE(od.source, 'opendrive') as source
    FROM ondemand od
    LEFT JOIN media m ON od.image_id = m.id
    ORDER BY od.date DESC
");
```

---

## Fix #2: CD of the Week - Factory Setup

### Option A: Create CdOfTheWeekFactory.php (if doesn't exist)

Create `src/models/CdOfTheWeekFactory.php`:

```php
<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/FeatureManager.php';
require_once __DIR__ . '/CdOfTheWeek.php';
require_once __DIR__ . '/implementations/SqlCdOfTheWeek.php';
require_once __DIR__ . '/implementations/PostgresCdOfTheWeek.php';
require_once __DIR__ . '/../lib/Database.php';

use YNotRadio\Models\FeatureManager;
use YNotRadio\Models\Implementations\SqlCdOfTheWeek;
use YNotRadio\Models\Implementations\PostgresCdOfTheWeek;
use YNotRadio\Lib\Database;

class CdOfTheWeekFactory {
    public static function create($db) {
        if (FeatureManager::isEnabled('use_postgres_cdoftheweek')) {
            try {
                $pgDb = Database::getPostgres();
                return new PostgresCdOfTheWeek($pgDb);
            } catch (\PDOException $e) {
                error_log("PostgreSQL connection failed, falling back to MySQL: " . $e->getMessage());
                return new SqlCdOfTheWeek($db);
            }
        }
        
        return new SqlCdOfTheWeek($db);
    }
}
```

### Option B: Update FeatureManager (if flag missing)

Add to `src/models/FeatureManager.php` features array:
```php
'use_postgres_cdoftheweek' => true,
```

---

## Fix #3: PostgresSchedule - Lexical Converter

### File: `src/models/implementations/PostgresSchedule.php`

#### Step 1: Add constants after line 14

```php
// Lexical text format bit flags
private const FORMAT_BOLD = 1;
private const FORMAT_ITALIC = 2;
private const FORMAT_UNDERLINE = 8;
```

#### Step 2: Update formatResult() - Add after line 332

```php
// Convert Lexical JSON note to HTML for display
if (isset($row['note']) && !empty($row['note'])) {
    $row['note'] = $this->convertLexicalToHtml($row['note']);
}
```

#### Step 3: Add these methods at end of class (before final })

```php
/**
 * Convert Lexical JSON format to HTML
 * Payload CMS stores content in Lexical JSON format, but the frontend expects HTML
 * 
 * @param string $lexicalJson Lexical JSON string
 * @return string HTML content
 */
private function convertLexicalToHtml(string $lexicalJson): string {
    // Try to decode as JSON first
    $lexical = json_decode($lexicalJson, true);
    
    // If it's not valid JSON, assume it's already HTML
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("PostgresSchedule: Content is not valid JSON, treating as HTML: " . 
            substr($lexicalJson, 0, 100));
        return $lexicalJson;
    }
    
    try {
        if (!isset($lexical['root']['children'])) {
            error_log("PostgresSchedule: Invalid Lexical structure, missing root.children");
            return $lexicalJson;
        }
        
        $html = '';
        foreach ($lexical['root']['children'] as $node) {
            $html .= $this->convertLexicalNodeToHtml($node);
        }
        
        return $html;
    } catch (\Exception $e) {
        error_log("PostgresSchedule: Failed to convert Lexical to HTML: " . $e->getMessage());
        return $lexicalJson;
    }
}

/**
 * Convert a single Lexical node to HTML
 * 
 * @param array $node Lexical node
 * @return string HTML representation
 */
private function convertLexicalNodeToHtml(array $node): string {
    $type = $node['type'] ?? '';
    
    switch ($type) {
        case 'paragraph':
            $content = $this->convertLexicalChildren($node);
            return "<p>$content</p>\n";
            
        case 'heading':
            $tag = $node['tag'] ?? 'h2';
            $content = $this->convertLexicalChildren($node);
            return "<$tag>$content</$tag>\n";
            
        case 'list':
            $listType = $node['listType'] ?? 'bullet';
            $tag = $listType === 'number' ? 'ol' : 'ul';
            $content = $this->convertLexicalChildren($node);
            return "<$tag>$content</$tag>\n";
            
        case 'listitem':
            $content = $this->convertLexicalChildren($node);
            return "<li>$content</li>\n";
            
        case 'link':
            $rawUrl = $node['url'] ?? '';
            $url = $this->isValidUrl($rawUrl) ? $rawUrl : '#';
            $url = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');
            $content = $this->convertLexicalChildren($node);
            return "<a href=\"$url\">$content</a>";
            
        case 'text':
            $text = htmlspecialchars($node['text'] ?? '', ENT_QUOTES, 'UTF-8');
            $format = $node['format'] ?? 0;
            
            if ($format & self::FORMAT_BOLD) {
                $text = "<strong>$text</strong>";
            }
            if ($format & self::FORMAT_ITALIC) {
                $text = "<em>$text</em>";
            }
            if ($format & self::FORMAT_UNDERLINE) {
                $text = "<u>$text</u>";
            }
            
            return $text;
            
        default:
            return $this->convertLexicalChildren($node);
    }
}

/**
 * Convert children of a Lexical node to HTML
 * 
 * @param array $node Lexical node with children
 * @return string HTML representation of children
 */
private function convertLexicalChildren(array $node): string {
    if (!isset($node['children']) || !is_array($node['children'])) {
        return '';
    }
    
    $html = '';
    foreach ($node['children'] as $child) {
        $html .= $this->convertLexicalNodeToHtml($child);
    }
    
    return $html;
}

/**
 * Validate URL to prevent XSS attacks
 * Only allows http, https, and relative URLs
 * 
 * @param string $url URL to validate
 * @return bool True if URL is valid and safe
 */
private function isValidUrl(string $url): bool {
    if (substr($url, 0, 1) === '/') {
        return true;
    }
    
    if (substr($url, 0, 1) === '#') {
        return true;
    }
    
    $parsed = parse_url($url);
    
    if ($parsed === false) {
        return false;
    }
    
    if (isset($parsed['scheme'])) {
        $scheme = strtolower($parsed['scheme']);
        return $scheme === 'http' || $scheme === 'https';
    }
    
    return true;
}
```

---

## Fix #4: Top 11 - Session Start

### File: Find `public/top11.php` or similar

#### Add at very beginning of file:

```php
<?php
// Start output buffering and session FIRST - before any output
ob_start();
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// ... rest of existing code
```

---

## Fix #5: Custom Text - Full Implementation

### File: Create `src/models/implementations/PostgresCustomText.php`

```php
<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\CustomText;
use PDO;

/**
 * PostgreSQL implementation of the CustomText model
 * Reads from Neon PostgreSQL database (posts collection, type='custom_text')
 */
class PostgresCustomText implements CustomText {
    private PDO $db;

    // Lexical text format bit flags
    private const FORMAT_BOLD = 1;
    private const FORMAT_ITALIC = 2;
    private const FORMAT_UNDERLINE = 8;

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
                legacy_id
            FROM posts
            WHERE id = :id 
                AND type = 'custom_text'
                AND _status = 'published'
        ");
        
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();
        
        if (!$result) {
            return null;
        }
        
        return $this->formatResult($result);
    }
    
    public function getBySlug(string $slug): ?array {
        $stmt = $this->db->prepare("
            SELECT 
                id,
                slug,
                title,
                content,
                legacy_id
            FROM posts
            WHERE slug = :slug 
                AND type = 'custom_text'
                AND _status = 'published'
        ");
        
        $stmt->execute(['slug' => $slug]);
        $result = $stmt->fetch();
        
        if (!$result) {
            return null;
        }
        
        return $this->formatResult($result);
    }

    public function getAll(): array {
        $stmt = $this->db->prepare("
            SELECT 
                id,
                slug,
                title,
                content,
                legacy_id
            FROM posts
            WHERE type = 'custom_text'
                AND _status = 'published'
            ORDER BY title ASC
        ");
        
        $stmt->execute();
        $results = $stmt->fetchAll();
        
        return array_map([$this, 'formatResult'], $results);
    }
    
    // Write methods throw exceptions (read-only implementation)
    
    public function add(array $data): int {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API.'
        );
    }
    
    public function update(int $id, array $data): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API.'
        );
    }
    
    public function delete(int $id): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API.'
        );
    }

    /**
     * Format result to match MySQL output and convert Lexical to HTML
     */
    private function formatResult(array $row): array {
        // Convert Lexical JSON content to HTML
        if (isset($row['content'])) {
            $row['content'] = $this->convertLexicalToHtml($row['content']);
        }
        
        return $row;
    }

    // Copy the Lexical converter methods from PostgresSchedule fix above:
    // - convertLexicalToHtml()
    // - convertLexicalNodeToHtml()
    // - convertLexicalChildren()
    // - isValidUrl()
    
    // NOTE: Use the exact same code from Fix #3 above
}
```

### File: Update `src/models/CustomTextFactory.php`

```php
<?php

namespace YNotRadio\Models;

require_once(__DIR__ . "/CustomText.php");
require_once(__DIR__ . "/implementations/SqlCustomText.php");
require_once(__DIR__ . "/implementations/PostgresCustomText.php");
require_once(__DIR__ . "/FeatureManager.php");
require_once(__DIR__ . "/../lib/Database.php");

use YNotRadio\Models\FeatureManager;
use YNotRadio\Lib\Database;

class CustomTextFactory
{
    public static function create($db): CustomText
    {
        if (FeatureManager::isEnabled('use_postgres_customtext')) {
            try {
                $pgDb = Database::getPostgres();
                return new \YNotRadio\Models\Implementations\PostgresCustomText($pgDb);
            } catch (\PDOException $e) {
                error_log("PostgreSQL connection failed for CustomText, falling back to MySQL: " . $e->getMessage());
                return new \YNotRadio\Models\Implementations\SqlCustomText($db);
            }
        }
        
        return new \YNotRadio\Models\Implementations\SqlCustomText($db);
    }
}
```

### File: Update `src/models/FeatureManager.php`

Add to features array:
```php
'use_postgres_customtext' => true,
```

---

## Fix #6: DeeJays - Debug Steps

### Step 1: Check Feature Flag

In `src/models/FeatureManager.php`, verify:
```php
'use_postgres_deejays' => true,
```

### Step 2: Check Factory

In `src/models/DeejayFactory.php`, verify it routes to Postgres:
```php
if (FeatureManager::isEnabled('use_postgres_deejays')) {
    try {
        $pgDb = Database::getPostgres();
        return new PostgresDeejay($pgDb);
    } catch (\PDOException $e) {
        // fallback
    }
}
```

### Step 3: Check Query in PostgresDeejay.php

Look for these potential issues:
- Filter by `_status = 'published'`
- Filter by `deleted = 'no'` or similar
- LIMIT clause that's too restrictive
- Missing JOIN for photos/bio

Compare query to SqlDeejay.php to see differences.

### Step 4: Verify Data

Check Payload admin: http://localhost:3001/admin/collections/djs  
Should show 82-83 DJs

---

## Testing Commands

After each fix, test the page:

```bash
# OnDemand
curl -s http://localhost:8080/ondemand.php | grep -i "PDOException\|Fatal error"

# CD of the Week
curl -s http://localhost:8080/cdoftheweek.php | grep -i "error loading"

# Schedule
curl -s http://localhost:8080/schedule.php | grep -i '{"root"'

# Top 11
curl -s http://localhost:8080/top11.php | grep -i "Warning.*session"

# Custom Texts (find a page that uses them)
# Test after identifying which pages call CustomTextFactory

# DeeJays
curl -s http://localhost:8080/deejays.php | wc -l  # Should be substantial line count
```

---

## Final Test Script

Save as `test-cutover.sh`:

```bash
#!/bin/bash

echo "Testing all critical pages..."

ERRORS=0

echo -n "Home... "
curl -s http://localhost:8080/ | grep -qi "fatal\|exception" && { echo "FAIL"; ERRORS=$((ERRORS+1)); } || echo "OK"

echo -n "Concerts... "
curl -s http://localhost:8080/concerts.php | grep -qi "fatal\|exception" && { echo "FAIL"; ERRORS=$((ERRORS+1)); } || echo "OK"

echo -n "Top 11... "
curl -s http://localhost:8080/top11.php | grep -qi "warning.*session" && { echo "FAIL"; ERRORS=$((ERRORS+1)); } || echo "OK"

echo -n "Music... "
curl -s http://localhost:8080/music.php | grep -qi "fatal\|exception" && { echo "FAIL"; ERRORS=$((ERRORS+1)); } || echo "OK"

echo -n "Schedule... "
curl -s http://localhost:8080/schedule.php | grep -qi '{"root"' && { echo "FAIL (JSON visible)"; ERRORS=$((ERRORS+1)); } || echo "OK"

echo -n "DeeJays... "
curl -s http://localhost:8080/deejays.php | grep -qi "fatal\|exception" && { echo "FAIL"; ERRORS=$((ERRORS+1)); } || echo "OK"

echo -n "On Demand... "
curl -s http://localhost:8080/ondemand.php | grep -qi "pdoexception\|fatal" && { echo "FAIL"; ERRORS=$((ERRORS+1)); } || echo "OK"

echo -n "CD of the Week... "
curl -s http://localhost:8080/cdoftheweek.php | grep -qi "error loading" && { echo "FAIL"; ERRORS=$((ERRORS+1)); } || echo "OK"

echo -n "Y-Mail... "
curl -s http://localhost:8080/ymail.php | grep -qi "fatal\|exception" && { echo "FAIL"; ERRORS=$((ERRORS+1)); } || echo "OK"

echo -n "Donate... "
curl -s http://localhost:8080/donate.php | grep -qi "fatal\|exception" && { echo "FAIL"; ERRORS=$((ERRORS+1)); } || echo "OK"

echo ""
echo "========================================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ ALL TESTS PASSED - Ready for cutover!"
else
    echo "❌ $ERRORS TEST(S) FAILED - Fix before cutover"
fi
```

Run with: `bash test-cutover.sh`

---

*Reference: See PAYLOAD_CUTOVER_PLAN.md for strategy and CUTOVER_CHECKLIST.md for implementation order*
