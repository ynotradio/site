# Chapter 2: Architecture Decisions

[← Back to Index](./README.md)

---

## Data Handling

| Decision | Details |
|----------|---------|
| **Soft Deletes** | Use PostgreSQL `deleted_at` timestamp column (standard pattern) |
| **Data Validation** | Fail on issues, generate report for manual review—no auto-cleaning |
| **Rich Text** | Convert HTML to TipTap JSON format (Lexical also supported) |
| **Images** | Use Payload's upload collections with cloud storage (Cloudinary recommended) - See [Chapter 12](./12-cloudinary-integration.md) |
| **Historical Data** | Keep going forward; don't migrate old tournament data |
| **Relationships** | Use PostgreSQL foreign keys + Payload relationship fields |

---

## PostgreSQL Schema Patterns

### Base Table Columns

All migrated tables should include:

```sql
CREATE TABLE artists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  bio JSONB,  -- TipTap rich text stored as JSON
  photo_url TEXT,
  website TEXT,
  legacy_id INTEGER UNIQUE,  -- Original MySQL ID
  migrated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP  -- NULL = active, non-NULL = soft deleted
);

CREATE INDEX idx_artists_legacy_id ON artists(legacy_id);
CREATE INDEX idx_artists_deleted_at ON artists(deleted_at);
```

### Relationship Patterns

**One-to-Many** (Concert → Venue):
```sql
CREATE TABLE concerts (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE,
  venue_id INTEGER REFERENCES venues(id) ON DELETE RESTRICT,
  ticket_info TEXT,
  ticket_url TEXT,
  featured BOOLEAN DEFAULT false
);

CREATE INDEX idx_concerts_artist_id ON concerts(artist_id);
CREATE INDEX idx_concerts_venue_id ON concerts(venue_id);
```

**Many-to-Many** (Artist → Person):
```sql
CREATE TABLE artist_members (
  id SERIAL PRIMARY KEY,
  artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE,
  person_id INTEGER REFERENCES people(id) ON DELETE CASCADE,
  UNIQUE(artist_id, person_id)
);

CREATE INDEX idx_artist_members_artist ON artist_members(artist_id);
CREATE INDEX idx_artist_members_person ON artist_members(person_id);
```

---

## Payload Collection Configuration

### Base Collection Fields

All collections should include these standard fields:

```typescript
import { CollectionConfig } from 'payload/types';

export const Artists: CollectionConfig = {
  slug: 'artists',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
  },
  access: {
    read: () => true,  // Public read
    create: ({ req: { user } }) => !!user,  // Authenticated write
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
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
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.name) {
              return slugify(data.name);
            }
            return value;
          },
        ],
      },
    },
    {
      name: 'bio',
      type: 'richText',
      editor: lexicalEditor(),  // or slateEditor()
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'website',
      type: 'text',
      validate: (value) => {
        if (value && !isValidUrl(value)) {
          return 'Must be a valid URL';
        }
        return true;
      },
    },
    {
      name: 'members',
      type: 'relationship',
      relationTo: 'people',
      hasMany: true,
    },
    // Migration tracking fields
    {
      name: 'legacyId',
      type: 'number',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      unique: true,
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
  timestamps: true,  // Adds createdAt and updatedAt
};
```

---

## Rich Text Conversion

### HTML → TipTap JSON

**Legacy HTML**:
```html
<p>This is a <strong>bold</strong> statement with a <a href="https://example.com">link</a>.</p>
```

**TipTap JSON**:
```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "This is a " },
        {
          "type": "text",
          "marks": [{ "type": "bold" }],
          "text": "bold"
        },
        { "type": "text", "text": " statement with a " },
        {
          "type": "text",
          "marks": [
            {
              "type": "link",
              "attrs": { "href": "https://example.com" }
            }
          ],
          "text": "link"
        },
        { "type": "text", "text": "." }
      ]
    }
  ]
}
```

