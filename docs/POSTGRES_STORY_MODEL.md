# PostgreSQL Story Model Implementation

## Overview

This implementation provides a PostgreSQL-backed read model for stories (front page posts) that queries the Neon PostgreSQL database created by Payload CMS. It maintains backward compatibility with the existing MySQL implementation while allowing a seamless transition to PostgreSQL.

## Architecture

### Components

1. **Database.php** (`src/lib/Database.php`)
   - Provides singleton PDO connection to PostgreSQL
   - Uses environment variables for configuration
   - Handles SSL/TLS connection setup

2. **PostgresStory.php** (`src/models/implementations/PostgresStory.php`)
   - Implements the `Story` interface
   - Reads from Payload CMS PostgreSQL schema
   - Maintains API compatibility with `SqlStory`
   - Read-only model (writes go through Payload CMS)
   - Converts Lexical JSON content to HTML for display

3. **StoryFactory.php** (`src/models/StoryFactory.php`)
   - Factory pattern for creating story model instances
   - Supports feature flag for toggling implementations
   - Falls back to MySQL if PostgreSQL connection fails

## Feature Flag

The implementation is controlled by the `use_postgres_stories` feature flag in `src/config/features.php`:

```php
return [
    // ... other flags
    'use_postgres_stories' => false  // Set to true to enable PostgreSQL
];
```

### Enabling the Feature

You can enable PostgreSQL stories in three ways:

1. **Config File** (Persistent):
   ```php
   // src/config/features.php
   'use_postgres_stories' => true
   ```

2. **Cookie** (Session-based):
   - Set a cookie named `FF` with value `use_postgres_stories`
   - Example: `FF=use_postgres_stories`

3. **URL Parameter** (One-time):
   - Add `?ff=use_postgres_stories` to the URL
   - Example: `http://example.com/index.php?ff=use_postgres_stories`

## Environment Variables

Add these to your `.env` or environment configuration:

```bash
# PostgreSQL Connection for PHP (Direct Access)
POSTGRES_HOST=ep-example-123456.us-east-2.aws.neon.tech
POSTGRES_PORT=5432
POSTGRES_DATABASE=ynot_payload_dev
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_SSL_MODE=require  # Use 'disable' for local development
```

## Database Schema

The PostgreSQL implementation reads from the Payload CMS schema:

### Tables Used

- `posts` - Main posts table (unified stories and custom_texts)
- `media` - Photos and images

### Key Differences from MySQL

| Aspect | MySQL | PostgreSQL |
|--------|-------|------------|
| Date fields | `start_date`, `end_date` (DATE) | `startDate`, `endDate` (TIMESTAMP) |
| Content field | `story` (TEXT) | `content` (JSONB - Lexical format) |
| Image field | `pic` (VARCHAR) | `image_id` (FK to media) |
| Image URL field | `pic_url` (VARCHAR) | `imageUrl` (VARCHAR - legacy) |
| Soft deletes | `deleted` (VARCHAR) 'y'/'n' | `_status` (draft/published) |

## Data Transformation

The `PostgresStory` implementation automatically transforms data to match the existing MySQL format:

- Timestamps converted to `YYYY-MM-DD` date strings
- Lexical JSON content converted to HTML for display
- Multiple field name mappings (startDate → start_date, etc.)
- Adds virtual `deleted` field as 'n' for compatibility
- Splits results into odd/even arrays for two-column layout

### Lexical to HTML Conversion

Payload CMS stores content in Lexical JSON format. The PostgresStory implementation includes a converter that handles:

- Paragraphs
- Headings (h1-h6)
- Lists (ordered and unordered)
- Links
- Text formatting (bold, italic, underline)

Example Lexical JSON:
```json
{
  "root": {
    "children": [
      {
        "type": "paragraph",
        "children": [
          {"type": "text", "text": "Hello ", "format": 0},
          {"type": "text", "text": "world", "format": 1}
        ]
      }
    ]
  }
}
```

Converts to: `<p>Hello <strong>world</strong></p>`

## Write Operations

⚠️ **Important**: This is a **read-only** model. Write operations (add, update, delete, updatePriorities) throw exceptions and should be performed through:

