# Artist Cleanup Specification

## Problem Statement

During concert import, artist names from the MySQL database are being imported directly without proper sanitization. This creates several data quality issues:

1. **HTML/Formatting Tags**: Artist names containing HTML tags like `<em>`, `<i>`, `<br>`, etc.
   - Example: `<em>No More Dysphoria VII</em>`
   - Example: `<i>Sing Us Home Festival</i><br>ft. Dave Hause...`

2. **Multiple Artists Combined**: Single artist records that should be split into multiple artists. This needs to be done intelligently - some artists actually do have "and", "&", or "+" in the name.
   - Example: "Jimmy Eat World and New Found Glory" → should be 2 artists
   - Example: "The Tisburys and Twin Princess" → should be 2 artists
   - Example: "Guster & The Mountain Goats" → should be 2 artists
   - Example: "Ted Leo and the Pharmacists" → should be 1 artist
   - Example: "Tegan and Sara → should be 1 artist
   - Example: J. Mascis (of Dinosaur Jr.) → should be 2 artists
   - Example: TOY SOLDIERS w/ Paper Masques → should be 2 artists
   - Example: Coheed and Cambria → should be 1 artist
   - Example: Cheers Elephant w/ Springs → should be 2 artists

3. **Concert Information in Artist Names**: Artist names containing concert-specific details
   - Example: "Ron Gallo (Album Release)"
   - Example: "Tokyo Police Club (The Final Tour)"
   - Example: "Strand of Oaks (Full Band): Winter Classic Night 2"
   - Example: "Kurt Vile (solo) [early show]"
   - Example: The Roots Picnic f/ The Roots



## Solution: Intelligent Artist Cleanup Module

### Phase 1: HTML/Formatting Cleanup

Create a shared utility function that strips HTML tags and formatting from artist strings BEFORE processing them.

```typescript
/**
 * Strip HTML tags and clean up formatting in artist strings
 */
function cleanArtistString(rawString: string): string {
  if (!rawString) return '';

  let cleaned = rawString;

  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // Clean up whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}
```

### Phase 2: Concert-Specific Info Detection

Create patterns to identify when an artist name contains concert-specific information that should be preserved as a custom title instead of being parsed as an artist name.

```typescript
/**
 * Check if a string contains concert-specific information that should be
 * preserved as a custom title rather than parsed as artist names
 */
function shouldPreserveAsCustomTitle(artistString: string): boolean {
  // These patterns indicate special concert formats
  const customTitlePatterns = [
    /\(performing\s+/i,           // "Artist (performing Album)"
    /\(playing\s+/i,              // "Artist (playing Album)"
    /\s+performs\s+/i,            // "Artist performs Album"
    /\s+plays\s+/i,               // "Artist plays Album"
    /\s+anniversary\)/i,          // "Album Anniversary)"
    /\([^)]*night\s+\d+\)/i,      // "(Night 1)", "(Night 2)"
    /\([^)]*show\)/i,             // "(Special Show)", "(Album Release Show)"
    /\([^)]*\s+tour\)/i,          // "(The Catacombs Tour)", "(Final Tour)"
    /\[[^\]]*show\]/i,            // "[early show]", "[late show]"
    /\(album\s+release\)/i,       // "(Album Release)"
    /\(record\s+release\)/i,      // "(Record Release)"
    /\(reunion\)/i,               // "(Reunion)"
    /\(farewell\s+tour\)/i,       // "(Farewell Tour)"
    /\(rescheduled\)/i,           // "(rescheduled)"
    /\(solo\)/i,                  // "(solo)"
    /\(acoustic\)/i,              // "(acoustic)"
    /\(full\s+band\)/i,           // "(Full Band)"
    /\(formerly\s+/i,             // "(formerly Ohmme)"
    /\(members?\s+of\s+/i,        // "(members of The Districts)"
    /:\s+winter\s+classic/i,      // ": Winter Classic Night 2"
  ];

  return customTitlePatterns.some(pattern => pattern.test(artistString));
}
```

### Phase 3: Event Name Detection

Detect when the string represents an event/festival name rather than artist names.

