# MusicBrainz Smart Linking Components

Custom Sanity input components that provide smart search and linking to MusicBrainz for artist, song, and record entities.

## Components

### MusicBrainzArtistInput
Links artists to MusicBrainz Artist IDs (MBIDs).
- Searches using the artist's **name** field

### MusicBrainzSongInput
Links songs to MusicBrainz Recording IDs (MBIDs).
- Searches using the song's **title** + first **artist's name**
- Shows recording length, disambiguation, and artist credits

### MusicBrainzRecordInput
Links records (albums) to MusicBrainz Release IDs (MBIDs).
- Searches using the record's **title** + first **artist's name**
- Shows release type (Album/EP/Single), year, country, and disambiguation

## Features

- **Smart Search**: Automatically combines relevant fields for better search results
- **Rich Results**: Displays detailed information to help identify the correct match
- **Match Scoring**: Shows relevance scores for search results
- **One-Click Linking**: Select an item from search results to auto-populate the MBID
- **Manual Entry**: Option to manually enter MusicBrainz IDs if needed
- **Linked State**: When linked, shows the MBID with a direct link to MusicBrainz
- **Validation**: UUID format validation for all MusicBrainz IDs

## Usage

The components are integrated into the respective schemas:
- **Artist**: `artist.musicbrainzId`
- **Song**: `song.musicbrainzId`
- **Record**: `record.musicbrainzId`

### Workflow

1. Enter the entity name (artist name, song title, album title)
2. For songs/records, add the artist reference first for better results
3. Click "Search MusicBrainz"
4. Review the results and select the correct match
5. The MusicBrainz ID is automatically saved

Alternatively, you can manually enter a MusicBrainz ID in UUID format.

## Technical Details

- Uses MusicBrainz Web Service API v2
- Follows MusicBrainz API rate limiting guidelines
- Includes proper User-Agent header as required by MusicBrainz
- Built with @sanity/ui components for consistent styling
- Uses Sanity's `useFormValue` hook to access document fields reactively
