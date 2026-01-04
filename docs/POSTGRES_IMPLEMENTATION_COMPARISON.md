# Implementation Comparison: Concerts vs Stories

This document compares the PostgreSQL implementations for Concerts (PR #135) and Stories (this PR) to show consistency in approach.

## Architecture Pattern

Both implementations follow the identical pattern:

```
PHP Page → Factory (with feature flag) → Implementation (SQL or Postgres)
                                              ↓
                                    Payload CMS PostgreSQL
```

## Side-by-Side Comparison

| Aspect | Concerts | Stories |
|--------|----------|---------|
| **Feature Flag** | `use_postgres_concerts` | `use_postgres_stories` |
| **Interface** | `Concert` | `Story` |
| **MySQL Implementation** | `SqlConcert` | `SqlStory` |
| **PostgreSQL Implementation** | `PostgresConcert` | `PostgresStory` |
| **Factory** | `ConcertFactory` | `StoryFactory` |
| **Payload Collection** | `concerts` | `posts` |
| **Primary Page** | concerts.php | index.php |

## Key Similarities

### 1. Factory Pattern
Both use the same factory logic:

**ConcertFactory.php**:
```php
if (FeatureManager::isEnabled('use_postgres_concerts')) {
    try {
        $pgDb = Database::getPostgres();
        return new PostgresConcert($pgDb);
    } catch (\PDOException $e) {
        error_log("PostgreSQL connection failed, falling back to MySQL");
        return new SqlConcert($db);
    }
}
return new SqlConcert($db);
```

**StoryFactory.php**:
```php
if (FeatureManager::isEnabled('use_postgres_stories')) {
    try {
        $pgDb = Database::getPostgres();
        return new PostgresStory($pgDb);
    } catch (\PDOException $e) {
        error_log("PostgreSQL connection failed, falling back to MySQL");
        return new SqlStory($db);
    }
}
return new SqlStory($db);
```

### 2. Read-Only Model
Both implementations throw exceptions for write operations:

```php
public function add(array $data): int {
    throw new \RuntimeException(
        'Write operations are not supported in the PostgreSQL read model. ' .
        'Please use Payload CMS admin interface or API.'
    );
}
```

### 3. Date Formatting
Both convert PostgreSQL timestamps to MySQL date format:

```php
private function formatDate(string $timestamp): string {
    $date = new \DateTime($timestamp);
    return $date->format('Y-m-d');
}
```

### 4. Field Mapping
Both handle differences between MySQL and PostgreSQL schemas:

**Concerts**:
- `ticketinfo` ← `ticket_info`
- `ticketurl` ← `ticket_url`
- Aggregates multiple artists into comma-separated string

**Stories**:
- `start_date` ← `startDate`
- `end_date` ← `endDate`
- `story` ← `content` (with Lexical→HTML conversion)
- `pic` ← `url` (from media table)

## Key Differences

### Complex Data Transformation

**Concerts**: Artist aggregation via joins
```sql
string_agg(a.name, ', ' ORDER BY cr.order) as artist
```

**Stories**: Lexical JSON to HTML conversion
```php
private function convertLexicalToHtml(string $lexicalJson): string {
    // Parse JSON and convert to HTML
}
```

### Security Considerations

**Concerts**: Minimal - data is pre-validated in Payload
- Basic HTML escaping in display

**Stories**: Enhanced - user content needs protection
- htmlspecialchars() on all text
- URL validation for links
- XSS prevention unit tested

### Query Complexity

**Concerts**: Complex joins across 4 tables
```sql
FROM concerts c
LEFT JOIN venues v ON c.venue_id = v.id
LEFT JOIN concerts_rels cr ON c.id = cr.parent_id
LEFT JOIN artists a ON cr.artists_id = a.id
LEFT JOIN media a_first_photo ON a_first.photo_id = a_first_photo.id
```

**Stories**: Simple joins to 1 table
```sql
FROM posts p
LEFT JOIN media m ON p.image_id = m.id
```

### Data Splitting

**Concerts**: Returns flat array
```php
return $this->formatResults($stmt->fetchAll());
```

**Stories**: Returns odd/even arrays for two-column layout
```php
return array($odd_results, $even_results);
```

## Testing Approach

Both implementations use the same testing strategy:

1. **Feature Flag Testing**
   - URL parameter: `?ff=use_postgres_[feature]`
   - Cookie: `FF=use_postgres_[feature]`
   - Config: Enable in features.php

2. **Fallback Testing**
   - Verify graceful degradation to MySQL
   - Check error logging

3. **Visual Verification**
   - Compare output with MySQL version
   - Verify same data displays

**Stories Additional**: Unit tests for Lexical conversion (7 tests)

## Documentation

Both follow the same documentation structure:

1. **Technical Docs** (docs/*.md)
   - Overview & Architecture
   - Environment Variables
   - Database Schema
   - Migration Path
   - Troubleshooting

2. **Testing Guide**
   - How to enable
   - What to verify
   - Expected behavior
   - Troubleshooting

## Lessons Applied from Concerts

Based on PR #135, the Stories implementation incorporated:

1. ✅ Same factory pattern
2. ✅ Same feature flag system
3. ✅ Same fallback mechanism
4. ✅ Same documentation structure
5. ✅ Read-only model philosophy
6. ✅ Error logging approach

## Additional Improvements in Stories

Beyond the Concerts pattern:

1. **Security Enhancements**
   - XSS prevention unit tests
   - URL validation helper
   - Comprehensive escaping

2. **Code Quality**
   - Class constants for bit flags
   - Optimized array operations
   - Enhanced error logging

3. **Testing**
   - Unit tests for conversion logic
   - Security-focused test cases

## Reusability

This pattern is ready to be applied to other models:

- CustomText (if separate from Posts)
- Ads
- CdOfTheWeek
- OnDemand
- Schedule
- Deejays

Each would follow the same structure:
1. Create Postgres[Model].php
2. Update [Model]Factory.php
3. Add feature flag
4. Document in docs/POSTGRES_[MODEL]_MODEL.md
5. Create testing guide

## Conclusion

The Stories implementation successfully follows and extends the pattern established in PR #135 for Concerts, maintaining consistency while adding appropriate security measures for user-generated content.