```typescript
/**
 * Check if a string represents an event/festival rather than artist names
 */
function isEventName(artistString: string): boolean {
  const eventPatterns = [
    /^<i>.*?<\/i>\s+ft\./i,                    // "<i>Event Name</i> ft. Artists"
    /^<em>.*?<\/em>\s+ft\./i,                  // "<em>Event Name</em> ft. Artists"
    /benefit\s+ft\./i,                         // "Benefit ft. Artists"
    /festival\s+ft\./i,                        // "Festival ft. Artists"
    /philly\s+music\s+fest/i,                  // "Philly Music Fest"
    /^make\s+the\s+world\s+better\s+benefit/i, // "Make The World Better Benefit"
    /tribute\s+ft\./i,                         // "Tribute ft. Artists"
    /outdoor\s+music\s+festival/i,             // "Outdoor Music Festival"
    /bike\s+race/i,                            // "Bike Race"
  ];

  return eventPatterns.some(pattern => pattern.test(artistString));
}
```

### Phase 4: Integration into Import Process

Update the concert import flow to:

1. **First**: Clean HTML from the raw artist string
2. **Second**: Check if it should be preserved as a custom title
3. **Third**: Check if it's an event name (handle appropriately)
4. **Fourth**: Parse into individual artist names if needed
5. **Fifth**: Find or create artist records with cleaned names

```typescript
async function processArtistString(rawArtistString: string) {
  // Step 1: Clean HTML and formatting
  const cleanedString = cleanArtistString(rawArtistString);

  // Step 2: Check for custom title
  const useCustomTitle = shouldPreserveAsCustomTitle(rawArtistString);

  // Step 3: Check for event name
  const isEvent = isEventName(cleanedString);

  if (isEvent) {
    // Extract artist names from "Event ft. Artist1, Artist2, and Artist3"
    // This is a special case - we might want to just use the event as title
    // and parse artists from the "ft." portion
    return {
      customTitle: cleanedString,
      artistNames: extractArtistsFromEventString(cleanedString),
    };
  }

  if (useCustomTitle) {
    // Extract artist names from the title part before parentheses
    return {
      customTitle: cleanedString,
      artistNames: extractArtistsFromTitle(cleanedString),
    };
  }

  // Step 4: Parse normally into multiple artists
  const artistNames = parseArtistNames(cleanedString);

  return {
    customTitle: null,
    artistNames: artistNames,
  };
}
```

### Phase 5: Apply to All Import Scripts

The cleanup utilities should be shared across all import scripts:

- `importConcerts.ts` - Already has some logic, needs updating
- `importPosts.ts` - May reference artists
- `importOnDemand.ts` - May reference artists
- `importCdOfTheWeek.ts` - References artists
- Any other scripts that handle artist data

### Implementation Plan

1. Create shared utility file: `bin/migrations/shared/artistCleaner.ts`
2. Implement all cleanup functions in the shared utility
3. Update `importConcerts.ts` to use the new cleanup utilities
4. Update other import scripts as needed
5. Add unit tests for the cleanup functions
6. Test with actual data

### Edge Cases to Handle

1. **Band names with "and" or "&"**:
   - "Echo & The Bunnymen" → Single artist (not split)
   - "Florence + The Machine" → Single artist (not split)
   - Pattern: "Word & The ..." should NOT be split

2. **Featuring (ft./feat.)**:
   - "Event ft. Artist1, Artist2, and Artist3" → Extract all artists
   - "Artist1 ft. Artist2" → Split into two artists

3. **Nested Parentheses**:
   - Handle cases like "Artist (of Band A) (Album Release)"

4. **Commas in event strings**:
   - "Festival ft. Artist1, Artist2, and more..." → Parse carefully

5. **HTML entities and special characters**:
   - Properly decode all HTML entities
   - Handle special characters like em-dashes, curly quotes, etc.

## Testing Strategy

1. Create test cases with real examples from the database
2. Verify HTML is stripped correctly
3. Verify multi-artist strings are parsed correctly
4. Verify custom titles are preserved
5. Verify event names are handled appropriately
6. Verify edge cases (band names with "&", "and", etc.)

## Success Criteria

After implementation:
1. No artist names should contain HTML tags in Sanity
2. Multi-artist strings should be split into individual artist records
3. Concert-specific information should be in the concert title, not artist names
4. Event names should be handled appropriately
5. Legitimate band names with "and" or "&" should NOT be split incorrectly
