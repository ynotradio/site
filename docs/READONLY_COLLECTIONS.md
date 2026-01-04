# Read-Only Data Collections - PostgreSQL Schema

**Status:** ✅ All collections implemented (Nov-Dec 2025)  
**Last Updated:** January 4, 2026

This document describes the Payload CMS collections created for all read-only data on the Y-Not Radio site. These collections exclude interactive features like Top 11, Modern Rock Madness, and Year End Poll, which are planned for future implementation.

---

## Created Collections

### Core Collections

#### 1. People (`people`)
Stores individuals (musicians, DJs, etc.)

**Fields:**
- `name` (text, required, indexed)
- `slug` (text, required, unique, indexed)
- `bio` (richText)
- `photo` (relationship to media)
- `djRecord` (relationship to djs)
- `legacyId` (number, unique) - MySQL migration tracking
- `migratedAt` (date) - Migration timestamp

#### 2. DJs (`djs`)
Radio hosts and show information

**Fields:**
- `person` (relationship to people)
- `description` (richText - description of show(s) hosted)
- `email` (email)
- `externalConnectText` (text)
- `externalConnectUrl` (text)
- `photo` (relationship to media)
- `onAir` (checkbox, default: true)
- `sortOrder` (number)
- `legacyId` (number, unique)
- `migratedAt` (date)

#### 3. Artists (`artists`)
Musicians, bands, and music groups

**Fields:**
- `name` (text, required, indexed)
- `slug` (text, required, unique, indexed)
- `bio` (richText)
- `photo` (relationship to media)
- `website` (text)
- `members` (relationship to people, many-to-many)
- `legacyId` (number, unique)
- `migratedAt` (date)

#### 4. Venues (`venues`)
Concert locations

**Fields:**
- `name` (text, required, indexed)
- `slug` (text, required, unique, indexed)
- `address` (text)
- `city` (text, indexed)
- `website` (text)
- `legacyId` (number, unique)
- `migratedAt` (date)

### Content Collections

#### 5. Ads (`ads`)
Sponsor and advertisement data

**Fields:**
- `name` (text, required)
- `startDate` (date, required)
- `endDate` (date, required)
- `image` (relationship to media)
- `imageUrl` (text) - Legacy URL
- `webUrl` (text)
- `priority` (number, default: 0)
- `legacyId` (number, unique)
- `migratedAt` (date)

#### 6. Songs (`songs`)
Music catalog

**Fields:**
- `title` (text, required, indexed)
- `slug` (text, unique, indexed)
- `artist` (relationship to artists)
- `streamUrl` (text)
- `releaseDate` (date)
- `featureOnNewMusic` (checkbox, default: false)
- `legacyId` (number, unique)
- `migratedAt` (date)

#### 7. Records (`records`)
Albums and releases

**Fields:**
- `title` (text, required, indexed)
- `slug` (text, unique, indexed)
- `artist` (relationship to artists, required)
- `label` (text)
- `releaseDate` (date)
- `coverImage` (relationship to media)
- `legacyId` (number, unique)
- `migratedAt` (date)

### Feature Collections

#### 8. Concerts (`concerts`)
Concert and event listings

**Fields:**
- `date` (date, required, indexed)
- `artist` (relationship to artists, required)
- `venue` (relationship to venues, required)
- `ticketInfo` (textarea)
- `ticketUrl` (text)
- `featured` (checkbox, default: false)
- `legacyId` (number, unique)
- `migratedAt` (date)

#### 9. OnDemand (`ondemand`)
Audio content for streaming

**Fields:**
- `title` (text, required, indexed)
- `artist` (relationship to artists)
- `streamUrl` (text, required)
- `legacyId` (number, unique)
- `migratedAt` (date)

#### 10. Shows (`shows`)
Show schedule entries

**Fields:**
- `date` (date, required, indexed)
- `day` (select: monday-sunday, required)
- `startTime` (text, required)
- `endTime` (text, required)
- `host` (relationship to djs, required)
- `note` (textarea)
- `legacyId` (number, unique)
- `migratedAt` (date)

#### 11. Posts (`posts`)
Content blocks (unified Story + CustomText from legacy)

**Fields:**
- `headline` (text, required, max 100 chars)
- `startDate` (date, required)
- `endDate` (date, required)
- `content` (richText, required)
- `image` (relationship to media)
- `imageUrl` (text) - Legacy URL
- `priority` (number, default: 0)
- `legacyId` (number, unique)
- `migratedAt` (date)

#### 12. CdOfTheWeek (`cdoftheweek`)
Album reviews

**Fields:**
- `record` (relationship to records, required)
- `review` (richText, required)
- `reviewer` (text)
- `date` (date, required, indexed)
- `legacyId` (number, unique)
- `migratedAt` (date)

## PostgreSQL Schema

When `payload migrate` is run, Payload will automatically generate PostgreSQL tables for each collection with the following characteristics:

### Automatic Features
- All collections get `id` (SERIAL PRIMARY KEY)
- All collections get `createdAt` and `updatedAt` timestamps
- Indexes are created on fields marked with `index: true`
- Unique constraints on fields marked with `unique: true`
- Foreign key relationships for `relationship` fields
- Join tables for `hasMany` relationships (e.g., artist_members)

### Database Relationships
```
People ──────────────────────────────────────────┐
   │                                              │
   └─→ DJs ←────────────────────────────┐        │
                                         │        │
Artists ←─┬── Concerts (+ Venues)       │        │
          ├── Songs                     │        │
          ├── Records                   │        │
          ├── CdOfTheWeek (via Records) │        │
          └── OnDemand ─────────────────┤        │
                                         │        │
Shows ───────────────────────────────────┘        │
                                                  │
Media ←──────────────────────────────────────────┘
(Used by: People, DJs, Artists, Ads, Posts, Records)
```

## Access Control

All collections have the following access control pattern:
- **Read**: Public (anyone can read)
- **Create**: Authenticated users only
- **Update**: Admin and Editor roles (DJs can update their own collections)
- **Delete**: Admin role only

## Migration Support

All collections include:
- `legacyId`: Original MySQL ID for tracking migrated records
- `migratedAt`: Timestamp when record was migrated from MySQL

These fields support idempotent migration (safe to re-run) by allowing upsert operations based on `legacyId`.

## Next Steps

1. Run `npm run payload:migrate` to generate PostgreSQL schema
2. Verify tables are created in Neon database
3. Test CRUD operations in Payload Admin UI at http://localhost:3000/admin
4. Begin data migration from MySQL using migration scripts

## Excluded Collections

The following interactive features are explicitly excluded from this implementation:
- Top 11 (contests, votes, results)
- Modern Rock Madness (tournaments, matches, votes)
- Year End Poll (polls, categories, votes)

These will be implemented in separate tasks as they require user interaction and voting functionality.
