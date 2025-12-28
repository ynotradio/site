# Chapter 9: Relational Advantages

[← Back to Index](./README.md)

---

## Overview

One of the key benefits of migrating to Payload CMS with PostgreSQL is **maintaining relational database continuity**. This chapter explores why migrating from MySQL to PostgreSQL (both relational) is simpler and more advantageous than migrating from MySQL to a NoSQL document store like Sanity.

---

## MySQL → PostgreSQL: Direct Translation

### Schema Compatibility

**MySQL Table:**
```sql
CREATE TABLE artists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  bio LONGTEXT,
  photo_url VARCHAR(512),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE concerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  artist_id INT NOT NULL,
  venue_id INT NOT NULL,
  FOREIGN KEY (artist_id) REFERENCES artists(id),
  FOREIGN KEY (venue_id) REFERENCES venues(id)
);
```

**PostgreSQL Table (direct translation):**
```sql
CREATE TABLE artists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  photo_url VARCHAR(512),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE concerts (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  artist_id INTEGER NOT NULL,
  venue_id INTEGER NOT NULL,
  FOREIGN KEY (artist_id) REFERENCES artists(id),
  FOREIGN KEY (venue_id) REFERENCES venues(id)
);
```

**Key Similarities:**
- ✅ Tables with columns (same structure)
- ✅ Primary keys and foreign keys (same concept)
- ✅ Data types map 1:1 (with minor syntax changes)
- ✅ Indexes work the same way
- ✅ Constraints enforced at database level

---

## MySQL → Sanity: Document Transformation

**Sanity requires flattening relationships into documents:**

```javascript
// Sanity Artist document
{
  _id: 'artist-123',
  _type: 'artist',
  name: 'Radiohead',
  bio: [
    {
      _type: 'block',
      children: [{ _type: 'span', text: 'Bio text...' }]
    }
  ],
  photo: {
    _type: 'image',
    asset: {
      _ref: 'image-abc123'
    }
  },
  members: [
    { _ref: 'person-456', _type: 'reference' },
    { _ref: 'person-789', _type: 'reference' }
  ]
}

// Sanity Concert document
{
  _id: 'concert-123',
  _type: 'concert',
  date: '2025-01-15',
  artist: {
    _ref: 'artist-123',
    _type: 'reference'
  },
  venue: {
    _ref: 'venue-456',
    _type: 'reference'
  }
}
```

**Challenges:**
- ❌ Foreign keys → References (no database enforcement)
- ❌ JOINs → GROQ queries with dereferencing
- ❌ Transactions → Eventually consistent
- ❌ SQL → GROQ (new query language)

---

## Foreign Key Constraints

### PostgreSQL (Enforced at Database Level)

```sql
-- Cannot insert concert without valid artist
INSERT INTO concerts (date, artist_id, venue_id)
VALUES ('2025-01-15', 999, 1);  -- ERROR: artist 999 doesn't exist

-- Cannot delete artist with concerts
DELETE FROM artists WHERE id = 123;  -- ERROR: concerts reference this artist

-- Cascading deletes work automatically
ALTER TABLE concerts
ADD CONSTRAINT fk_artist
FOREIGN KEY (artist_id) REFERENCES artists(id)
ON DELETE CASCADE;  -- Delete concerts when artist deleted
```

### Sanity (No Database Enforcement)

```javascript
// Nothing prevents invalid references
await client.create({
  _type: 'concert',
  date: '2025-01-15',
  artist: {
    _ref: 'artist-999',  // Doesn't exist, but no error!
  }
});

// Deleting an artist doesn't warn about references
await client.delete('artist-123');  // Concerts now have broken references

// Must manually check for orphaned references
const orphaned = await client.fetch(`
  *[_type == "concert" && !defined(artist->_id)]
`);  // Returns concerts with broken artist references
```

---

## Query Complexity

### SQL (Relational Joins)

**Find all concerts with artist and venue names:**

```sql
SELECT 
  c.date,
  a.name AS artist_name,
  v.name AS venue_name,
  v.city
FROM concerts c
JOIN artists a ON c.artist_id = a.id
JOIN venues v ON c.venue_id = v.id
WHERE c.date >= '2025-01-01'
ORDER BY c.date;
```

**Result:** Single query, efficient JOIN, database-optimized

### GROQ (Document References)

**Same query in Sanity:**

```groq
*[_type == "concert" && date >= "2025-01-01"] | order(date asc) {
  date,
  "artistName": artist->name,
  "venueName": venue->name,
  "venueCity": venue->city
}
```

