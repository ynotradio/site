# Testing MusicBrainz Custom Fields

## Manual Testing Instructions

### Prerequisites

1. Start the Payload development server:
   ```bash
   yarn payload:dev
   ```

2. Or start the Next.js dev server:
   ```bash
   yarn dev
   ```

3. Navigate to the Payload admin UI (usually `http://localhost:3000/admin`)

### Test Artist MusicBrainz Field

1. Go to **Artists** collection
2. Click **Create New** or edit an existing artist
3. Look for **MusicBrainz ID** field in the sidebar
4. Type an artist name (e.g., "Radiohead", "The Beatles")
5. Wait for search results to appear
6. Verify results show:
   - Artist name
   - Type (Person, Group, etc.)
   - Life span dates (if available)
   - Disambiguation text (if available)
   - Match score
7. Click a result to select it
8. Verify the MBID is populated
9. Save the artist
10. Re-open the artist to verify the MBID persists
11. Click **Clear** button to clear the selection
12. Verify you can search again

### Test Record MusicBrainz Field

1. Go to **Records** collection
2. Click **Create New** or edit an existing record
3. Enter an album title in the **Title** field
4. Look for **MusicBrainz ID** field in the sidebar
5. Click **Use Album Title** button
6. Verify the search field is populated with the album title
7. Wait for search results to appear
8. Verify results show:
   - Album title
   - Release type (Album, EP, Single, etc.)
   - Artist credits
   - Release date (if available)
   - Disambiguation text (if available)
   - Match score
9. Click a result to select it
10. Verify the MBID is populated
11. Save the record

### Test Song MusicBrainz Field

1. Go to **Songs** collection
2. Click **Create New** or edit an existing song
3. Enter a song title in the **Title** field
4. Look for **MusicBrainz ID** field in the sidebar
5. Click **Use Song Title** button
6. Verify the search field is populated with the song title
7. Wait for search results to appear
8. Verify results show:
   - Track title
   - Duration (if available)
   - Artist credits
   - Disambiguation text (if available)
   - Match score
9. Click a result to select it
10. Verify the MBID is populated
11. Save the song

## Common Test Cases

### Edge Cases to Test

1. **Empty Search**: Type nothing, verify no results appear
2. **No Results**: Search for "asdkfjhasdkfhjaksdhf", verify "No results found" message
3. **Special Characters**: Search for artists with special characters (e.g., "Sigur Rós", "Björk")
4. **Multiple Words**: Search for multi-word names (e.g., "Florence and the Machine")
5. **Ambiguous Names**: Search for common names and verify disambiguation helps
6. **Rate Limiting**: Perform multiple searches quickly, verify rate limiting works (1/second)

### UI/UX Tests

1. **Debouncing**: Type quickly, verify search doesn't fire for every character
2. **Loading State**: Verify "Searching..." message appears during search
3. **Result Highlighting**: Hover over results, verify hover state
4. **Keyboard Navigation**: Try using keyboard to navigate results
5. **Mobile/Responsive**: Test on different screen sizes
6. **Dark/Light Theme**: Verify styling works in both themes

### Data Persistence Tests

1. **Save and Reload**: Save an entity with MBID, reload page, verify MBID persists
2. **Edit Existing**: Edit an entity with existing MBID, verify it displays correctly
3. **Clear and Save**: Clear an MBID, save, verify it's removed from database
4. **Unique Constraint**: Try to create two entities with the same MBID, verify validation

## Browser Console Checks

Open browser dev tools console and verify:

1. No JavaScript errors during search
2. No failed API requests to MusicBrainz
3. Rate limiting logs (if enabled)
4. Proper User-Agent header is sent

## Network Tab Checks

Open browser dev tools Network tab and verify:

1. MusicBrainz API requests are properly formatted
2. User-Agent header is present: `YNotRadio/1.0.0 (https://ynotradio.org)`
3. Responses are valid JSON
4. Rate limiting enforces 1 request/second

## Screenshot Checklist

Take screenshots of:

1. Artist search with results
2. Artist selected state
3. Record search with "Use Album Title" button
4. Song search with duration displayed
5. Empty/no results state
6. Loading state

## Reporting Issues

If you find any issues:

1. Note the exact steps to reproduce
2. Include browser/version information
3. Include screenshots or screen recording
4. Check browser console for errors
5. Check network tab for failed requests
6. Note the search query and expected vs actual behavior

## Success Criteria

All tests pass when:

- [ ] All three field components render without errors
- [ ] Search functionality works for all entity types
- [ ] Results display with correct formatting
- [ ] Selection updates the field value
- [ ] Clear functionality works
- [ ] Data persists after save
- [ ] Rate limiting prevents API abuse
- [ ] UI is responsive and accessible
- [ ] No console errors
- [ ] Network requests are properly formatted
