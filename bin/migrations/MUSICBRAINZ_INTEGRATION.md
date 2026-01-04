# MusicBrainz Integration

## Overview

The YNot Radio site integrates with MusicBrainz in two ways:

1. **Migration Scripts**: During data import, the artist cleanup module uses the MusicBrainz API to intelligently determine whether ambiguous artist strings represent single artists or multiple artists.

2. **Admin UI**: Content managers can search and select MusicBrainz entities (artists, releases, recordings) directly in the Payload CMS admin interface using custom field components.

## Admin UI Integration

### Custom Field Components

The Payload CMS includes custom MusicBrainz field components for:

- **Artists Collection**: `MusicBrainzArtistField` - Search for artists/bands
- **Records Collection**: `MusicBrainzReleaseField` - Search for albums/releases  
- **Songs Collection**: `MusicBrainzRecordingField` - Search for recordings/tracks

### Features

- **Real-time Search**: Type to search MusicBrainz as you type (debounced)
- **Rich Results**: See artist type, disambiguation, dates, and match scores
- **Smart Context**: Release and recording searches can use the album/song title from the form
- **Clear Selection**: Easy to clear and re-search
- **Rate Limited**: Automatically respects MusicBrainz's 1 request/second limit

### Usage in Admin UI

1. Navigate to an Artist, Record, or Song in the Payload admin
2. Find the "MusicBrainz ID" field in the sidebar
3. Type in the search box to search MusicBrainz
4. Click a result to select it and populate the MBID field
5. The MBID is saved with the record

### Implementation

Field components are located in:
- `payload/src/components/fields/MusicBrainzArtistField.tsx`
- `payload/src/components/fields/MusicBrainzReleaseField.tsx`
- `payload/src/components/fields/MusicBrainzRecordingField.tsx`

API client utility:
- `payload/src/utils/musicbrainz-api.ts`

## Migration Scripts Integration

### How It Works

### Pattern Matching First
The system first attempts to match artist names using predefined patterns:
- Known single artists (Echo & The Bunnymen, Tegan and Sara, etc.)
- Generic patterns (Artist & The band, Artist + The band)

### MusicBrainz Fallback
For ambiguous cases that don't match known patterns, the system queries the MusicBrainz API:

1. **Rate Limiting**: Respects the 1 request/second limit
2. **Caching**: Results are cached in memory to avoid repeated API calls
3. **Score Threshold**: Only considers matches with score >= 85 as valid
4. **Exact Matching**: Compares artist names case-insensitively

## API Details

### Endpoint
```
https://musicbrainz.org/ws/2/artist?query=artist:"<name>"&fmt=json&limit=5
```

### Headers
```
User-Agent: YNotRadio/1.0.0 (https://ynotradio.org)
```

### Rate Limiting
- Maximum: 1 request per second
- Automatically enforced by the `waitForRateLimit()` function

## Usage

### Synchronous (No MusicBrainz)
```typescript
import { processArtistString } from './shared/artistCleaner';

const result = processArtistString('Echo & The Bunnymen');
// { customTitle: null, artistNames: ['Echo & The Bunnymen'] }
```

### Asynchronous (With MusicBrainz)
```typescript
import { processArtistStringAsync } from './shared/artistCleaner';

const result = await processArtistStringAsync('Simon & Garfunkel');
// Queries MusicBrainz if not in known patterns
// { customTitle: null, artistNames: ['Simon & Garfunkel'] }
```

## Examples

### Known Single Artists (No API Call)
- "Echo & The Bunnymen" → Matched by pattern, no API call
- "Tegan and Sara" → Matched by known list, no API call
- "Coheed and Cambria" → Matched by known list, no API call

### MusicBrainz Lookup
- "Simon & Garfunkel" → Not in patterns, queries MusicBrainz → Single artist
- "Belle and Sebastian" → Not in patterns, queries MusicBrainz → Single artist
- "Unknown Band and Another Band" → Not in patterns, queries MusicBrainz → Likely split into 2

### Definitely Multiple Artists (No API Call)
- "Guster & The Mountain Goats" → Pattern indicates 2 bands, no API call
- "Artist1, Artist2, and Artist3" → Commas indicate multiple, no API call

## Caching

The system maintains an in-memory cache of MusicBrainz lookups:

```typescript
import { clearArtistCache, getCacheStats } from './shared/musicbrainz';

// Clear cache
clearArtistCache();

// Get stats
const stats = getCacheStats();
console.log(stats.size); // Number of cached entries
console.log(stats.keys); // Array of cached artist names
```

## Benefits

1. **Reduces Brittleness**: No need to maintain a hardcoded list of every band
2. **Handles Edge Cases**: Can correctly identify obscure bands with conjunctions
3. **Respects Rate Limits**: Built-in rate limiting protects against API blocking
4. **Performance**: Caching ensures repeated lookups are instant
5. **Fail-Safe**: On API errors, falls back to splitting (safe default)

## Testing

Run MusicBrainz tests (note: makes real API calls):
```bash
npm run test -- bin/migrations/shared/musicbrainz.test.ts
```

Tests include:
- Finding well-known artists
- Handling artists with conjunctions
- Cache functionality
- Case-insensitive matching
- Handling non-existent artists

## Future Improvements

1. **Persistent Cache**: Store cache in a file or database to survive restarts
2. **Batch Lookups**: Group multiple lookups to reduce API calls
3. **Fuzzy Matching**: Handle slight name variations
4. **Type Detection**: Use MusicBrainz "type" field to distinguish person vs group
5. **Alias Support**: Check artist aliases for better matching