**Challenges:**
- No JOIN optimization (each `->` is a separate lookup)
- Limited to 10 levels of dereferencing
- No query planner (black box performance)
- GROQ syntax learning curve

---

## Transactional Integrity

### PostgreSQL (ACID Transactions)

```sql
BEGIN;

-- Insert artist
INSERT INTO artists (name, slug) VALUES ('New Band', 'new-band') RETURNING id;
-- Returns id = 123

-- Insert concert referencing new artist
INSERT INTO concerts (date, artist_id, venue_id) VALUES ('2025-03-15', 123, 1);

COMMIT;  -- Both succeed or both fail (atomic)
```

**If concert insert fails:**
- Artist insert is rolled back
- Database remains consistent
- No orphaned records

### Sanity (No Transactions)

```javascript
// Create artist
const artist = await client.create({
  _type: 'artist',
  name: 'New Band',
  slug: { current: 'new-band' }
});

// Create concert (separate operation)
await client.create({
  _type: 'concert',
  date: '2025-03-15',
  artist: { _ref: artist._id },
  venue: { _ref: 'venue-1' }
});
```

**If concert creation fails:**
- ❌ Artist already created (no rollback)
- ❌ Manual cleanup required
- ❌ Orphaned artist record

---

## Many-to-Many Relationships

### PostgreSQL (Join Tables)

```sql
-- Artist members (many-to-many)
CREATE TABLE artist_members (
  id SERIAL PRIMARY KEY,
  artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE,
  person_id INTEGER REFERENCES people(id) ON DELETE CASCADE,
  UNIQUE(artist_id, person_id)  -- Prevents duplicates
);

-- Query artists with members
SELECT 
  a.name AS artist_name,
  array_agg(p.name) AS members
FROM artists a
JOIN artist_members am ON a.id = am.artist_id
JOIN people p ON am.person_id = p.id
GROUP BY a.id, a.name;
```

**Benefits:**
- ✅ Database-enforced uniqueness
- ✅ Cascading deletes
- ✅ Efficient joins with indexes
- ✅ Aggregate functions (count, array_agg)

### Sanity (Array of References)

```javascript
// Artist document with member references
{
  _type: 'artist',
  name: 'Radiohead',
  members: [
    { _ref: 'person-1', _type: 'reference' },
    { _ref: 'person-2', _type: 'reference' },
    { _ref: 'person-1', _type: 'reference' }  // Duplicate! No constraint
  ]
}
```

**Challenges:**
- ❌ No uniqueness enforcement (duplicates allowed)
- ❌ No referential integrity (can reference non-existent person)
- ❌ Must manually manage reverse relationship
- ❌ Counting requires GROQ query

---

## Complex Queries

### PostgreSQL (Aggregations & Subqueries)

```sql
-- Get top 10 artists by concert count
SELECT 
  a.name,
  COUNT(c.id) AS concert_count,
  MAX(c.date) AS last_concert
FROM artists a
LEFT JOIN concerts c ON a.id = c.artist_id
GROUP BY a.id, a.name
HAVING COUNT(c.id) > 0
ORDER BY concert_count DESC
LIMIT 10;

-- Get artists with upcoming concerts
SELECT DISTINCT a.*
FROM artists a
WHERE EXISTS (
  SELECT 1 FROM concerts c
  WHERE c.artist_id = a.id
  AND c.date > CURRENT_DATE
);

-- Window functions (advanced)
SELECT 
  date,
  artist_id,
  ROW_NUMBER() OVER (PARTITION BY artist_id ORDER BY date) AS concert_number
FROM concerts;
```

**Features:**
- ✅ Aggregations (COUNT, MAX, MIN, AVG, SUM)
- ✅ Subqueries (EXISTS, IN, NOT IN)
- ✅ Window functions (ROW_NUMBER, RANK, LAG, LEAD)
- ✅ CTEs (WITH clauses) for complex logic

### GROQ (Limited Aggregation)

```groq
// Count concerts per artist (requires client-side grouping)
*[_type == "concert"] {
  "artistId": artist._ref,
  date
}

// No native GROUP BY, COUNT, or aggregation
// Must process results in application code
```

**Limitations:**
- ❌ No GROUP BY or HAVING
- ❌ No aggregate functions
- ❌ No subqueries
- ❌ No window functions
- ❌ Must use JavaScript for complex analytics

---

## Data Validation

### PostgreSQL (Schema Constraints)

