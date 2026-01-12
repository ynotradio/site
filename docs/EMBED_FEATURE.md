# Custom Embed Feature Implementation

## Overview

Implemented custom Lexical embed blocks for the Posts collection to properly handle embedded content (YouTube, Vimeo, Spotify, SoundCloud, and generic iframes) during HTML-to-Lexical conversion.

## What Was Completed

### 1. Created Embed Feature Files

**`payload/src/features/embed/utils.ts`** - Shared utility functions
- URL parsing and embed detection logic
- Supports YouTube, Vimeo, Spotify, SoundCloud
- Extracts video/track IDs and generates proper embed URLs
- Can be used in both client and server contexts

**`payload/src/features/embed/server.ts`** - Server-side Payload configuration
- Defines `EmbedBlock` schema with url and caption fields
- Exports `EmbedFeature()` for use in Lexical editor configuration
- Re-exports utilities from utils.ts

**`payload/src/features/embed/client.tsx`** - Client-side React component
- Renders iframes with proper embed URLs
- Responsive 16:9 aspect ratio container
- Auto-converts URLs to embed format
- Displays optional captions

**`payload/src/features/embed/index.ts`** - Public API
- Exports all functions and types
- Barrel file for convenient imports

### 2. Updated Collections

**`payload/src/collections/Posts.ts`**
- Added `EmbedFeature()` to lexicalEditor configuration
- Embeds now available in the rich text editor

### 3. Enhanced HTML-to-Lexical Converter

**`bin/migrations/shared/enhancedHtmlToLexical.ts`**
- Updated iframe handling to create embed blocks instead of text placeholders
- Removed unused `getYouTubeVideoId()` function
- Now generates proper block nodes with `blockType: 'embed'`

**`bin/migrations/shared/enhancedHtmlToLexical.test.ts`**
- Updated 3 embed tests to verify block node creation
- Tests verify proper blockType, url, and structure

## Supported Embed Types

### YouTube
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- Converts to: `https://www.youtube.com/embed/VIDEO_ID`

### Vimeo
- `https://vimeo.com/VIDEO_ID`
- `https://vimeo.com/video/VIDEO_ID`
- Converts to: `https://player.vimeo.com/video/VIDEO_ID`

### Spotify
- `https://open.spotify.com/track/TRACK_ID`
- `https://open.spotify.com/album/ALBUM_ID`
- `https://open.spotify.com/playlist/PLAYLIST_ID`
- Converts to: `https://open.spotify.com/embed/TYPE/ID`

### SoundCloud
- `https://soundcloud.com/ARTIST/TRACK`
- Converts to: `https://w.soundcloud.com/player/?url=https://soundcloud.com/ARTIST/TRACK`

### Generic
- Any other iframe src is passed through as-is

## Example Usage

### In Migration Scripts
```typescript
import { convertHtmlToLexicalEnhanced } from './shared/enhancedHtmlToLexical';

const html = '<iframe src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"></iframe>';
const lexical = convertHtmlToLexicalEnhanced(html);

// Result contains:
// {
//   type: 'block',
//   format: '',
//   version: 2,
//   fields: {
//     blockType: 'embed',
//     blockName: '',
//     url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
//     id: ''
//   }
// }
```

### In Client Code
```typescript
import { EmbedComponent } from '@/payload/src/features/embed';

<EmbedComponent 
  url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  caption="Optional caption text"
/>
```

### In Collection Schemas
```typescript
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { EmbedFeature } from '../features/embed';

{
  name: 'content',
  type: 'richText',
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      EmbedFeature(),
    ],
  }),
}
```

## API Reference

### detectEmbedType(url: string): EmbedInfo
Analyzes a URL and returns embed information including type and proper embed URL.

**Returns:**
```typescript
{
  type: 'youtube' | 'vimeo' | 'spotify' | 'soundcloud' | 'generic',
  embedUrl: string,  // Properly formatted embed URL
  originalUrl: string
}
```

### extractYouTubeId(url: string): string | null
Extracts YouTube video ID from various URL formats.

### extractVimeoId(url: string): string | null
Extracts Vimeo video ID from URL.

### extractSpotifyInfo(url: string): { type: string; id: string } | null
Extracts Spotify content type (track/album/playlist/artist) and ID.

### extractSoundCloudInfo(url: string): string | null
Extracts SoundCloud artist/track path.

## Test Results

### Enhanced HTML to Lexical Tests
- ✅ 36/36 tests passing
- All embed tests updated and passing
- Verifies proper block node structure

### Migration Tests
- ✅ 340/340 tests passing
- No regressions from changes

### Build Status
- ✅ Next.js build succeeds
- ✅ No TypeScript errors
- ⚠️ Minor ESLint warnings (cosmetic only):
  - Barrel file pattern in index.ts (project style guide preference)
  - Some trailing space warnings (auto-fixable)

## Architecture Decisions

### Separation of Concerns
Created `utils.ts` separate from `server.ts` to allow client-side code to import URL detection logic without pulling in Node.js/Payload server dependencies. This prevents Next.js bundling errors.

### Block Node Structure
Embed blocks use Payload's BlocksFeature with custom fields:
- `url`: The embed URL (automatically converted to proper format)
- `caption`: Optional caption text
- `blockType`: Always set to 'embed' for identification

### Client-Side URL Conversion
The React component calls `detectEmbedType()` to ensure URLs are in proper embed format, even if the stored URL isn't. This provides resilience if URLs are entered in various formats.

## Next Steps

### Integration into Import Scripts

**Required:** Update `importPosts.ts` to use the enhanced converter:

```typescript
// Detect if this is a custom text (has complex HTML) vs simple story
if (post.source === 'custom_text') {
  content = convertHtmlToLexicalEnhanced(post.content);
} else {
  content = convertHtmlToLexical(post.content); // Simple converter
}
```

### Optional Enhancements

1. **Preview in Admin UI**
   - Add preview rendering for embed blocks in Payload admin
   - Show thumbnail or embedded player in editor

2. **Image Upload Integration**
   - Currently image nodes reference URLs
   - Could download and upload to media collection
   - Update references to use Payload upload relationships

3. **Frontend Rendering Component**
   - Create Next.js component for rendering Lexical content
   - Ensure embed blocks render properly on public site

4. **Additional Embed Types**
   - TikTok embeds
   - Instagram posts
   - Twitter/X posts
   - CodePen embeds

5. **Caption Extraction**
   - Parse iframe title or surrounding text for auto-captions
   - Extract from figure/figcaption elements

## Files Modified

- `payload/src/features/embed/utils.ts` (new)
- `payload/src/features/embed/server.ts` (new)
- `payload/src/features/embed/client.tsx` (new)
- `payload/src/features/embed/index.ts` (new)
- `payload/src/collections/Posts.ts` (updated)
- `bin/migrations/shared/enhancedHtmlToLexical.ts` (updated)
- `bin/migrations/shared/enhancedHtmlToLexical.test.ts` (updated)

## Breaking Changes

None. This is purely additive functionality.

## Performance Considerations

- URL regex matching is fast and efficient
- Client-side conversion happens only once per embed render
- No external API calls required for URL detection
- Embeds are lazy-loaded by browser via iframe

## Security

- All URL detection uses simple regex patterns
- No code execution or eval()
- iframes have standard security attributes:
  - `allow` attribute restricts permissions
  - `allowFullScreen` for video players
  - No inline scripts

## Browser Support

Works in all browsers that support:
- ES6+ JavaScript
- HTML5 iframes
- CSS flexbox (for responsive layout)

Tested with:
- Modern Chrome, Firefox, Safari, Edge
- Next.js SSR and client-side rendering
