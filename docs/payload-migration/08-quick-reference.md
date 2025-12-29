# Chapter 8: Quick Reference

[← Back to Index](./README.md)

---

## Common Commands

### Payload Development

```bash
# Start Payload in development mode
npm run payload:dev

# Build Payload for production
npm run payload:build

# Start production server
npm run payload:serve

# Generate TypeScript types from collections
npm run payload:generate-types

# Run database migrations
npm run payload:migrate

# Validate Payload configuration
npm run payload:validate

# Seed database with sample data
npm run payload:seed
```

### Database Commands

```bash
# Connect to PostgreSQL (Neon)
psql postgres://user:pass@neon.host/dbname

# Backup database
pg_dump -h neon.host -U user -d dbname > backup.sql

# Restore database
psql -h neon.host -U user -d dbname < backup.sql

# Check connection
psql -h neon.host -U user -d dbname -c "SELECT version();"

# List all tables
psql -h neon.host -U user -d dbname -c "\dt"

# Count records in a table
psql -h neon.host -U user -d dbname -c "SELECT COUNT(*) FROM artists;"
```

### Migration Scripts

```bash
# Import all collections
npm run import:all

# Import specific collections
npm run import:people
npm run import:djs
npm run import:artists
npm run import:venues
npm run import:concerts
npm run import:songs
npm run import:cdotw

# MySQL to PostgreSQL migration
npm run migrate:mysql-to-postgres

# Validate migrations
npm run validate:migrations
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm test -- artists.test.ts

# Run tests in watch mode
npm run test:watch
```

### Deployment (Netlify)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to production
netlify deploy --prod

# Deploy to preview
netlify deploy

# View deployment logs
netlify logs

# Open Netlify admin
netlify open
```

---

## REST API Quick Reference

### Authentication

```bash
# Login (get JWT token)
curl -X POST https://api.ynotradio.net/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ynotradio.net", "password": "password"}'

# Use token in requests
curl https://api.ynotradio.net/api/concerts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Collections

```bash
# Get all artists
curl https://api.ynotradio.net/api/artists

# Get artist by ID (with relationships)
curl https://api.ynotradio.net/api/artists/123?depth=2

# Search artists by name
curl "https://api.ynotradio.net/api/artists?where[name][like]=Beatles"

# Get concerts (filtered by date)
curl "https://api.ynotradio.net/api/concerts?where[date][greater_than_equals]=2025-01-01"

# Get concerts (with artist and venue)
curl "https://api.ynotradio.net/api/concerts?depth=2&limit=10"

# Create new artist (requires auth)
curl -X POST https://api.ynotradio.net/api/artists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "New Artist", "slug": "new-artist"}'

# Update artist (requires auth)
curl -X PATCH https://api.ynotradio.net/api/artists/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "Updated Name"}'

# Delete artist (requires auth)
curl -X DELETE https://api.ynotradio.net/api/artists/123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Query Parameters

| Parameter | Example | Description |
|-----------|---------|-------------|
| `limit` | `?limit=10` | Limit results (default: 10, max: 100) |
| `page` | `?page=2` | Pagination page number |
| `depth` | `?depth=2` | Relationship depth (0-10) |
| `sort` | `?sort=-createdAt` | Sort by field (- for descending) |
| `where` | `?where[name][like]=Beatles` | Filter results |

### Where Clause Operators

| Operator | Example | Description |
|----------|---------|-------------|
| `equals` | `where[status][equals]=active` | Exact match |
| `not_equals` | `where[status][not_equals]=deleted` | Not equal |
| `like` | `where[name][like]=Beatles` | Case-insensitive contains |
| `contains` | `where[tags][contains]=rock` | Array contains |
| `in` | `where[id][in]=1,2,3` | Value in list |
| `greater_than` | `where[date][greater_than]=2025-01-01` | Greater than |
| `greater_than_equals` | `where[date][greater_than_equals]=2025-01-01` | Greater than or equal |
| `less_than` | `where[date][less_than]=2025-12-31` | Less than |
| `less_than_equals` | `where[date][less_than_equals]=2025-12-31` | Less than or equal |

---

## GraphQL Quick Reference

### Schema Introspection

```graphql
{
  __schema {
    types {
      name
      kind
    }
  }
}
```

### Queries

```graphql
# Get all artists
query {
  Artists {
    docs {
      id
      name
      slug
      bio
      website
    }
    totalDocs
    limit
    page
  }
}

# Get artist with members
query {
  Artists {
    docs {
      name
      members {
        name
        slug
      }
    }
  }
}

# Get concerts with relationships
query {
  Concerts(
    where: { date: { greater_than_equals: "2025-01-01" } }
    limit: 10
    sort: "date"
  ) {
    docs {
      date
      artist {
        name
        photo {
          url
          alt
        }
      }
      venue {
        name
        city
      }
      ticketInfo
      ticketUrl
    }
  }
}

# Get single artist by ID
query {
  Artist(id: "123") {
    name
    slug
    members {
      name
    }
  }
}

# Search artists
query {
  Artists(where: { name: { like: "Beatles" } }) {
    docs {
      name
      slug
    }
  }
}
```

### Mutations

```graphql
# Create artist
mutation {
  createArtist(
    data: {
      name: "New Artist"
      slug: "new-artist"
      website: "https://example.com"
    }
  ) {
    id
    name
    slug
  }
}

# Update artist
mutation {
  updateArtist(
    id: "123"
    data: { name: "Updated Name" }
  ) {
    id
    name
  }
}

