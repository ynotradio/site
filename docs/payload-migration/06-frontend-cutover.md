# Chapter 6: Frontend Cutover Strategy

[← Back to Index](./README.md)

---

## Overview

The frontend cutover is a gradual process that moves the PHP site from reading MySQL directly to reading from Payload CMS via REST/GraphQL APIs. This chapter outlines the strategy for incremental migration with feature flags, testing, and monitoring.

---

## Cutover Phases

### Phase 1: Parallel Systems (Weeks 1-2)

**Goal:** Both MySQL and Payload operational, no frontend changes

- ✅ MySQL database running (source of truth)
- ✅ Payload deployed to Netlify with PostgreSQL
- ✅ All collections migrated and validated
- ✅ REST/GraphQL APIs functional
- ⏸️ PHP still reading from MySQL

**Validation:**
- Run parallel queries (MySQL vs Payload) and compare results
- Verify data consistency with automated tests
- Monitor Payload Admin usage by content editors

---

### Phase 2: Feature Flag Implementation (Week 3)

**Goal:** Add feature flags to PHP for gradual API cutover

**Create Feature Flag System:**

```php
// src/lib/FeatureFlags.php
class FeatureFlags {
  private $flags = [];
  
  public function __construct() {
    $this->flags = [
      'use_payload_concerts' => getenv('FEATURE_PAYLOAD_CONCERTS') === 'true',
      'use_payload_djs' => getenv('FEATURE_PAYLOAD_DJS') === 'true',
      'use_payload_artists' => getenv('FEATURE_PAYLOAD_ARTISTS') === 'true',
      // ... more flags
    ];
  }
  
  public function isEnabled($flag) {
    return $this->flags[$flag] ?? false;
  }
}
```

**Create Payload API Client:**

```php
// src/lib/PayloadClient.php
class PayloadClient {
  private $baseUrl;
  private $cache;
  
  public function __construct($baseUrl) {
    $this->baseUrl = $baseUrl;
    $this->cache = new Cache();
  }
  
  public function get($endpoint, $params = []) {
    $cacheKey = md5($endpoint . json_encode($params));
    
    if ($cached = $this->cache->get($cacheKey)) {
      return $cached;
    }
    
    $url = $this->baseUrl . $endpoint . '?' . http_build_query($params);
    $response = file_get_contents($url);
    $data = json_decode($response, true);
    
    $this->cache->set($cacheKey, $data, 300); // 5 min cache
    
    return $data;
  }
  
  public function getConcerts($limit = 10) {
    return $this->get('/api/concerts', [
      'limit' => $limit,
      'depth' => 2,
      'where[date][greater_than_equals]' => date('Y-m-d'),
    ]);
  }
}
```

**Update Page with Feature Flag:**

```php
// src/concerts.php
require_once 'lib/FeatureFlags.php';
require_once 'lib/PayloadClient.php';

$flags = new FeatureFlags();

if ($flags->isEnabled('use_payload_concerts')) {
  // Read from Payload
  $payloadClient = new PayloadClient(getenv('PAYLOAD_API_URL'));
  $concerts = $payloadClient->getConcerts(20);
  $concerts = $concerts['docs']; // Extract docs array
} else {
  // Read from MySQL (legacy)
  $stmt = $pdo->prepare('SELECT * FROM concerts WHERE date >= NOW() LIMIT 20');
  $stmt->execute();
  $concerts = $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Render template (same for both)
include 'templates/concerts.php';
```

---

### Phase 3: Incremental Page Migration (Weeks 4-6)

**Goal:** Enable feature flags page-by-page, validate, and monitor

**Migration Order (by risk level):**

| Priority | Page | Risk | Flag | Validation |
|----------|------|------|------|------------|
| 1 | DJs listing | Low | `use_payload_djs` | Compare HTML output |
| 2 | Concert calendar | Low | `use_payload_concerts` | Verify dates/venues |
| 3 | CD of the Week | Medium | `use_payload_cdotw` | Rich text rendering |
| 4 | New Music | Medium | `use_payload_songs` | Verify streaming links |
| 5 | Top 11 Contest | High | `use_payload_top11` | Voting functionality |
| 6 | Show schedule | High | `use_payload_schedule` | Time formatting |

**Per-Page Checklist:**

- [ ] Enable feature flag on staging
- [ ] Run visual diff test (compare MySQL vs Payload HTML)
- [ ] Test all interactive features (forms, voting, etc.)
- [ ] Monitor error logs for 24 hours
- [ ] Enable on production at 10% traffic
- [ ] Ramp up to 50%, then 100%
- [ ] Remove MySQL fallback code

**Tools:**

- **Visual Diff:** Percy.io or BackstopJS for screenshot comparison
- **Monitoring:** Sentry for error tracking
- **Analytics:** Google Analytics for traffic/engagement metrics

---

### Phase 4: Traffic Split Testing (Week 7)

**Goal:** A/B test MySQL vs Payload with real users

**Using Netlify Split Testing:**

```toml
# netlify.toml
[[redirects]]
  from = "/concerts.php"
  to = "/concerts-payload.php"
  status = 200
  conditions = {Cookie = ["payload_migration=enabled"]}
  force = true

[[redirects]]
  from = "/concerts.php"
  to = "/concerts-mysql.php"
  status = 200
  force = true
```

**Set Cookie for Test Users:**