- Payload CMS Admin UI: `http://localhost:3000/admin/collections/posts`
- Payload REST API: `POST/PUT/DELETE /api/posts`
- Payload GraphQL API

This design ensures data integrity and leverages Payload's validation and hooks.

## Testing

### Manual Testing

1. **Test with MySQL** (default):
   ```bash
   # Visit front page
   curl http://localhost:8080/index.php
   ```

2. **Test with PostgreSQL** (feature flag):
   ```bash
   # Enable via URL parameter
   curl http://localhost:8080/index.php?ff=use_postgres_stories
   ```

3. **Verify same output**:
   - Both should display the same stories
   - Same date formatting
   - Same headline and content display
   - Same two-column layout

### Fallback Testing

The factory automatically falls back to MySQL if PostgreSQL fails:

```php
try {
    $pgDb = Database::getPostgres();
    return new PostgresStory($pgDb);
} catch (\PDOException $e) {
    error_log("PostgreSQL connection failed, falling back to MySQL");
    return new SqlStory($db);
}
```

## Migration Path

### Phase 1: Parallel Testing (Current)
- Feature flag disabled by default
- MySQL is primary data source
- Test PostgreSQL with feature flag in dev/staging

### Phase 2: Gradual Rollout
- Enable for subset of users via cookie/URL
- Monitor error logs for issues
- Compare query performance

### Phase 3: Full Migration
- Enable feature flag by default
- Keep MySQL as fallback
- Monitor for 30 days

### Phase 4: Complete Cutover
- Remove MySQL implementation (optional)
- Remove feature flag (optional)
- PostgreSQL becomes sole data source

## Performance Considerations

### Query Optimization

The PostgreSQL implementation uses:
- Direct joins to media table for images
- Filtered queries on `_status` and date ranges
- Priority-based sorting

### Caching Recommendations

Consider adding caching layer for production:

```php
// Example: Redis caching wrapper
$cacheKey = "stories:front_page";
$cached = $redis->get($cacheKey);

if ($cached) {
    return json_decode($cached, true);
}

$stories = $storyModel->getAll();
$redis->setex($cacheKey, 300, json_encode($stories)); // 5 min cache
return $stories;
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check environment variables are set
   - Verify network access to Neon database
   - Check SSL mode setting

2. **No Data Returned**
   - Verify Payload migrations have run
   - Check if posts exist in PostgreSQL
   - Review database permissions
   - Ensure posts are published (`_status = 'published'`)

3. **Content Display Issues**
   - Check Lexical to HTML conversion
   - Verify content field contains valid JSON
   - Confirm image URLs are accessible

4. **Layout Issues**
   - Verify odd/even split logic
   - Check array indices match expectations

### Debug Mode

Enable PostgreSQL debug logging:

```php
// Add to Database.php constructor
$this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_WARNING);
error_log("PostgreSQL connection established");
```

## Comparison with Concerts Implementation

This implementation follows the same pattern as `PostgresConcert`:

| Feature | Concerts | Stories |
|---------|----------|---------|
| Feature flag | `use_postgres_concerts` | `use_postgres_stories` |
| Interface | `Concert` | `Story` |
| PG Implementation | `PostgresConcert` | `PostgresStory` |
| Factory | `ConcertFactory` | `StoryFactory` |
| Payload Collection | `concerts` | `posts` |
| Complex conversion | Artist aggregation | Lexical → HTML |
| Read-only | ✓ | ✓ |
| Fallback to MySQL | ✓ | ✓ |

## Future Enhancements

- [ ] Add write operations through Payload REST API
- [ ] Implement connection pooling
- [ ] Add query result caching
- [ ] Optimize Lexical to HTML conversion
- [ ] Add performance monitoring and metrics
- [ ] Create Postgres-backed implementations for other models

## Related Documentation

- [Payload Migration Plan](./payload-migration/README.md)
- [PostgreSQL Concert Model](./POSTGRES_CONCERT_MODEL.md)
- [PHP PostgreSQL Querying](./payload-migration/03.5-php-postgresql-querying.md)
- [Frontend Cutover Strategy](./payload-migration/06-frontend-cutover.md)
- [Read-Only Collections](./READONLY_COLLECTIONS.md)
