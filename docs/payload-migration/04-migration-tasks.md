# Chapter 4: Migration Tasks

[← Back to Index](./README.md)

---

Each task below is designed to be **self-contained** for cold-start agent conversations. Tasks include all necessary context and can be completed independently.

---

## Task 0: Setup Payload + PostgreSQL Environment

**Status:** 🔲 Not Started  
**Depends On:** None  
**Estimated Effort:** Medium

**Context:**
Before migrating content, we need to set up the Payload CMS application with PostgreSQL (Neon) connection.

**Requirements:**
1. Install Payload CLI: `npx create-payload-app@latest`
2. Configure PostgreSQL connection (Neon)
3. Set up Netlify deployment configuration
4. Configure cloud storage for uploads (Cloudinary recommended)
5. Set up authentication and user roles

**Files to Create:**
- `payload/` (new directory)
- `payload/src/payload.config.ts` (main config)
- `payload/src/server.ts` (Express server)
- `netlify.toml` (Netlify Functions config)
- `.env.local` (local development)

**Acceptance Criteria:**
- [ ] Payload Admin UI accessible at http://localhost:3000/admin
- [ ] PostgreSQL connection successful
- [ ] Can create/edit users
- [ ] Media uploads work (local or cloud storage)
- [ ] `npm run payload migrate` generates schema

---

## Task 1: MySQL to PostgreSQL Schema Migration

**Status:** 🔲 Not Started  
**Depends On:** Task 0  
**Estimated Effort:** Large

**Context:**
Convert the existing MySQL database schema to PostgreSQL. This involves handling type differences, recreating indexes, and setting up foreign key constraints.

**Requirements:**
1. Export MySQL schema: `mysqldump --no-data ynot_site > schema.sql`
2. Convert data types (DATETIME → TIMESTAMP, TINYINT → BOOLEAN, etc.)
3. Recreate indexes with PostgreSQL syntax
4. Set up foreign key constraints
5. Add `deleted_at` columns for soft deletes
6. Add `created_at` and `updated_at` columns
7. Test schema in Neon PostgreSQL

**MySQL → PostgreSQL Type Conversions:**
```sql
-- MySQL
INT AUTO_INCREMENT PRIMARY KEY
VARCHAR(255)
TEXT, LONGTEXT
DATETIME
ENUM('a', 'b', 'c')
TINYINT(1)

-- PostgreSQL
SERIAL PRIMARY KEY
VARCHAR(255) or TEXT
TEXT
TIMESTAMP
TEXT with CHECK constraint or custom ENUM
BOOLEAN
```

**Files to Create:**
- `payload/migrations/001_initial_schema.sql`
- `payload/migrations/README.md` (migration docs)

**Acceptance Criteria:**
- [ ] PostgreSQL schema matches MySQL structure
- [ ] All foreign keys defined
- [ ] Indexes created for performance
- [ ] Soft delete columns added
- [ ] Schema validated with sample data

---

## Task 2: MySQL Data Migration to PostgreSQL

**Status:** 🔲 Not Started  
**Depends On:** Task 1  
**Estimated Effort:** Large

**Context:**
Export data from MySQL and import into PostgreSQL, handling data type conversions and encoding issues.

**Requirements:**
1. Export MySQL data: `mysqldump ynot_site > data.sql`
2. Convert SQL syntax (backticks to quotes, etc.)
3. Handle encoding (UTF-8 validation)
4. Convert datetime formats
5. Validate foreign key integrity
6. Run import: `psql -h neon.host -U user -d dbname < data_postgres.sql`
7. Verify record counts match

**Tools:**
- `pgloader` (automated MySQL → PostgreSQL migration)
- Custom migration scripts for complex transformations

**Files to Create:**
- `bin/migrations/mysql-to-postgres/convert.ts`
- `bin/migrations/mysql-to-postgres/validate.ts`

**Acceptance Criteria:**
- [ ] All tables migrated to PostgreSQL
- [ ] Record counts match (excluding soft-deleted)
- [ ] Foreign keys valid
- [ ] No encoding errors
- [ ] Sample queries return expected results

---

## Task 3: Create Media Upload Collection

**Status:** 🔲 Not Started  
**Depends On:** Task 0  
**Estimated Effort:** Small

