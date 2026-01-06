# OnDemand PostgreSQL Read Model Implementation

## Overview

This document describes the PostgreSQL read model implementation for the On-Demand recordings page, following patterns established in PRs #153 (CD of the Week), #151 (DJs), and #155 (Schedule).

## Schema Design

### OnDemand Collection

The OnDemand collection uses a normalized relational structure:

```typescript
{
  date: date                      // Recording date
  image: upload → media           // Cloudinary-hosted image
  headline: text                  // Title of the recording
  note: richText                  // Description (Lexical editor)
  songs: relationship → songs[]   // Many-to-many with songs
  djs: relationship → djs[]       // Many-to-many with DJs
  artists: relationship → artists[] // Many-to-many with artists
  audioUrl: text                  // OpenDrive or other streaming ID
  source: text                    // Streaming platform (default: 'opendrive')
}
```

### Database Structure

**Main Table:** `ondemand`
- Standard fields: id, date, headline, audio_url, source, image_id
- Special fields:
  - `note`: jsonb (stores Lexical JSON)
  - `image_id`: foreign key to media table

**Junction Table:** `ondemand_rels`
- Connects ondemand records to songs, djs, and artists
- Fields: id, parent_id, path, songs_id, djs_id, artists_id, order
- `path` field distinguishes relationship type ('songs', 'djs', 'artists')

## PostgresOnDemand Implementation

### Key Features

#### 1. Cloudinary Image URLs
```php
$cloudinaryBase = "https://res.cloudinary.com/{$cloudName}/image/upload/c_fill,w_200,h_200,q_auto,f_auto/";

CASE 
    WHEN m.filename IS NOT NULL AND m.filename != '' 
    THEN '$cloudinaryBase' || m.filename
    ELSE COALESCE(m.legacy_url, '')
END as image
```

**Transformations:**
- `c_fill`: Crop and fill to exact dimensions
- `w_200,h_200`: 200x200 pixel output
- `q_auto`: Automatic quality optimization
- `f_auto`: Automatic format (WebP when supported)

#### 2. Relationship Aggregation

**Songs:**
```sql
SELECT string_agg(s.title, ', ' ORDER BY or_songs.order)
FROM ondemand_rels or_songs
JOIN songs s ON or_songs.songs_id = s.id
WHERE or_songs.parent_id = o.id AND or_songs.path = 'songs'
```

**DJs:**
```sql
SELECT string_agg(p.name, ', ' ORDER BY or_djs.order)
FROM ondemand_rels or_djs
JOIN djs d ON or_djs.djs_id = d.id
JOIN djs_rels dr ON d.id = dr.parent_id AND dr.path = 'person'
JOIN people p ON dr.people_id = p.id
WHERE or_djs.parent_id = o.id AND or_djs.path = 'djs'
```

**Artists:**
```sql
SELECT string_agg(a.name, ', ' ORDER BY or_artists.order)
FROM ondemand_rels or_artists
JOIN artists a ON or_artists.artists_id = a.id
WHERE or_artists.parent_id = o.id AND or_artists.path = 'artists'
```

#### 3. Lexical to Text Conversion

```php
private function lexicalToText(?string $lexicalJson): string {
    $data = json_decode($lexicalJson, true);
    // Extract text from root -> children -> text nodes
    // Handles paragraphs, links, formatted text
    return implode(' ', $text);
}
```

Converts Lexical JSON structure to plain text for PHP display compatibility.

### Method Overview

| Method | Purpose | Returns |
|--------|---------|---------|
| `getById($id)` | Fetch single recording with all relationships | array or null |
| `getAll($sort, $page, $limit)` | Paginated list with sorting | array |
| `getAllTextList()` | Simplified list (headline + date only) | array |
| `getAllForAdmin()` | Admin view with all fields | array |
| `getTotalCount()` | Total number of recordings | int |

## Feature Flag

Enable PostgreSQL queries via:
```
?ff=use_postgres_ondemand
```

Controlled in `src/config/features.php`:
```php
'use_postgres_ondemand' => false
```

## Migration Strategy

