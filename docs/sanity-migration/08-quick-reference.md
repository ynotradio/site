# Chapter 8: Quick Reference

[← Back to Index](./README.md)

---

## Run Migrations

```bash
# Install dependencies
npm install

# Run specific migration
npm run import:deejays
npm run import:ads
npm run import:concerts
# etc.
```

---

## Sanity Studio

```bash
# Start dev server
npm run sanity:dev

# Build for production
npm run sanity:build

# Deploy
npm run sanity:deploy

# Validate schema configuration
npm run sanity:schema-validate

# Validate documents against schema rules
npm run sanity:validate
```

---

## Useful GROQ Queries

```groq
// Count documents by type
*[_type == "artist"] | length

// Find documents missing legacyId
*[_type == "artist" && !defined(legacyId)]

// Find documents by legacy ID (hardcoded example)
*[_type == "artist" && legacyId == 123][0]

// Parameterized version (for use in code)
// client.fetch('*[_type == $docType && legacyId == $id][0]', { docType: 'artist', id: 123 })

// Find all artists with no members
*[_type == "artist" && length(members) == 0]

// Find all concerts for a specific artist
*[_type == "concert" && artist._ref == "artist-id"]

// Get all document types and counts
{
  "artists": count(*[_type == "artist"]),
  "concerts": count(*[_type == "concert"]),
  "music": count(*[_type == "music"]),
  "djs": count(*[_type == "dj"])
}
```

---

## MySQL Queries

```sql
-- Count active records
SELECT COUNT(*) FROM artists WHERE deleted != 'y';

-- Find records by legacy ID
SELECT * FROM artists WHERE id = 123;

-- Compare counts
SELECT 
  (SELECT COUNT(*) FROM artists WHERE deleted != 'y') as artists,
  (SELECT COUNT(*) FROM concerts WHERE deleted != 'y') as concerts,
  (SELECT COUNT(*) FROM music WHERE deleted != 'y') as music;
```

---

## Environment Setup

Required environment variables in `bin/migrations/.env`:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ynot_site

# Sanity
SANITY_PROJECT_ID=otcmx0q6
SANITY_DATASET=production
SANITY_API_TOKEN=your-token-here
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| SchemaError with no details | Check for: (1) field names starting with `_`, (2) orderings referencing fields from referenced documents, (3) array items not wrapped with `defineArrayMember()` |
| Image upload fails | Check URL accessibility, may need to download first |
| Reference not found | Run dependency migration first (e.g., Artist before Concert) |
| Duplicate records | Check `legacyId` uniqueness |
| HTML encoding issues | Use `richTextConverter` utility |
| Timeout on large batch | Reduce batch size, add delays |