```php
// Set cookie for beta users
if (isset($_GET['beta']) && $_GET['beta'] === 'true') {
  setcookie('payload_migration', 'enabled', time() + 86400 * 30, '/');
  header('Location: /concerts.php');
  exit;
}
```

**Metrics to Monitor:**

- Page load time (Payload vs MySQL)
- Error rate (500s, 404s)
- Conversion rate (form submissions, votes)
- Bounce rate
- User engagement (time on page)

---

### Phase 5: Full Cutover (Week 8)

**Goal:** Remove MySQL reads, make Payload the source of truth

**Steps:**

1. **Remove all feature flags:**
   ```php
   // Before
   if ($flags->isEnabled('use_payload_concerts')) {
     $concerts = $payloadClient->getConcerts();
   } else {
     $concerts = fetchFromMySQL();
   }
   
   // After
   $concerts = $payloadClient->getConcerts();
   ```

2. **Remove MySQL query code:**
   - Delete old MySQL query functions
   - Remove PDO connection setup
   - Clean up unused PHP files

3. **Update environment variables:**
   ```bash
   # Remove MySQL credentials
   # DB_HOST=...
   # DB_USER=...
   # DB_PASSWORD=...
   
   # Keep only Payload
   PAYLOAD_API_URL=https://api.ynotradio.net
   ```

4. **Archive MySQL database:**
   ```bash
   # Final backup
   mysqldump ynot_site > ynot_site_final_backup_2025-12-28.sql
   
   # Compress
   gzip ynot_site_final_backup_2025-12-28.sql
   
   # Upload to S3 or cold storage
   aws s3 cp ynot_site_final_backup_2025-12-28.sql.gz s3://backups/
   ```

5. **Decommission MySQL server:**
   - Set to read-only mode (for 30 days)
   - Shut down after 30-day grace period
   - Document rollback procedure (restore from PostgreSQL)

---

## Rollback Strategy

### Emergency Rollback (if critical issue found)

**Steps:**

1. **Disable feature flags immediately:**
   ```bash
   # On server
   export FEATURE_PAYLOAD_CONCERTS=false
   export FEATURE_PAYLOAD_DJS=false
   # ... all flags
   
   # Or update .env
   php artisan config:clear
   ```

2. **Verify MySQL still operational:**
   ```sql
   SELECT COUNT(*) FROM concerts;
   ```

3. **Investigate issue:**
   - Check Payload logs
   - Check PostgreSQL connection
   - Check API response times

4. **Fix and re-enable incrementally:**
   - Fix the root cause
   - Re-enable flags one at a time
   - Monitor closely

### Partial Rollback (single page issue)

**Example: Concert page has issues**

```php
// Temporarily disable concert flag only
$flags->flags['use_payload_concerts'] = false;
```

---

## Netlify Deployment Configuration

**File:** `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "payload/build"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/admin/*"
  to = "/.netlify/functions/payload/:splat"
  status = 200

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/payload/:splat"
  status = 200

[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type, Authorization"
    Cache-Control = "public, max-age=300"

[context.production.environment]
  DATABASE_URI = "${NEON_DATABASE_URL}"
  PAYLOAD_SECRET = "${PAYLOAD_SECRET}"

[context.staging.environment]
  DATABASE_URI = "${NEON_STAGING_DATABASE_URL}"
  PAYLOAD_SECRET = "${PAYLOAD_SECRET}"
```

---

## Caching Strategy

### Payload API Caching

**Using Redis (optional):**

```typescript
// payload/src/payload.config.ts
import { buildConfig } from 'payload/config';
import { RedisCache } from '@payloadcms/plugin-redis-cache';

export default buildConfig({
  plugins: [
    RedisCache({
      redis: {
        url: process.env.REDIS_URL,
      },
      ttl: 300, // 5 minutes
    }),
  ],
});
```

**Using Netlify Edge Caching:**

```typescript
// netlify/functions/payload.ts
export const handler = async (event, context) => {
  // Set cache headers
  return {
    statusCode: 200,
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=600',
    },
    body: JSON.stringify(data),
  };
};
```

---

## Monitoring & Alerts

### Error Tracking (Sentry)

```php
// src/lib/ErrorHandler.php
use Sentry\init;

init(['dsn' => getenv('SENTRY_DSN')]);

try {
  $concerts = $payloadClient->getConcerts();
} catch (Exception $e) {
  captureException($e);
  // Fall back to MySQL
  $concerts = fetchFromMySQL();
}
```

### Performance Monitoring (New Relic)

```php
// Track API response times
newrelic_start_transaction('concerts_page');
$concerts = $payloadClient->getConcerts();
newrelic_end_transaction();
```

### Uptime Monitoring (Pingdom)

- Monitor `/api/concerts` endpoint (should return 200)
- Alert if response time > 1s
- Alert if error rate > 1%

---

## Success Criteria

- [ ] All pages reading from Payload
- [ ] Page load times ≤ MySQL baseline
- [ ] Error rate < 0.1%
- [ ] No reported user issues
- [ ] MySQL database archived
- [ ] Documentation updated
- [ ] Team trained on Payload Admin

---

## Next Steps

- Review [Success Criteria](./07-success-criteria.md) for validation
- Check [Quick Reference](./08-quick-reference.md) for commands
- See [CMS Switching Considerations](./10-cms-switching-considerations.md) for complexity areas
