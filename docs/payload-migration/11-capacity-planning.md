# Chapter 11: Capacity Planning

[← Back to Index](./README.md)

---

## Overview

This chapter provides capacity planning guidance for Payload CMS with PostgreSQL on Neon, including database limits, storage estimates, pricing considerations, and scaling strategies.

---

## Neon PostgreSQL Limits

### Free Tier

| Resource | Limit | Notes |
|----------|-------|-------|
| **Storage** | 0.5 GB | Includes database + indexes |
| **Compute Hours** | 191 hours/month | Active time only (scales to zero) |
| **Branches** | 10 | Like Git branches for testing |
| **Projects** | 1 | One PostgreSQL cluster |
| **Connection Pooling** | Included | Built-in PgBouncer |
| **Autoscaling** | 0.25 - 2 vCPU | Automatic |

**Free Tier Suitability:**
- ✅ Development/staging environments
- ✅ Low-traffic sites (<1k daily visitors)
- ✅ Testing and experimentation
- ❌ Production with high traffic

### Pro Tier ($19/month)

| Resource | Limit | Notes |
|----------|-------|-------|
| **Storage** | 10 GB included | +$3.50/GB/month over |
| **Compute Hours** | 300 hours included | +$0.16/compute hour over |
| **Branches** | Unlimited | Full branch management |
| **Projects** | Unlimited | Multiple databases |
| **Point-in-Time Restore** | 7 days | Time-travel for recovery |
| **Autoscaling** | 0.25 - 4 vCPU | Higher ceiling |

**Pro Tier Suitability:**
- ✅ Production sites with moderate traffic
- ✅ Multiple environments (dev, staging, prod)
- ✅ Point-in-time restore needed
- ✅ Content inventory < 10 GB

### Enterprise Tier (Custom Pricing)

| Resource | Limit | Notes |
|----------|-------|-------|
| **Storage** | Unlimited | Custom pricing |
| **Compute Hours** | Unlimited | Dedicated resources |
| **Branches** | Unlimited | Advanced workflows |
| **SLA** | 99.95% uptime | Service-level agreement |
| **Support** | Dedicated | Slack/email support |
| **IP Allowlisting** | Included | Security features |

**Enterprise Tier Suitability:**
- ✅ High-traffic sites (100k+ daily visitors)
- ✅ Mission-critical applications
- ✅ Compliance requirements

---

## Content Inventory Estimate

### Current MySQL Database Size

```bash
# Check MySQL database size
mysql -u root -p -e "
  SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
  FROM information_schema.tables
  WHERE table_schema = 'ynot_site'
  GROUP BY table_schema;
"
```

**Example Output:**
```
Database    Size (MB)
ynot_site   87.45
```

### PostgreSQL Size Estimate

PostgreSQL typically uses **20-30% more space** than MySQL due to:
- MVCC (Multi-Version Concurrency Control)
- Larger indexes
- Additional system tables

**Estimated PostgreSQL Size:**
- MySQL: 87 MB
- PostgreSQL: ~110-115 MB (87 × 1.25)
- With indexes: ~150 MB
- With rich text (TipTap JSON): ~200 MB

**Conclusion:** Fits comfortably in Free Tier (0.5 GB = 500 MB)

---

## Storage Breakdown by Collection

### Text Content

| Collection | Estimated Records | Avg Size | Total |
|-----------|------------------|----------|-------|
| Artists | 500 | 2 KB | 1 MB |
| Venues | 100 | 1 KB | 100 KB |
| Concerts | 2,000 | 1 KB | 2 MB |
| Songs | 1,500 | 2 KB | 3 MB |
| Posts | 200 | 10 KB | 2 MB |
| Shows | 5,000 | 0.5 KB | 2.5 MB |
| People | 300 | 2 KB | 600 KB |
| DJs | 50 | 3 KB | 150 KB |

**Total Text Content:** ~12 MB

### Rich Text (TipTap JSON)

TipTap JSON is typically **2-3x larger** than plain text due to markup:

| Collection | Records with Rich Text | Avg JSON Size | Total |
|-----------|------------------------|--------------|-------|
| Artists (bio) | 300 | 5 KB | 1.5 MB |
| Posts (content) | 200 | 20 KB | 4 MB |
| CdOfTheWeek (review) | 150 | 15 KB | 2.25 MB |

**Total Rich Text:** ~8 MB

### Media References

Media stored separately (Cloudinary/S3), only references in database:

| Collection | Records | Ref Size | Total |
|-----------|---------|----------|-------|
| Media (metadata) | 3,000 | 0.5 KB | 1.5 MB |

**Total Media References:** ~1.5 MB

### Voting Data (PostgreSQL Native)

