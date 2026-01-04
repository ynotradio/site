# Chapter 3: Core Data Models

[← Back to Index](./README.md)

---

## Priority Order

**Last Updated:** January 4, 2026

| Priority | Collection | PostgreSQL Table | Status | Notes |
|----------|-----------|------------------|--------|-------|
| 1 | People | `people` | ✅ Complete | Base collection for individuals |
| 2 | DJs | `djs` | ✅ Complete | References People collection, supports multi-person DJs |
| 3 | Artists | `artists` | ✅ Complete | Musicians/bands with MusicBrainz integration |
| 4 | Venues | `venues` | ✅ Complete | Concert locations |
| 5 | Media | `media` | ✅ Complete | Upload collection with Cloudinary integration |
| 6 | Ads | `ads` | ✅ Complete | Sponsor/advertisement data |
| 7 | Concerts | `concerts` | ✅ Complete | References Artists and Venues |
| 8 | Songs | `songs` | ✅ Complete | Music catalog with MusicBrainz integration |
| 9 | Records | `records` | ✅ Complete | Albums (used by CD of the Week) with MusicBrainz |
| 10 | CdOfTheWeek | `cd_of_the_week` | ✅ Complete | Album reviews referencing Records |
| 11 | OnDemand | `on_demand` | ✅ Complete | Audio content referencing Artists/DJs |
| 12 | Shows | `shows` | ✅ Complete | Schedule entries referencing DJs |
| 13 | Posts | `posts` | ✅ Complete | Content blocks (unified Story + CustomText) |
| 14 | Users | `users` | ✅ Complete | Authentication and admin access |
| 15 | YearEndPollResults | `year_end_poll_results` | ✅ Complete | Published results pages (Top 225, Staff Picks) - [Docs](./13-year-end-poll-results.md) |
| 16 | Top11Contests | `top11_contests` | 🔲 Todo | Weekly contest config |
| 17 | Top11Results | `top11_results` | 🔲 Todo | Published weekly results |
| 18 | Top11Votes | `top11_votes` | 🔲 Todo | User votes (PostgreSQL native, not NoSQL) |
| 19 | YearEndPolls | `year_end_polls` | 🔲 Todo | Annual poll config |
| 20 | YearEndPollCategories | `year_end_poll_categories` | 🔲 Todo | Poll categories |
| 21 | YearEndPollVotes | `year_end_poll_votes` | 🔲 Todo | User votes (PostgreSQL native) |
| 22 | ModernRockMadnessTournaments | `modern_rock_madness_tournaments` | 🔲 Todo | Tournament config |
| 23 | ModernRockMadnessGroups | `modern_rock_madness_groups` | 🔲 Todo | Tournament participants |
| 24 | ModernRockMadnessMatches | `modern_rock_madness_matches` | 🔲 Todo | Bracket matchups |
| 25 | ModernRockMadnessVotes | `modern_rock_madness_votes` | 🔲 Todo | User votes (PostgreSQL native) |

### Summary
- **Completed:** 15 collections (all core content types + Year End Poll Results)
- **Remaining:** 10 collections (voting/tournament systems)

---

## Key Difference: Voting Data in PostgreSQL

Unlike the Sanity migration (which stores votes in a separate Neon database), the Payload approach can store **all data in a single PostgreSQL database**. This simplifies:

- **Data consistency**: Single database with ACID transactions
- **Queries**: Join votes with contests/polls using SQL
- **Backups**: One database to backup
- **Development**: One connection string

**Example: Top 11 Votes Table**
```sql
CREATE TABLE top11_votes (
  id SERIAL PRIMARY KEY,
  contest_id INTEGER REFERENCES top11_contests(id) ON DELETE CASCADE,
  song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
  user_id VARCHAR(255),  -- Session ID or authenticated user
  ip_address INET,
  user_agent TEXT,
  voted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(contest_id, user_id)  -- One vote per user per contest
);

CREATE INDEX idx_top11_votes_contest ON top11_votes(contest_id);
CREATE INDEX idx_top11_votes_song ON top11_votes(song_id);
CREATE INDEX idx_top11_votes_user ON top11_votes(user_id);
```

---

## Collection Dependencies

```
People ──────────────────────────────────────────┐
   │                                              │
   └─→ DJs ←────────────────────────────┐        │
                                         │        │
Artists ←─┬── Concerts (+ Venues)        │        │
          ├── Songs (+ Records)          │        │
          ├── CdOfTheWeek (via Records)  │        │
          └── OnDemand ─────────────────┤        │
                                         │        │
Shows ───────────────────────────────────┘        │
```

---

## PostgreSQL Schema Overview

### Core Content Tables

