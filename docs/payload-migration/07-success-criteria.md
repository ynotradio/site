# Chapter 7: Success Criteria

[← Back to Index](./README.md)

---

## Per-Collection Checklist

For each collection migration, verify:

- [ ] Payload collection created and compiles without errors
- [ ] PostgreSQL table schema matches collection definition
- [ ] Migration script runs without errors
- [ ] Record counts match (excluding soft-deleted from MySQL)
- [ ] All images uploaded to Media collection
- [ ] Rich text converted and displays correctly
- [ ] Relationships resolve properly (foreign keys intact)
- [ ] Can create/edit/delete in Payload Admin
- [ ] REST API returns expected data
- [ ] GraphQL API returns expected data

---

## Project Completion Criteria

### Technical Criteria

- [ ] All collections created and functional
- [ ] All migrations complete with reports
- [ ] PostgreSQL schema validated
- [ ] All foreign keys defined and enforced
- [ ] Indexes created for performance
- [ ] Feature flags tested thoroughly
- [ ] PHP site reading from Payload in production
- [ ] MySQL database archived as backup
- [ ] Payload deployed to Netlify
- [ ] Neon PostgreSQL connection stable
- [ ] SSL/TLS certificates configured
- [ ] Custom domain configured
- [ ] Automated backups scheduled

### Performance Criteria

- [ ] Page load times ≤ MySQL baseline
- [ ] API response time < 500ms (p95)
- [ ] Media CDN response time < 200ms
- [ ] Database query time < 100ms (p95)
- [ ] Zero downtime during cutover
- [ ] Error rate < 0.1%

### User Experience Criteria

- [ ] No visual differences from legacy site
- [ ] All forms functional (voting, submissions)
- [ ] All links working (no 404s)
- [ ] Image quality maintained
- [ ] Mobile responsiveness preserved
- [ ] Search functionality working
- [ ] No broken rich text formatting

### Content Editor Criteria

- [ ] Site owners trained on Payload Admin
- [ ] Documentation provided for common tasks
- [ ] Bulk operations tested (clone schedule, etc.)
- [ ] Media library organized
- [ ] Content approval workflow defined
- [ ] Backup/restore procedure documented

---

## Migration Report Template

Generate a report for each collection migration in `docs/migrations/reports/`:

```markdown
# [Collection] Migration Report

**Date:** YYYY-MM-DD  
**Status:** Complete | Partial | Failed  
**Duration:** X minutes

## Summary
- Records in MySQL: X
- Records migrated: Y
- Records skipped: Z (soft-deleted)
- Validation errors: N

## PostgreSQL Table
```sql
CREATE TABLE collection_name (...);
```

## Record Counts
| Table | MySQL | PostgreSQL | Match? |
|-------|-------|------------|--------|
| collection_name | X | Y | ✅ |

## Skipped Records
| Legacy ID | Reason |
|-----------|--------|
| 123 | Soft deleted (deleted='y') |
| 456 | Invalid URL (404) |

## Validation Errors
| Legacy ID | Field | Error |
|-----------|-------|-------|
| 789 | photo_url | Image not found |

## Data Quality Issues
- 5 records missing slugs (auto-generated)
- 3 records with malformed HTML (manually fixed)
- 2 records with duplicate slugs (appended ID)

## Manual Fixes Required
- [ ] Review records with missing images
- [ ] Verify artist name normalization
- [ ] Check venue address formatting

## Notes
- All relationships validated
- Foreign keys enforced
- Indexes created for performance
```

---

## Validation Checklist

### Before Migration

1. **Backup MySQL database:**
   ```bash
   mysqldump ynot_site > backup_pre_migration.sql
   ```

2. **Export PostgreSQL schema:**
   ```bash
   pg_dump --schema-only neon_db > schema_pre_migration.sql
   ```

3. **Document current state:**
   ```sql
   SELECT 
     table_name,
     COUNT(*) as record_count
   FROM information_schema.tables
   WHERE table_schema = 'public'
   GROUP BY table_name;
   ```

### During Migration

1. **Count Check (per table):**
   ```sql
   -- MySQL
   SELECT COUNT(*) FROM concerts WHERE deleted != 'y';
   
   -- PostgreSQL
   SELECT COUNT(*) FROM concerts WHERE deleted_at IS NULL;
   ```

2. **Image Check:**
   - Spot check 10 random records
   - Verify images load in Payload Admin
   - Check thumbnail generation

3. **Reference Check:**
   - Verify all foreign keys resolve
   - Check for orphaned records
   ```sql
   SELECT * FROM concerts c
   LEFT JOIN artists a ON c.artist_id = a.id
   WHERE a.id IS NULL;
   ```

4. **Content Check:**
   - Verify rich text renders correctly
   - Check for encoding issues (UTF-8)
   - Test special characters

### After Migration

1. **API Validation:**
   ```bash
   # Test REST endpoints
   curl https://api.ynotradio.net/api/concerts?limit=10
   curl https://api.ynotradio.net/api/artists?limit=10
   
   # Test GraphQL
   curl -X POST https://api.ynotradio.net/api/graphql \
     -H "Content-Type: application/json" \
     -d '{"query": "{ Concerts { docs { date artist { name } } } }"}'
   ```