# Delete artist
mutation {
  deleteArtist(id: "123") {
    id
  }
}
```

---

## PostgreSQL Query Patterns

### Basic Queries

```sql
-- Get all active artists
SELECT * FROM artists WHERE deleted_at IS NULL;

-- Get concerts with artist names (JOIN)
SELECT 
  c.date,
  a.name AS artist_name,
  v.name AS venue_name
FROM concerts c
JOIN artists a ON c.artist_id = a.id
JOIN venues v ON c.venue_id = v.id
WHERE c.date >= CURRENT_DATE
ORDER BY c.date ASC;

-- Get artist with members (many-to-many)
SELECT 
  a.name AS artist_name,
  p.name AS member_name
FROM artists a
JOIN artist_members am ON a.id = am.artist_id
JOIN people p ON am.person_id = p.id
WHERE a.slug = 'radiohead';

-- Count concerts by artist
SELECT 
  a.name,
  COUNT(c.id) AS concert_count
FROM artists a
LEFT JOIN concerts c ON a.id = c.artist_id
GROUP BY a.id, a.name
ORDER BY concert_count DESC
LIMIT 10;
```

### Advanced Queries

```sql
-- Full-text search on artist names
SELECT * FROM artists
WHERE name ILIKE '%beatles%'
ORDER BY name;

-- Get upcoming shows grouped by week
SELECT 
  DATE_TRUNC('week', date) AS week,
  COUNT(*) AS show_count
FROM shows
WHERE date >= CURRENT_DATE
GROUP BY week
ORDER BY week;

-- Get most voted songs (join with votes)
SELECT 
  s.title,
  a.name AS artist_name,
  COUNT(v.id) AS vote_count
FROM songs s
JOIN song_artists sa ON s.id = sa.song_id
JOIN artists a ON sa.artist_id = a.id
LEFT JOIN top11_votes v ON s.id = v.song_id
WHERE v.contest_id = 123
GROUP BY s.id, s.title, a.name
ORDER BY vote_count DESC
LIMIT 11;

-- Get JSON field data (bio)
SELECT 
  name,
  bio->>'content' AS bio_text
FROM artists
WHERE bio IS NOT NULL;
```

### Performance Optimization

```sql
-- Create index for faster queries
CREATE INDEX idx_concerts_date ON concerts(date);
CREATE INDEX idx_concerts_artist_id ON concerts(artist_id);
CREATE INDEX idx_artist_members_artist_id ON artist_members(artist_id);

-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM concerts
WHERE date >= CURRENT_DATE
ORDER BY date;

-- Vacuum and analyze (maintenance)
VACUUM ANALYZE concerts;
```

---

## Payload Collection Patterns

### Basic Collection

```typescript
export const Artists: CollectionConfig = {
  slug: 'artists',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true },
  ],
};
```

### Collection with Relationships

```typescript
export const Concerts: CollectionConfig = {
  slug: 'concerts',
  fields: [
    { name: 'date', type: 'date', required: true },
    {
      name: 'artist',
      type: 'relationship',
      relationTo: 'artists',
      required: true,
    },
    {
      name: 'venue',
      type: 'relationship',
      relationTo: 'venues',
      required: true,
    },
  ],
};
```

### Collection with Hooks

```typescript
export const Artists: CollectionConfig = {
  slug: 'artists',
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data.slug && data.name) {
          data.slug = slugify(data.name);
        }
        return data;
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true },
  ],
};
```

---

## Environment Variables

### Development (.env.local)

```bash
# Payload
PAYLOAD_SECRET=your-secret-key-here
DATABASE_URI=postgres://user:pass@localhost:5432/ynot_dev

# Payload Admin
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000

# Legacy MySQL (for migrations)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=ynot_site

# Media Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# External Services
SENTRY_DSN=https://your-sentry-dsn
```

### Production (Netlify Environment Variables)

```bash
# Payload
PAYLOAD_SECRET=production-secret
DATABASE_URI=postgres://user:pass@neon.host/ynot_prod

# Payload Admin
PAYLOAD_PUBLIC_SERVER_URL=https://api.ynotradio.net

# Media Storage
CLOUDINARY_CLOUD_NAME=ynotradio
CLOUDINARY_API_KEY=prod-key
CLOUDINARY_API_SECRET=prod-secret

# Monitoring
SENTRY_DSN=https://sentry-dsn
NEW_RELIC_LICENSE_KEY=newrelic-key
```

---

## Troubleshooting

### Common Issues

**Issue:** "Cannot connect to database"
```bash
# Check connection string
echo $DATABASE_URI

# Test connection
psql $DATABASE_URI -c "SELECT 1;"
```

**Issue:** "Payload Admin not loading"
```bash
# Check build
npm run payload:build

# Check server logs
npm run payload:serve --verbose
```

**Issue:** "Migration script failing"
```bash
# Check MySQL connection
mysql -h localhost -u root -p ynot_site -e "SELECT 1;"

# Check PostgreSQL connection
psql $DATABASE_URI -c "SELECT 1;"

# Run migration with verbose logging
DEBUG=* npm run import:artists
```

**Issue:** "Relationship not resolving"
```bash
# Check foreign keys
psql $DATABASE_URI -c "
  SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name
  FROM information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY';
"
```

---

## Next Steps

- Review [Migration Tasks](./04-migration-tasks.md) for implementation
- Check [Success Criteria](./07-success-criteria.md) for validation
- See [Frontend Cutover](./06-frontend-cutover.md) for deployment