```sql
-- People (individuals)
CREATE TABLE people (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  bio JSONB,
  photo_id INTEGER REFERENCES media(id),
  dj_id INTEGER REFERENCES djs(id),
  legacy_id INTEGER UNIQUE,
  migrated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- DJs (radio hosts)
CREATE TABLE djs (
  id SERIAL PRIMARY KEY,
  person_id INTEGER REFERENCES people(id) ON DELETE CASCADE,
  show_name VARCHAR(255),
  on_air BOOLEAN DEFAULT true,
  bio JSONB,
  social_links JSONB,  -- {twitter: "...", instagram: "..."}
  legacy_id INTEGER UNIQUE,
  migrated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Artists (bands/musicians)
CREATE TABLE artists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  bio JSONB,
  photo_id INTEGER REFERENCES media(id),
  website TEXT,
  legacy_id INTEGER UNIQUE,
  migrated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Artist members (many-to-many)
CREATE TABLE artist_members (
  id SERIAL PRIMARY KEY,
  artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE,
  person_id INTEGER REFERENCES people(id) ON DELETE CASCADE,
  UNIQUE(artist_id, person_id)
);

-- Venues (concert locations)
CREATE TABLE venues (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  address TEXT,
  city VARCHAR(255),
  website TEXT,
  legacy_id INTEGER UNIQUE,
  migrated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Concerts
CREATE TABLE concerts (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE,
  venue_id INTEGER REFERENCES venues(id) ON DELETE RESTRICT,
  ticket_info TEXT,
  ticket_url TEXT,
  featured BOOLEAN DEFAULT false,
  legacy_id INTEGER UNIQUE,
  migrated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Songs
CREATE TABLE songs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  stream_url TEXT,
  release_date DATE,
  feature_on_new_music BOOLEAN DEFAULT false,
  legacy_id INTEGER UNIQUE,
  migrated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Song artists (many-to-many)
CREATE TABLE song_artists (
  id SERIAL PRIMARY KEY,
  song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
  artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE,
  UNIQUE(song_id, artist_id)
);

-- Records (albums)
CREATE TABLE records (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE,
  label VARCHAR(255),
  release_date DATE,
  cover_id INTEGER REFERENCES media(id),
  legacy_id INTEGER UNIQUE,
  migrated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- CD of the Week (album reviews)
CREATE TABLE cd_of_the_week (
  id SERIAL PRIMARY KEY,
  record_id INTEGER REFERENCES records(id) ON DELETE CASCADE,
  review JSONB,  -- TipTap rich text
  reviewer VARCHAR(255),
  date DATE,
  legacy_id INTEGER UNIQUE,
  migrated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Contest/Poll Tables with Votes

### Top 11 Contest

```sql
CREATE TABLE top11_contests (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  date DATE NOT NULL,
  voting_opens_at TIMESTAMP,
  voting_closes_at TIMESTAMP,
  summary JSONB,  -- Rich text
  status VARCHAR(50) DEFAULT 'draft',  -- draft, open, closed, archived
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE top11_contest_songs (
  id SERIAL PRIMARY KEY,
  contest_id INTEGER REFERENCES top11_contests(id) ON DELETE CASCADE,
  song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
  display_order INTEGER,
  UNIQUE(contest_id, song_id)
);

CREATE TABLE top11_votes (
  id SERIAL PRIMARY KEY,
  contest_id INTEGER REFERENCES top11_contests(id) ON DELETE CASCADE,
  song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
  user_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  voted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(contest_id, user_id)
);

CREATE TABLE top11_results (
  id SERIAL PRIMARY KEY,
  contest_id INTEGER REFERENCES top11_contests(id) ON DELETE CASCADE,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE top11_result_placements (
  id SERIAL PRIMARY KEY,
  result_id INTEGER REFERENCES top11_results(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
  artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE,
  note TEXT,
  UNIQUE(result_id, rank)
);
```

---

## Legend

| Status | Meaning |
|--------|---------|
| ✅ Done | Collection created and migration complete |
| 🔲 Todo | Not started |
| 🚧 In Progress | Work has begun |
| ⚠️ Blocked | Waiting on dependency |
| ⏸️ Later | Deferred to future PR |

---

## Payload Collection Examples

### People Collection

```typescript
import { CollectionConfig } from 'payload/types';

export const People: CollectionConfig = {
  slug: 'people',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'bio',
      type: 'richText',
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'djRecord',
      type: 'relationship',
      relationTo: 'djs',
      admin: {
        description: 'Link to DJ profile if this person is/was a guest DJ',
      },
    },
    {
      name: 'legacyId',
      type: 'number',
      unique: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'migratedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
};
```

### Artists Collection with Many-to-Many

```typescript
export const Artists: CollectionConfig = {
  slug: 'artists',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'bio',
      type: 'richText',
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'website',
      type: 'text',
    },
    {
      name: 'members',
      type: 'relationship',
      relationTo: 'people',
      hasMany: true,
      admin: {
        description: 'Band members (many-to-many)',
      },
    },
    {
      name: 'legacyId',
      type: 'number',
      unique: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'migratedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
};
```

---

## Query Examples

### REST API

```bash
# Get all artists
GET /api/artists

# Get single artist with members
GET /api/artists/{id}?depth=2

# Get concerts with artist and venue
GET /api/concerts?depth=2&where[date][greater_than_equals]=2025-01-01

# Search artists by name
GET /api/artists?where[name][like]=Beatles
```

### GraphQL

```graphql
query {
  Artists {
    docs {
      id
      name
      slug
      bio
      members {
        name
        slug
      }
    }
  }
}

query {
  Concerts(where: { date: { greater_than_equals: "2025-01-01" } }) {
    docs {
      date
      artist {
        name
        photo {
          url
        }
      }
      venue {
        name
        city
      }
    }
  }
}
```

---

## Next Steps

- Learn how to [query PostgreSQL from PHP](./03.5-php-postgresql-querying.md) directly
- Review [Migration Tasks](./04-migration-tasks.md) for implementation steps
- Check [Architecture Decisions](./02-architecture-decisions.md) for patterns
- See [Relational Advantages](./09-relational-advantages.md) for SQL benefits