| Collection | Estimated Records | Avg Size | Total |
|-----------|------------------|----------|-------|
| Top11Votes | 50,000 | 100 bytes | 5 MB |
| YearEndPollVotes | 20,000 | 100 bytes | 2 MB |
| MRMVotes | 30,000 | 100 bytes | 3 MB |

**Total Voting Data:** ~10 MB

### Indexes

PostgreSQL indexes typically add **20-40% overhead**:

**Estimated Index Size:** 10 MB

### Total Database Size Estimate

| Category | Size |
|----------|------|
| Text Content | 12 MB |
| Rich Text | 8 MB |
| Media References | 1.5 MB |
| Voting Data | 10 MB |
| Indexes | 10 MB |
| System Tables | 5 MB |
| **Total** | **~47 MB** |

**With 3x safety margin:** ~150 MB

**Conclusion:** Well within Free Tier (500 MB)

---

## Compute Hours Estimate

### Neon Compute Behavior

- **Scales to zero**: No usage when idle
- **Auto-wakes**: Wakes on connection (300-500ms)
- **Stays active**: For 5 minutes after last query
- **Compute hour**: 1 vCPU running for 1 hour

### Traffic Estimate

**Assumptions:**
- 10,000 page views/month
- Average 3 API calls per page view
- 30,000 API calls/month

**Active Time Calculation:**
```
30,000 queries ÷ 60 queries/minute = 500 active minutes
500 minutes + 5-minute idle timeouts = ~550 minutes
550 minutes ÷ 60 = ~9 compute hours/month
```

**Conclusion:** Well within Free Tier (191 hours)

### High-Traffic Scenario

**Assumptions:**
- 100,000 page views/month
- Average 3 API calls per page view
- 300,000 API calls/month

**Active Time Calculation:**
```
300,000 queries ÷ 60 queries/minute = 5,000 active minutes
5,000 minutes + idle timeouts = ~5,500 minutes
5,500 minutes ÷ 60 = ~92 compute hours/month
```

**Conclusion:** Still within Free Tier

---

## Netlify Pricing

### Free Tier

| Resource | Limit | Notes |
|----------|-------|-------|
| **Bandwidth** | 100 GB/month | Includes API responses |
| **Build Minutes** | 300 minutes/month | CI/CD builds |
| **Functions** | 125k invocations | Serverless functions |
| **Functions Duration** | 100 hours | Total execution time |
| **Sites** | Unlimited | Multiple deployments |

**Free Tier Suitability:**
- ✅ Low to moderate traffic sites
- ✅ Development/staging
- ⚠️ May need upgrade for high traffic

### Pro Tier ($19/month)

| Resource | Limit | Notes |
|----------|-------|-------|
| **Bandwidth** | 400 GB/month | +$20/100GB over |
| **Build Minutes** | 25,000 minutes | +$7/500 minutes over |
| **Functions** | 2M invocations | +$25/1M over |
| **Functions Duration** | 1,000 hours | +$25/100 hours over |
| **Background Functions** | Included | Long-running tasks |

---

## Cost Comparison: Sanity vs Payload

### Sanity Pricing

**Free Tier:**
- 10,000 documents
- 5 GB assets
- 3 users
- **Cost:** $0/month

**Growth Tier ($99/month):**
- 100,000 documents
- 10 GB assets
- Unlimited users
- **Cost:** $99/month

**Y-Not Radio Estimate:**
- ~10,000 documents (at limit of free tier)
- ~3 GB assets
- Likely needs Growth tier → **$99/month**

### Payload (Netlify + Neon) Pricing

**Option 1: All Free Tier**
- Neon Free: 0.5 GB, 191 compute hours
- Netlify Free: 100 GB bandwidth, 125k functions
- **Cost:** $0/month

**Option 2: Pro Tiers**
- Neon Pro: $19/month
- Netlify Pro: $19/month
- **Cost:** $38/month

**Savings:** $61/month ($732/year) vs Sanity Growth

---

## Scaling Strategies

### Database Scaling

**Vertical Scaling (Neon):**
- Free: 0.25 - 2 vCPU
- Pro: 0.25 - 4 vCPU
- Enterprise: Custom

**Horizontal Scaling:**
- Read replicas (Enterprise tier)
- Connection pooling (included)
- Query optimization

### API Scaling

**Netlify Functions:**
- Auto-scales with traffic
- Regional edge deployment
- Built-in CDN

**Caching:**
```typescript
// Cache API responses (5 minutes)
export const handler = async (event) => {
  return {
    statusCode: 200,
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=600',
    },
    body: JSON.stringify(data),
  };
};
```

### Media Scaling

**Cloudinary Free Tier:**
- 25 GB storage
- 25 GB bandwidth/month
- **Cost:** $0/month

**Cloudinary Plus ($99/month):**
- 120 GB storage
- 120 GB bandwidth/month