**Context:**
Set up the Media collection for image uploads. This is a prerequisite for other collections that reference images.

**Requirements:**
1. Create `payload/src/collections/Media.ts`
2. Configure upload sizes (thumbnail, card, hero)
3. Set up cloud storage adapter (Cloudinary or S3)
4. Add alt text and caption fields
5. Test upload workflow

**Payload Collection:**
```typescript
export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: 'media',
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300 },
      { name: 'card', width: 768, height: 576 },
      { name: 'hero', width: 1600, height: 900 },
    ],
    mimeTypes: ['image/*'],
  },
  fields: [
    { name: 'alt', type: 'text' },
    { name: 'caption', type: 'text' },
  ],
};
```

**Acceptance Criteria:**
- [ ] Collection compiles without errors
- [ ] Can upload images in Payload Admin
- [ ] Images accessible via REST API
- [ ] Thumbnail generation works
- [ ] Cloud storage configured (if production)

---

## Task 4: Create People Collection

**Status:** 🔲 Not Started  
**Depends On:** Task 3 (Media)  
**Estimated Effort:** Small

**Context:**
The People collection stores individuals (musicians, DJs, etc.). This is a base collection referenced by DJs and Artists.

**Requirements:**
1. Create `payload/src/collections/People.ts`
2. Add fields: name, slug, bio (rich text), photo (upload), djRecord (relationship)
3. Add migration tracking fields: legacyId, migratedAt
4. Configure admin UI
5. Test CRUD operations

**Files to Create:**
- `payload/src/collections/People.ts`

**Acceptance Criteria:**
- [ ] Collection compiles without errors
- [ ] Can create/edit People in Payload Admin
- [ ] Photo upload works
- [ ] Slug auto-generated from name
- [ ] REST/GraphQL API functional

---

## Task 5: Create DJ Collection

**Status:** 🔲 Not Started  
**Depends On:** Task 4 (People)  
**Estimated Effort:** Small

**Context:**
The DJ collection extends People with DJ-specific information (show name, social links, on-air status).

**Requirements:**
1. Create `payload/src/collections/DJs.ts`
2. Add relationship to People collection
3. Add fields: showName, onAir, bio, socialLinks (JSON)
4. Add migration tracking fields
5. Test CRUD operations

**Files to Create:**
- `payload/src/collections/DJs.ts`

**Acceptance Criteria:**
- [ ] Collection compiles without errors
- [ ] Can create/edit DJs in Payload Admin
- [ ] Person reference works
- [ ] Social links (JSON field) stores multiple URLs

---

## Task 6: Create Artist Collection with Many-to-Many

**Status:** 🔲 Not Started  
**Depends On:** Task 4 (People), Task 3 (Media)  
**Estimated Effort:** Medium

**Context:**
The Artist collection stores bands/musicians with many-to-many relationships to People (members).

**Requirements:**
1. Create `payload/src/collections/Artists.ts`
2. Add many-to-many relationship to People (members)
3. Add fields: name, slug, bio, photo, website
4. Add migration tracking fields
5. Test many-to-many relationships

**PostgreSQL Join Table:**
```sql
CREATE TABLE artist_members (
  id SERIAL PRIMARY KEY,
  artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE,
  person_id INTEGER REFERENCES people(id) ON DELETE CASCADE,
  UNIQUE(artist_id, person_id)
);
```

**Payload Configuration:**
```typescript
{
  name: 'members',
  type: 'relationship',
  relationTo: 'people',
  hasMany: true,
}
```

**Acceptance Criteria:**
- [ ] Collection compiles without errors
- [ ] Can create/edit Artists in Payload Admin
- [ ] Can add/remove members (many-to-many)
- [ ] GraphQL query returns members with depth

---

## Task 7: Create Venue Collection

**Status:** 🔲 Not Started  
**Depends On:** Task 0  
**Estimated Effort:** Small

**Context:**
Venues are concert locations. Simple collection with name, address, and website.

**Requirements:**
1. Create `payload/src/collections/Venues.ts`
2. Add fields: name, slug, address, city, website
3. Add migration tracking fields
4. Test CRUD operations