### Step 1: Run Payload Schema Migration
```bash
yarn payload migrate:create
```

This will create:
- Update `ondemand` table structure
- Create `ondemand_rels` junction table
- Convert `note` to jsonb
- Add `image_id` foreign key

### Step 2: Import Existing Data
```bash
yarn tsx bin/migrations/importOnDemand.ts --env dev
```

The import script will:
- Create media records for images
- Parse song/DJ/artist data
- Create relationship records
- Convert HTML notes to Lexical JSON

### Step 3: Test
```bash
# Test with feature flag
curl "http://localhost:8080/ondemand.php?ff=use_postgres_ondemand"

# Compare with MySQL
curl "http://localhost:8080/ondemand.php"
```

## Comparison with Other Collections

### Pattern Consistency

| Pattern | Shows | DJs | CD of Week | OnDemand |
|---------|-------|-----|------------|----------|
| Cloudinary URLs | ✅ | ✅ | ✅ | ✅ |
| Media JOIN | ✅ | ✅ | ✅ | ✅ |
| Junction Tables | ✅ | ✅ | - | ✅ |
| string_agg() | ✅ | ✅ | - | ✅ |
| Lexical→Text | ✅ | - | - | ✅ |

### Key Differences

**OnDemand Unique Features:**
- Three-way relationships (songs, djs, artists)
- Single junction table with path discrimination
- Lexical richText notes
- Audio streaming integration

**Similar to Shows:**
- Rich text notes
- Multiple relationships
- Date-based sorting

**Similar to DJs:**
- Person name aggregation via junction table
- Photo/image handling

**Similar to CD of the Week:**
- Cloudinary image transformations
- Legacy URL fallback

## Performance Considerations

### Query Optimization
- Subqueries for relationships keep result set size manageable
- string_agg() is efficient for small relationship sets
- LEFT JOIN on media prevents missing images from breaking queries
- Pagination limits memory usage

### Indexing Recommendations
```sql
CREATE INDEX idx_ondemand_date ON ondemand(date DESC);
CREATE INDEX idx_ondemand_headline ON ondemand(headline);
CREATE INDEX idx_ondemand_image ON ondemand(image_id);
CREATE INDEX idx_ondemand_rels_parent ON ondemand_rels(parent_id, path);
CREATE INDEX idx_ondemand_rels_songs ON ondemand_rels(songs_id);
CREATE INDEX idx_ondemand_rels_djs ON ondemand_rels(djs_id);
CREATE INDEX idx_ondemand_rels_artists ON ondemand_rels(artists_id);
```

## Testing Checklist

- [ ] Images display correctly (Cloudinary URLs)
- [ ] Songs list shows correctly
- [ ] DJ names display when present
- [ ] Artist names display when present
- [ ] Notes render as plain text
- [ ] Date formatting matches MySQL
- [ ] Pagination works correctly
- [ ] Sorting by date and headline works
- [ ] Text list view works
- [ ] Audio player loads correctly
- [ ] Empty/null fields handled gracefully

## Troubleshooting

### Images not loading
- Check CLOUDINARY_CLOUD_NAME environment variable
- Verify media table has filename populated
- Check legacy_url as fallback

### Relationships not showing
- Verify ondemand_rels records exist
- Check path field matches expected value
- Ensure junction tables are properly populated

### Note formatting issues
- Check note field is jsonb type
- Verify Lexical JSON structure is valid
- Test lexicalToText() conversion

## Future Improvements

1. **Caching**: Add Redis caching for frequently accessed recordings
2. **Full-text Search**: Add PostgreSQL full-text search on headline and note
3. **Analytics**: Track popular recordings, artists, songs
4. **Recommendations**: Suggest related recordings based on shared artists/songs
5. **API Endpoints**: Expose OnDemand data via REST/GraphQL API

## References

- PR #153: CD of the Week PostgreSQL implementation
- PR #151: DJs PostgreSQL implementation  
- PR #155: Schedule PostgreSQL implementation
- Payload CMS Documentation: https://payloadcms.com/docs
- Cloudinary Transformations: https://cloudinary.com/documentation/image_transformations