Use libraries like `@tiptap/html` or `html-to-tiptap` for conversion.

---

## Upload Collections

### Media Collection

```typescript
export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: 'media',  // Local dev
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 576,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1600,
        height: 900,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
    // For production, use cloud storage adapter
    // See Chapter 12 for detailed Cloudinary integration:
    // https://github.com/ynotradio/site/docs/payload-migration/12-cloudinary-integration.md
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
    {
      name: 'caption',
      type: 'text',
    },
  ],
};
```

**Note:** For complete Cloudinary integration including setup, migration scripts, and best practices, see [Chapter 12: Cloudinary Integration](./12-cloudinary-integration.md).

---

## Key Principles

1. **Leverage PostgreSQL**: Use foreign keys, indexes, and constraints for data integrity
2. **Use Payload hooks**: Transform data before save (slugs, timestamps, validation)
3. **Type safety**: Define collections in TypeScript, generate types automatically
4. **REST + GraphQL**: No custom query language needed
5. **Fail fast**: Validation errors create reports for manual review

---

## Content Model: Artist

The `artist` collection is the generic type for bands/musicians.

**PostgreSQL Table**:
```sql
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
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

**Payload Collection**:
```typescript
export const Artists: CollectionConfig = {
  slug: 'artists',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'bio', type: 'richText' },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'website', type: 'text' },
    {
      name: 'members',
      type: 'relationship',
      relationTo: 'people',
      hasMany: true,
    },
    { name: 'legacyId', type: 'number', unique: true, admin: { readOnly: true } },
    { name: 'migratedAt', type: 'date', admin: { readOnly: true } },
  ],
  timestamps: true,
};
```

**Rules:**
- Artists cannot be deleted once associated with published content
- Multiple artists can be "teamed up" for contests
- People can be members of multiple artists

---

## Content Model: Person

**PostgreSQL Table**:
```sql
CREATE TABLE people (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  bio JSONB,
  photo_id INTEGER REFERENCES media(id),
  dj_id INTEGER REFERENCES djs(id),  -- If they've been a guest DJ
  legacy_id INTEGER UNIQUE,
  migrated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Payload Collection**:
```typescript
export const People: CollectionConfig = {
  slug: 'people',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'bio', type: 'richText' },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    {
      name: 'djRecord',
      type: 'relationship',
      relationTo: 'djs',
    },
    { name: 'legacyId', type: 'number', unique: true, admin: { readOnly: true } },
    { name: 'migratedAt', type: 'date', admin: { readOnly: true } },
  ],
  timestamps: true,
};
```

---

## PostgreSQL vs MySQL Type Mapping

| MySQL Type | PostgreSQL Type | Notes |
|------------|----------------|-------|
| `INT` | `INTEGER` / `SERIAL` | SERIAL for auto-increment |
| `VARCHAR(n)` | `VARCHAR(n)` / `TEXT` | TEXT for unlimited length |
| `TEXT` | `TEXT` | Same |
| `DATETIME` | `TIMESTAMP` | PostgreSQL has better timezone support |
| `LONGTEXT` | `TEXT` | PostgreSQL TEXT is unlimited |
| `ENUM` | `TEXT` with CHECK | Or create custom ENUM type |
| `JSON` | `JSONB` | JSONB is faster and supports indexing |
| `TINYINT(1)` | `BOOLEAN` | MySQL uses TINYINT for booleans |

---

## Validation Commands

```bash
# Validate Payload config
npm run payload validate

# Type check collections
npx tsc --noEmit

# Database migration (Payload auto-generates based on collections)
npm run payload migrate

# Seed database
npm run payload seed
```

---

## Next Steps

- Review [Core Data Models](./03-core-data-models.md) for collection priorities
- Check [Migration Tasks](./04-migration-tasks.md) for implementation steps
- See [Cloudinary Integration](./12-cloudinary-integration.md) for media storage setup
- See [Relational Advantages](./09-relational-advantages.md) for PostgreSQL benefits
