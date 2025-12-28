# MusicBrainz Smart Linking Component

A custom Sanity input component that provides smart search and linking to MusicBrainz for artist entities.

## Features

- **Search Integration**: Search MusicBrainz directly from the Sanity Studio interface
- **Rich Results**: Displays artist name, type, country, and active years
- **Match Scoring**: Shows relevance scores for search results
- **One-Click Linking**: Select an artist from search results to auto-populate the MBID
- **Manual Entry**: Option to manually enter MusicBrainz IDs if needed
- **Linked State**: When linked, shows the MBID with a direct link to MusicBrainz
- **Validation**: UUID format validation for MusicBrainz IDs

## Usage

The component is already integrated into the `artist` schema. When editing an artist:

1. Start typing the artist name in the search field
2. Press "Search" or hit Enter
3. Select the matching artist from the results
4. The MusicBrainz ID will be automatically populated

Alternatively, you can manually enter a MusicBrainz Artist ID in UUID format.

## Technical Details

- Uses MusicBrainz Web Service API v2
- Follows MusicBrainz API rate limiting guidelines
- Includes proper User-Agent header as required by MusicBrainz
- Built with @sanity/ui components for consistent styling