**Acceptance Criteria:**
- [ ] Collection compiles without errors
- [ ] Can create/edit Venues in Payload Admin
- [ ] REST/GraphQL API functional

---

## Task 8: Create Concert Collection

**Status:** 🔲 Not Started  
**Depends On:** Task 6 (Artist), Task 7 (Venue)  
**Estimated Effort:** Medium

**Context:**
Concerts reference Artists and Venues. Include date, ticket info, and featured flag.

**Requirements:**
1. Create `payload/src/collections/Concerts.ts`
2. Add relationships to Artists and Venues
3. Add fields: date, ticketInfo, ticketUrl, featured
4. Add migration tracking fields
5. Test CRUD operations with relationships

**Acceptance Criteria:**
- [ ] Collection compiles without errors
- [ ] Can create/edit Concerts in Payload Admin
- [ ] Artist and Venue references required
- [ ] GraphQL query returns related data

---

## Task 9: Migrate Legacy Images to Cloud Storage

**Status:** 🔲 Not Started  
**Depends On:** Task 3 (Media)  
**Estimated Effort:** Large

**Context:**
Migrate images from MySQL URLs (Imgur, local filesystem) to Payload's Media collection with cloud storage.

**Requirements:**
1. Create `bin/migrations/importMedia.ts`
2. Download images from legacy URLs
3. Upload to Payload via API
4. Store mapping: legacy URL → Payload Media ID
5. Update references in other collections

**Files to Create:**
- `bin/migrations/importMedia.ts`
- `bin/migrations/shared/mediaImporter.ts`

**Acceptance Criteria:**
- [ ] All images uploaded to Payload Media collection
- [ ] Thumbnails generated
- [ ] Mapping file created (legacy ID → Payload ID)
- [ ] Images accessible via CDN

---

## Task 10: Migrate People/DJ Data

**Status:** 🔲 Not Started  
**Depends On:** Task 4 (People), Task 5 (DJs), Task 9 (Images)  
**Estimated Effort:** Medium

**Context:**
Migrate existing MySQL `people` and `djs` tables to Payload collections.

**Requirements:**
1. Create `bin/migrations/importPeople.ts`
2. Create `bin/migrations/importDJs.ts`
3. Convert HTML bios to TipTap JSON
4. Link photos using Media collection
5. Upsert by legacyId (idempotent)

**Files to Create:**
- `bin/migrations/importPeople.ts`
- `bin/migrations/importDJs.ts`

**Acceptance Criteria:**
- [ ] All people migrated to Payload
- [ ] All DJs migrated with Person references
- [ ] Bios converted to rich text
- [ ] Photos linked correctly

---

## Task 11: Migrate Concert Data

**Status:** 🔲 Not Started  
**Depends On:** Task 6 (Artists), Task 7 (Venues), Task 8 (Concerts)  
**Estimated Effort:** Medium

**Context:**
Migrate MySQL `concerts` table, creating Artists/Venues on-the-fly if needed.

**Requirements:**
1. Create `bin/migrations/importConcerts.ts`
2. Find or create Artist by name
3. Find or create Venue by name
4. Link to Media collection for images
5. Upsert by legacyId

**Files to Create:**
- `bin/migrations/importConcerts.ts`

**Acceptance Criteria:**
- [ ] All concerts migrated
- [ ] Artists created on-the-fly
- [ ] Venues created on-the-fly
- [ ] No orphaned references

---

## Task 12: Create Top 11 Collections with PostgreSQL Votes

**Status:** 🔲 Not Started  
**Depends On:** Task 6 (Artists), Songs collection  
**Estimated Effort:** Large

**Context:**
Create Top 11 contest collections with voting data stored in PostgreSQL (not a separate database).

**Requirements:**
1. Create `payload/src/collections/Top11Contests.ts`
2. Create `payload/src/collections/Top11Votes.ts` (voting data in same DB)
3. Create `payload/src/collections/Top11Results.ts`
4. Add relationship to Songs
5. Build voting API endpoints

**PostgreSQL Tables:**
```sql
CREATE TABLE top11_contests (...);
CREATE TABLE top11_contest_songs (...);  -- Many-to-many
CREATE TABLE top11_votes (...);
CREATE TABLE top11_results (...);
```

