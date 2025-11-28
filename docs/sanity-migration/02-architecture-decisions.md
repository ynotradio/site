# Chapter 2: Architecture Decisions

[← Back to Index](./README.md)

---

## Data Handling

| Decision | Details |
|----------|---------|
| **Soft Deletes** | Use Sanity's draft/published state instead of `deleted` field |
| **Data Validation** | Fail on issues, generate report for manual review—no auto-cleaning |
| **Rich Text** | Convert HTML to Sanity Portable Text format |
| **Images** | Migrate to Sanity asset pipeline whenever possible |
| **Historical Data** | Keep going forward; don't migrate old tournament data |

---

## Content Model: Artist

The `artist` type is the generic content type for bands/musicians. Key features:

```
Artist
├── name: string
├── slug: slug
├── photo: image
├── bio: portableText
├── website: url
├── members: reference[] → Person (many-to-many)
└── _legacyId: number (read-only)
```

**Rules:**
- Artists cannot be deleted/unpublished once associated with published content (posts, music, top 11, MRM matches)
- Multiple artists can be "teamed up" for MRM (e.g., Jack White/White Stripes)
- People can be members of multiple artists (e.g., Damon Albarn → solo, Gorillaz, Blur)

---

## Content Model: Person

Extends the existing `person` schema:

```
Person
├── name: string
├── slug: slug
├── photo: image
├── bio: portableText
├── djRecord: reference → DJ (if they've been a guest DJ)
└── _legacyId: number (read-only)
```

---

## Base Document Fields

All migrated documents should include:

```typescript
{
  name: '_legacyId',
  title: 'Legacy ID',
  type: 'number',
  description: 'Original MySQL ID for reference',
  readOnly: true,
},
{
  name: '_migratedAt',
  title: 'Migrated At',
  type: 'datetime',
  description: 'When the record was migrated',
  readOnly: true,
}
```

---

## Key Principles

1. **No fallback strings** - All references (Artist, DJ, Venue) are required. Migrations must create records or fail with a report.
2. **Use references** - Don't duplicate data. Concert gets artist image/URL from the Artist record.
3. **Fail fast** - Validation errors create reports for manual review rather than auto-cleaning.