2. **Performance Testing:**
   ```bash
   # Load test with Apache Bench
   ab -n 1000 -c 10 https://api.ynotradio.net/api/concerts
   
   # Response time p95 should be < 500ms
   ```

3. **Data Consistency:**
   ```sql
   -- Check for duplicate slugs
   SELECT slug, COUNT(*) as count
   FROM artists
   GROUP BY slug
   HAVING COUNT(*) > 1;
   
   -- Check for missing required fields
   SELECT * FROM concerts WHERE artist_id IS NULL;
   ```

4. **Frontend Testing:**
   - Visual diff test (MySQL vs Payload pages)
   - Click through all links
   - Test forms and voting
   - Test mobile view

---

## Automated Testing

### Collection CRUD Tests

```typescript
// tests/collections/artists.test.ts
import { getPayloadClient } from '../utils/payload';

describe('Artists Collection', () => {
  let payload;
  
  beforeAll(async () => {
    payload = await getPayloadClient();
  });
  
  test('can create artist', async () => {
    const artist = await payload.create({
      collection: 'artists',
      data: {
        name: 'Test Artist',
        slug: 'test-artist',
      },
    });
    
    expect(artist).toBeDefined();
    expect(artist.name).toBe('Test Artist');
  });
  
  test('can query with relationships', async () => {
    const artists = await payload.find({
      collection: 'artists',
      depth: 2,
    });
    
    expect(artists.docs.length).toBeGreaterThan(0);
    expect(artists.docs[0].members).toBeDefined();
  });
  
  test('enforces unique slugs', async () => {
    await expect(
      payload.create({
        collection: 'artists',
        data: {
          name: 'Duplicate',
          slug: 'test-artist', // Already exists
        },
      })
    ).rejects.toThrow();
  });
});
```

### Migration Validation Tests

```typescript
// tests/migrations/validate.test.ts
import { getMySQLConnection } from '../../bin/migrations/shared/mysqlConnection';
import { getPayloadClient } from '../utils/payload';

describe('Migration Validation', () => {
  test('record counts match', async () => {
    const mysql = await getMySQLConnection();
    const payload = await getPayloadClient();
    
    // Check artists
    const [mysqlRows] = await mysql.query(
      'SELECT COUNT(*) as count FROM artists WHERE deleted != "y"'
    );
    const payloadDocs = await payload.find({
      collection: 'artists',
      limit: 0, // Just get count
    });
    
    expect(payloadDocs.totalDocs).toBe(mysqlRows[0].count);
  });
  
  test('all foreign keys resolve', async () => {
    const payload = await getPayloadClient();
    
    const concerts = await payload.find({
      collection: 'concerts',
      depth: 1,
    });
    
    concerts.docs.forEach(concert => {
      expect(concert.artist).toBeDefined();
      expect(concert.venue).toBeDefined();
    });
  });
});
```

### API Integration Tests

```typescript
// tests/api/concerts.test.ts
import axios from 'axios';

const API_URL = process.env.PAYLOAD_API_URL || 'http://localhost:3000';

describe('Concerts API', () => {
  test('GET /api/concerts returns data', async () => {
    const response = await axios.get(`${API_URL}/api/concerts?limit=10`);
    
    expect(response.status).toBe(200);
    expect(response.data.docs).toBeInstanceOf(Array);
    expect(response.data.docs.length).toBeLessThanOrEqual(10);
  });
  
  test('GraphQL query works', async () => {
    const response = await axios.post(`${API_URL}/api/graphql`, {
      query: `{
        Concerts(limit: 10) {
          docs {
            date
            artist { name }
            venue { name }
          }
        }
      }`,
    });
    
    expect(response.status).toBe(200);
    expect(response.data.data.Concerts.docs).toBeDefined();
  });
});
```

---

## Continuous Monitoring

### Health Check Endpoint

```typescript
// payload/src/endpoints/health.ts
export const healthCheck = {
  path: '/health',
  method: 'get',
  handler: async (req, res) => {
    try {
      // Check database connection
      const result = await req.payload.db.connection.raw('SELECT 1');
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        version: process.env.npm_package_version,
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error.message,
      });
    }
  },
};
```

### Metrics to Track

| Metric | Threshold | Alert |
|--------|-----------|-------|
| API response time (p95) | < 500ms | Email + Slack |
| Error rate | < 0.1% | Immediate |
| Database connections | < 80% pool | Warning |
| Disk usage | < 80% | Warning |
| Memory usage | < 90% | Critical |
| Uptime | > 99.9% | Monthly report |

---

## Rollback Criteria

Trigger rollback if:

- [ ] Error rate > 5% for 5 minutes
- [ ] API response time > 2s (p95) for 10 minutes
- [ ] Database connection failures > 10 in 5 minutes
- [ ] Critical data inconsistency detected
- [ ] User-reported critical bugs > 5 in 1 hour

---

## Sign-off Checklist

Before declaring migration complete:

- [ ] Technical lead approval
- [ ] QA team sign-off
- [ ] Content editors trained
- [ ] Stakeholders informed
- [ ] Monitoring dashboards set up
- [ ] Incident response plan documented
- [ ] MySQL decommission date scheduled

---

## Next Steps

- Review [Quick Reference](./08-quick-reference.md) for commands
- Check [Frontend Cutover](./06-frontend-cutover.md) for deployment strategy
- See [Migration Tasks](./04-migration-tasks.md) for implementation steps