```sql
CREATE TABLE concerts (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  artist_id INTEGER NOT NULL,
  venue_id INTEGER NOT NULL,
  ticket_url TEXT,
  featured BOOLEAN DEFAULT false,
  
  -- Constraints enforced at database level
  CHECK (date >= '2000-01-01'),
  CHECK (ticket_url LIKE 'http%'),
  
  FOREIGN KEY (artist_id) REFERENCES artists(id),
  FOREIGN KEY (venue_id) REFERENCES venues(id)
);

-- Invalid data rejected automatically
INSERT INTO concerts (date, artist_id, venue_id, ticket_url)
VALUES ('1999-12-31', 1, 1, 'invalid-url');
-- ERROR: date violates check constraint
-- ERROR: ticket_url violates check constraint
```

### Sanity (Validation in Schema Only)

```javascript
// Validation in Sanity schema
defineField({
  name: 'ticketUrl',
  type: 'url',
  validation: (Rule) => Rule.uri({ scheme: ['http', 'https'] })
});

// But validation can be bypassed via API
await client.create({
  _type: 'concert',
  ticketUrl: 'invalid-url'  // Bypasses schema validation!
});
```

**Differences:**
- PostgreSQL: Enforced at database level (cannot bypass)
- Sanity: Enforced at application level (can bypass with API)

---

## Performance Benefits

### Indexes

**PostgreSQL:**
```sql
-- Create indexes for fast queries
CREATE INDEX idx_concerts_date ON concerts(date);
CREATE INDEX idx_concerts_artist_id ON concerts(artist_id);
CREATE INDEX idx_artists_name ON artists(name);
CREATE INDEX idx_artists_name_trgm ON artists USING gin(name gin_trgm_ops);

-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM concerts WHERE date >= '2025-01-01';

-- Result shows index usage
Bitmap Index Scan on idx_concerts_date (cost=0.00..5.23 rows=100)
```

**Sanity:**
- No index creation control
- No query performance analysis
- Black box query optimization

### Caching

**PostgreSQL:**
- Database-level query caching
- Result set caching at application level
- Connection pooling (PgBouncer)
- Read replicas for scaling

**Sanity:**
- Relies on Sanity's CDN caching
- Limited control over cache invalidation
- No read replicas

---

## Migration Tool Support

### MySQL → PostgreSQL

**Tools available:**
- `pgloader` (automated migration)
- `pg_dump` / `pg_restore`
- AWS Database Migration Service
- Commercial tools (Navicat, DBeaver)

**Example with pgloader:**
```bash
pgloader mysql://root@localhost/ynot_site postgresql://user@neon/ynot_prod
```

**Result:** ~90% automated, handles:
- Schema conversion
- Data type mapping
- Index creation
- Foreign key constraints

### MySQL → Sanity

**No automated tools:**
- ❌ Must write custom migration scripts
- ❌ Manual schema design
- ❌ Manual reference resolution
- ❌ Manual data transformation

---

## Summary: Relational Advantages

| Feature | PostgreSQL (Relational) | Sanity (NoSQL) |
|---------|------------------------|----------------|
| **Schema Migration** | Direct translation from MySQL | Manual redesign required |
| **Foreign Keys** | Database-enforced | Application-enforced |
| **Transactions** | ACID guarantees | No transactions |
| **Queries** | Standard SQL | GROQ (proprietary) |
| **Joins** | Efficient database joins | Client-side dereferencing |
| **Aggregations** | Native (COUNT, SUM, etc.) | Client-side processing |
| **Constraints** | Database-level | Application-level |
| **Indexes** | Full control | Black box |
| **Migration Tools** | Many (pgloader, DMS) | None (custom scripts) |
| **Data Integrity** | Enforced by database | Developer responsibility |

---

## When NoSQL Makes Sense

Sanity (and NoSQL in general) is a better choice when:

- ✅ Content is document-centric (blog posts, pages)
- ✅ Flexible schema is needed (varying fields per document)
- ✅ Minimal relationships between entities
- ✅ Hosted CMS is preferred (no server management)
- ✅ Team is familiar with GROQ

---

## When Relational Makes Sense

PostgreSQL is a better choice when:

- ✅ Migrating from another relational database (MySQL, etc.)
- ✅ Complex relationships (many-to-many, etc.)
- ✅ Data integrity is critical
- ✅ Analytics and reporting are important
- ✅ Team knows SQL
- ✅ Self-hosting is acceptable

**For Y-Not Radio:** The existing MySQL schema has extensive relationships (concerts ↔ artists ↔ venues, artists ↔ members, votes ↔ contests), making PostgreSQL a more natural fit.

---

## Next Steps

- Review [CMS Switching Considerations](./10-cms-switching-considerations.md) for complexity areas
- Check [Migration Tasks](./04-migration-tasks.md) for implementation
- See [Architecture Decisions](./02-architecture-decisions.md) for patterns
