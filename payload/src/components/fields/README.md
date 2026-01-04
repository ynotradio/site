# MusicBrainz Custom Field Components

This directory contains custom Payload CMS field components for searching and selecting MusicBrainz entities.

## Components

### MusicBrainzArtistField

Custom field component for the Artists collection that allows searching and selecting MusicBrainz artists.

**Features:**
- Search for artists by name
- View artist type (Person, Group, etc.)
- See life span dates
- View disambiguation text
- Match scores for relevance

**Usage in collection:**
```typescript
{
  name: 'musicbrainzId',
  type: 'text',
  admin: {
    components: {
      Field: '/payload/src/components/fields/MusicBrainzArtistField#MusicBrainzArtistField',
    },
  },
}
```

### MusicBrainzReleaseField

Custom field component for the Records collection that allows searching and selecting MusicBrainz releases (albums).

**Features:**
- Search for releases by title or artist
- "Use Album Title" button to auto-fill search from form context
- View release type (Album, EP, Single, etc.)
- See artist credits
- View release date
- Match scores for relevance

**Usage in collection:**
```typescript
{
  name: 'musicbrainzId',
  type: 'text',
  admin: {
    components: {
      Field: '/payload/src/components/fields/MusicBrainzReleaseField#MusicBrainzReleaseField',
    },
  },
}
```

### MusicBrainzRecordingField

Custom field component for the Songs collection that allows searching and selecting MusicBrainz recordings (tracks).

**Features:**
- Search for recordings by title or artist
- "Use Song Title" button to auto-fill search from form context
- View track duration
- See artist credits
- View disambiguation text
- Match scores for relevance

**Usage in collection:**
```typescript
{
  name: 'musicbrainzId',
  type: 'text',
  admin: {
    components: {
      Field: '/payload/src/components/fields/MusicBrainzRecordingField#MusicBrainzRecordingField',
    },
  },
}
```

## Shared Utilities

### musicbrainz-api.ts

Frontend API client for MusicBrainz API with rate limiting and proper error handling.

**Functions:**
- `searchArtists(query, limit)` - Search for artists
- `searchReleases(title, artistName, limit)` - Search for releases
- `searchRecordings(title, artistName, limit)` - Search for recordings
- `formatDuration(ms)` - Format milliseconds to MM:SS

**Rate Limiting:**
- Automatically enforces MusicBrainz's 1 request/second limit
- Uses client-side rate limiting with promise delays

## Styling

All components share the same CSS file: `MusicBrainzField.css`

The styles use Payload's CSS variables for theming:
- `--theme-elevation-*` for backgrounds and borders
- `--theme-text` for text colors
- `--theme-error-*` for the clear button

## API Reference

### MusicBrainz API

**Base URL:** `https://musicbrainz.org/ws/2`

**Endpoints:**
- `/artist` - Search artists
- `/release` - Search releases (albums)
- `/recording` - Search recordings (tracks)

**Headers Required:**
```
User-Agent: YNotRadio/1.0.0 (https://ynotradio.org)
```

**Rate Limits:**
- 1 request per second
- Enforced automatically by the components

**Response Format:** JSON

## Development

### Adding to Collections

To add a MusicBrainz field to a collection:

1. Import the field component path in your collection config
2. Add a text field with the custom component:

```typescript
{
  name: 'musicbrainzId',
  type: 'text',
  unique: true,
  admin: {
    position: 'sidebar',
    description: 'MusicBrainz ID - Search and select from MusicBrainz',
    components: {
      Field: '/payload/src/components/fields/MusicBrainz[Type]Field#MusicBrainz[Type]Field',
    },
  },
}
```

3. The component will automatically handle search, selection, and value storage

### Testing

To test the components:

1. Start the Payload admin: `yarn payload:dev`
2. Navigate to Artists, Records, or Songs collection
3. Create or edit an entry
4. Look for the MusicBrainz ID field in the sidebar
5. Type to search and select an entity

## Troubleshooting

**"No results found"**
- Check your internet connection
- Verify search query is correct
- Try a more specific or less specific search

**"Rate limit exceeded"**
- The component enforces 1 request/second automatically
- Wait a moment and try again

**Field not showing up**
- Check that the component path is correct in the collection config
- Verify the file exists at the specified path
- Check browser console for errors

**TypeScript errors**
- Ensure `@payloadcms/ui` is installed
- Check that TypeScript paths are configured correctly

## Related Documentation

- [MUSICBRAINZ_INTEGRATION.md](../../../bin/migrations/MUSICBRAINZ_INTEGRATION.md) - Migration script integration
- [Payload Custom Components Docs](https://payloadcms.com/docs/admin/components)
- [MusicBrainz API Docs](https://musicbrainz.org/doc/MusicBrainz_API)
