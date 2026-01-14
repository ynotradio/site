# PostgreSQL Concert Model Implementation

## Overview

This implementation provides a PostgreSQL-backed read model for concerts that queries the Neon PostgreSQL database created by Payload CMS. It maintains backward compatibility with the existing MySQL implementation while allowing a seamless transition to PostgreSQL.

## Architecture

### Components

1. **Database.php** (`src/lib/Database.php`)
   - Provides singleton PDO connection to PostgreSQL
   - Uses environment variables for configuration
   - Handles SSL/TLS connection setup

2. **PostgresConcert.php** (`src/models/implementations/PostgresConcert.php`)
   - Implements the `Concert` interface
   - Reads from Payload CMS PostgreSQL schema
   - Maintains API compatibility with `SqlConcert`
   - Read-only model (writes go through Payload CMS)

3. **ConcertFactory.php** (`src/models/ConcertFactory.php`)
   - Factory pattern for creating concert model instances
   - Supports feature flag for toggling implementations
   - Falls back to MySQL if PostgreSQL connection fails

## Feature Flag

The implementation is controlled by the `use_postgres_concerts` feature flag in `src/config/features.php`:

```php
return [
    // ... other flags
    'use_postgres_concerts' => false  // Set to true to enable PostgreSQL
];
```

### Enabling the Feature

You can enable PostgreSQL concerts in four ways (in priority order):

1. **Cookie** (Session-based, highest priority):
   - Set a cookie named `FF` with value `use_postgres_concerts`
   - Example: `FF=use_postgres_concerts`

2. **URL Parameter** (One-time, high priority):
   - Add `?ff=use_postgres_concerts` to the URL
   - Example: `http://example.com/concerts.php?ff=use_postgres_concerts`

3. **Environment Variable** (Persistent, via .env file):
   ```bash
   # In src/partials/.env or .env.local
   USE_POSTGRES_CONCERTS=true
   ```
   - Accepts: `true`, `1`, `yes`, `on` (case-insensitive)
   - Overrides config file setting

4. **Config File** (Persistent, lowest priority):
   ```php
   // src/config/features.php
   'use_postgres_concerts' => true
   ```

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

- `concerts` - Main concert table
- `concerts_rels` - Relationships to artists (many-to-many)
- `artists` - Artist information
- `venues` - Venue information
- `media` - Photos and images

### Key Differences from MySQL

| Aspect | MySQL | PostgreSQL |
|--------|-------|------------|
| Date field | `date` (DATE) | `date` (TIMESTAMP) |
| Featured field | `featured` (VARCHAR) 'Yes'/'No' | `featured` (BOOLEAN) |
| Soft deletes | `deleted` (VARCHAR) 'y'/'n' | No soft deletes in Payload |
| Artists | Single `artist` field | Many-to-many via `concerts_rels` |

## Data Transformation

The `PostgresConcert` implementation automatically transforms data to match the existing MySQL format:

- Timestamps converted to `YYYY-MM-DD` date strings
- Boolean `featured` field converted to 'Yes'/'No' strings
- Multiple artists aggregated into comma-separated string
- Adds virtual `deleted` field as 'n' for compatibility

## Write Operations

⚠️ **Important**: This is a **read-only** model. Write operations (add, update, delete) throw exceptions and should be performed through:

- Payload CMS Admin UI: `http://localhost:3000/admin/collections/concerts`
- Payload REST API: `POST/PUT/DELETE /api/concerts`
- Payload GraphQL API

This design ensures data integrity and leverages Payload's validation and hooks.

## Testing

### Manual Testing

1. **Test with MySQL** (default):
   ```bash
   # Visit concerts page
   curl http://localhost:8080/concerts.php
   ```

2. **Test with PostgreSQL** (feature flag):
   ```bash
   # Enable via URL parameter
   curl http://localhost:8080/concerts.php?ff=use_postgres_concerts
   ```

3. **Verify same output**:
   - Both should display the same concerts
   - Same date formatting
   - Same artist and venue display

### Fallback Testing

The factory automatically falls back to MySQL if PostgreSQL fails:

```php
try {
    $pgDb = Database::getPostgres();
    return new PostgresConcert($pgDb);
} catch (\PDOException $e) {
    error_log("PostgreSQL connection failed, falling back to MySQL");
    return new SqlConcert($db);
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
- `LATERAL` joins for efficient first-artist selection
- `string_agg()` for artist name aggregation
- Indexes on `date`, `featured`, and foreign keys

### Caching Recommendations

Consider adding caching layer for production:

```php
// Example: Redis caching wrapper
$cacheKey = "concerts:upcoming:" . $limit;
$cached = $redis->get($cacheKey);

if ($cached) {
    return json_decode($cached, true);
}

$concerts = $concertModel->getUpcoming($limit);
$redis->setex($cacheKey, 300, json_encode($concerts)); // 5 min cache
return $concerts;
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check environment variables are set
   - Verify network access to Neon database
   - Check SSL mode setting

2. **No Data Returned**
   - Verify Payload migrations have run
   - Check if concerts exist in PostgreSQL
   - Review database permissions

3. **Data Format Issues**
   - Check date transformation logic
   - Verify artist aggregation works
   - Confirm featured flag conversion

### Debug Mode

Enable PostgreSQL debug logging:

```php
// Add to Database.php constructor
$this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_WARNING);
error_log("PostgreSQL connection established");
```

## Future Enhancements

- [ ] Add write operations through Payload REST API
- [ ] Implement connection pooling
- [ ] Add query result caching
- [ ] Create Postgres-backed implementations for other models
- [ ] Add performance monitoring and metrics

## Related Documentation

- [Payload Migration Plan](../../docs/payload-migration/README.md)
- [PHP PostgreSQL Querying](../../docs/payload-migration/03.5-php-postgresql-querying.md)
- [Frontend Cutover Strategy](../../docs/payload-migration/06-frontend-cutover.md)