**Acceptance Criteria:**
- [ ] Contest collection functional
- [ ] Votes stored in PostgreSQL
- [ ] Can query vote counts with SQL JOIN
- [ ] Results published correctly

---

## Task 13: Create GraphQL/REST API Layer

**Status:** 🔲 Not Started  
**Depends On:** All collections  
**Estimated Effort:** Medium

**Context:**
Payload auto-generates REST and GraphQL APIs. This task involves customizing endpoints and adding custom resolvers.

**Requirements:**
1. Document REST endpoints for frontend
2. Create GraphQL schema documentation
3. Add custom endpoints for complex queries
4. Implement rate limiting
5. Add caching layer (Redis optional)

**Custom Endpoints Example:**
```typescript
// payload/src/endpoints/concerts.ts
export const concertsEndpoint = {
  path: '/concerts/upcoming',
  method: 'get',
  handler: async (req, res) => {
    const concerts = await req.payload.find({
      collection: 'concerts',
      where: {
        date: { greater_than_equals: new Date() },
      },
      depth: 2,
      limit: 10,
    });
    res.json(concerts);
  },
};
```

**Acceptance Criteria:**
- [ ] REST endpoints documented
- [ ] GraphQL schema documented
- [ ] Custom endpoints functional
- [ ] Rate limiting configured

---

## Task 14: Feature Flag Implementation

**Status:** 🔲 Not Started  
**Depends On:** Task 13 (APIs)  
**Estimated Effort:** Medium

**Context:**
Add feature flags to PHP site to gradually switch from MySQL to Payload API.

**Requirements:**
1. Create PHP feature flag utility
2. Create Payload API client wrapper
3. Update one page (e.g., concerts.php) to read from Payload
4. Compare output from both sources
5. Document flag configuration

**Files to Modify:**
- `src/partials/config.php` (add feature flags)
- `src/lib/PayloadClient.php` (create API client)
- `src/concerts.php` (read from Payload behind flag)

**Acceptance Criteria:**
- [ ] Feature flag toggles MySQL vs Payload
- [ ] Page renders correctly from both sources
- [ ] No visual differences

---

## Task 15: Netlify Deployment Setup

**Status:** 🔲 Not Started  
**Depends On:** Task 0, Task 13  
**Estimated Effort:** Medium

**Context:**
Deploy Payload to Netlify Functions with Neon PostgreSQL.

**Requirements:**
1. Create `netlify.toml` configuration
2. Set up Netlify Functions for Payload API
3. Configure environment variables (Neon connection string)
4. Set up build process
5. Configure custom domain

**Files to Create:**
- `netlify.toml`
- `netlify/functions/payload.ts` (serverless function)

**Acceptance Criteria:**
- [ ] Payload Admin accessible at https://admin.ynotradio.net
- [ ] Payload API accessible at https://api.ynotradio.net
- [ ] PostgreSQL connection works in production
- [ ] Build deploys automatically on push

---

## Task 16: Full Cutover and MySQL Archival

**Status:** 🔲 Not Started  
**Depends On:** Task 14 (Feature Flags)  
**Estimated Effort:** Small

**Context:**
Complete the migration by switching all feature flags and archiving MySQL.

**Requirements:**
1. Enable all feature flags (100% Payload)
2. Monitor error rates and performance
3. Backup MySQL database (final snapshot)
4. Remove MySQL dependencies from PHP
5. Document new workflows

**Acceptance Criteria:**
- [ ] All pages reading from Payload
- [ ] No MySQL queries in PHP code
- [ ] MySQL archived as read-only backup
- [ ] Documentation updated

---

## Summary

| Phase | Tasks | Estimated Effort |
|-------|-------|-----------------|
| Setup | 0-2 | Large |
| Collections | 3-8 | Medium |
| Migration | 9-11 | Large |
| Advanced Features | 12-13 | Large |
| Deployment | 14-16 | Medium |

**Total Estimated Effort:** 6-8 weeks for full migration

---

## Next Steps

- Start with [Task 0: Setup](./04-migration-tasks.md#task-0-setup-payload--postgresql-environment)
- Review [Architecture Decisions](./02-architecture-decisions.md) for patterns
- Check [Shared Utilities](./05-shared-utilities.md) for helper functions