---

## Storage Growth Projections

### Year 1
- New concerts: 200/year × 1 KB = 200 KB
- New songs: 500/year × 2 KB = 1 MB
- New posts: 50/year × 10 KB = 500 KB
- New votes: 20,000/year × 100 bytes = 2 MB
- **Total Growth:** ~4 MB/year

**5-Year Projection:** 47 MB + (4 MB × 5) = **67 MB**

**Conclusion:** Free tier sufficient for 5+ years

### High-Growth Scenario
- 10x traffic increase
- 10x content creation rate
- **Total Growth:** ~40 MB/year

**5-Year Projection:** 47 MB + (40 MB × 5) = **247 MB**

**Conclusion:** Still within Free tier

---

## Content Pruning Strategies

### Archive Old Data

```sql
-- Archive old concerts (>3 years)
UPDATE concerts
SET deleted_at = NOW()
WHERE date < NOW() - INTERVAL '3 years';

-- Archive old votes (>2 years)
UPDATE top11_votes
SET deleted_at = NOW()
WHERE voted_at < NOW() - INTERVAL '2 years';
```

### Compression

**PostgreSQL Toast:**
- Automatically compresses large text fields
- Stores compressed data out-of-line
- Transparent to application

**JSON Compression:**
```sql
-- Use JSONB for automatic compression
ALTER TABLE posts
ALTER COLUMN content TYPE JSONB USING content::jsonb;
```

---

## Monitoring & Alerts

### Neon Dashboard

**Metrics to Monitor:**
- Storage usage (target: <80% of plan)
- Compute hours (target: <80% of plan)
- Connection count (target: <50 connections)
- Query latency (target: <100ms p95)

### Netlify Analytics

**Metrics to Monitor:**
- Bandwidth usage
- Function invocations
- Function duration
- Build minutes

### Alerts

**Set up alerts for:**
- Storage > 80% of plan
- Compute hours > 80% of plan
- API error rate > 1%
- Query latency > 500ms (p95)

---

## Backup & Recovery

### Neon Backups

**Free Tier:**
- Point-in-time restore: Not included
- Manual snapshots: Via pg_dump

**Pro Tier:**
- Point-in-time restore: 7 days
- Automatic snapshots: Daily
- Recovery time: Minutes

**Manual Backup:**
```bash
# Daily backup script
pg_dump $DATABASE_URI > backup_$(date +%Y%m%d).sql
gzip backup_$(date +%Y%m%d).sql
aws s3 cp backup_$(date +%Y%m%d).sql.gz s3://backups/
```

### Payload Backups

**Collections Config:**
```typescript
// Automatic backups via hooks
export const Artists: CollectionConfig = {
  slug: 'artists',
  hooks: {
    afterChange: [
      async ({ doc, operation }) => {
        if (operation === 'delete') {
          await backupDocument('artists', doc);
        }
      },
    ],
  },
};
```

---

## Optimization Tips

### Database Optimization

```sql
-- Create indexes for common queries
CREATE INDEX idx_concerts_date ON concerts(date);
CREATE INDEX idx_concerts_artist_id ON concerts(artist_id);
CREATE INDEX idx_artists_slug ON artists(slug);

-- Analyze query plans
EXPLAIN ANALYZE
SELECT * FROM concerts WHERE date >= CURRENT_DATE;

-- Vacuum and analyze regularly
VACUUM ANALYZE;
```

### API Optimization

**Query Depth Limit:**
```typescript
// Limit relationship depth to prevent N+1 queries
const concerts = await payload.find({
  collection: 'concerts',
  depth: 1,  // Don't over-fetch
  limit: 10,
});
```

**Pagination:**
```typescript
// Use pagination for large result sets
const concerts = await payload.find({
  collection: 'concerts',
  page: 1,
  limit: 20,  // Don't fetch all at once
});
```

---

## Summary

| Metric | Current Estimate | Free Tier Limit | Headroom |
|--------|-----------------|-----------------|----------|
| **Storage** | ~150 MB | 500 MB | 3.3x |
| **Compute Hours** | ~9 hours/month | 191 hours/month | 21x |
| **Bandwidth** | ~20 GB/month | 100 GB/month | 5x |

**Recommendation:** Start with **Free Tier** for both Neon and Netlify. Monitor usage and upgrade to Pro tiers ($38/month total) if needed.

**Cost Comparison:** Even with Pro tiers, Payload + Neon ($38/month) is **61% cheaper** than Sanity Growth ($99/month).

---

## Next Steps

- Review [Migration Tasks](./04-migration-tasks.md) for implementation
- Check [Success Criteria](./07-success-criteria.md) for validation
- See [Architecture Decisions](./02-architecture-decisions.md) for patterns
- Set up monitoring and alerts before production launch
