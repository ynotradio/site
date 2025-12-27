/**
 * Artist Cleanup Utilities
 *
 * Provides intelligent artist name cleanup and parsing for import scripts.
 * Handles HTML tags, multiple artists, concert-specific information, and event names.
 */

/**
 * Strip HTML tags and clean up formatting in artist strings
 */
export function cleanArtistString(rawString: string): string {
  if (!rawString) return '';

  let cleaned = rawString;

  // Remove HTML tags (replace with space to avoid concatenation)
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');

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

/**
 * Check if a string contains concert-specific information that should be
 * preserved as a custom title rather than parsed as artist names
 */
export function shouldPreserveAsCustomTitle(artistString: string): boolean {
  // These patterns indicate special concert formats
  const customTitlePatterns = [
    /\(performing\s+/i, // "Artist (performing Album)"
    /\(playing\s+/i, // "Artist (playing Album)"
    /\s+performs\s+/i, // "Artist performs Album"
    /\s+plays\s+/i, // "Artist plays Album"
    /\s+anniversary\)/i, // "Album Anniversary)"
    /\([^)]*night\s+\d+\)/i, // "(Night 1)", "(Night 2)"
    /\([^)]*show\)/i, // "(Special Show)", "(Album Release Show)"
    /\([^)]*\s+tour\)/i, // "(The Catacombs Tour)", "(Final Tour)"
    /\[[^\]]*show\]/i, // "[early show]", "[late show]"
    /\(album\s+release\)/i, // "(Album Release)"
    /\(record\s+release\)/i, // "(Record Release)"
    /\(reunion\)/i, // "(Reunion)"
    /\(farewell\s+tour\)/i, // "(Farewell Tour)"
    /\(rescheduled\)/i, // "(rescheduled)"
    /\(solo\)/i, // "(solo)"
    /\(acoustic\)/i, // "(acoustic)"
    /\(full\s+band\)/i, // "(Full Band)"
    /\(formerly\s+/i, // "(formerly Ohmme)"
    /\(members?\s+of\s+/i, // "(members of The Districts)"
    /:\s+winter\s+classic/i, // ": Winter Classic Night 2"
  ];

  return customTitlePatterns.some((pattern) => pattern.test(artistString));
}

/**
 * Check if a string represents an event/festival rather than artist names
 */
export function isEventName(artistString: string): boolean {
  const eventPatterns = [
    /^<i>.*?<\/i>.*?f(?:ea)?t\./i, // "<i>Event Name</i><br>ft. Artists"
    /^<em>.*?<\/em>.*?f(?:ea)?t\./i, // "<em>Event Name</em> ft. Artists"
    /benefit\s+f(?:ea)?t\./i, // "Benefit ft. Artists"
    /festival\s+f(?:ea)?t\./i, // "Festival ft. Artists"
    /philly\s+music\s+fest/i, // "Philly Music Fest"
    /^make\s+the\s+world\s+better\s+benefit/i, // "Make The World Better Benefit"
    /tribute\s+f(?:ea)?t\./i, // "Tribute ft. Artists"
    /outdoor\s+music\s+festival/i, // "Outdoor Music Festival"
    /bike\s+race/i, // "Bike Race"
  ];

  return eventPatterns.some((pattern) => pattern.test(artistString));
}

/**
 * Check if an artist name contains "and", "&", or "+" but should NOT be split
 * (e.g., "Echo & The Bunnymen", "Florence + The Machine", "Ted Leo and the Pharmacists")
 */
export function isSingleArtistWithConjunction(artistName: string): boolean {
  const trimmed = artistName.trim();

  // Specific known single artists with conjunctions
  const knownSingleArtists = [
    /^Echo\s+&\s+[Tt]he\s+Bunnymen$/i,
    /^Florence\s+\+\s+[Tt]he\s+Machine$/i,
    /^Marina\s+\+\s+[Tt]he\s+Diamonds$/i,
    /^Tegan\s+and\s+Sara$/i,
    /^Ted\s+Leo\s+and\s+the\s+Pharmacists$/i,
    /^Tom\s+Petty\s+and\s+the\s+Heartbreakers$/i,
  ];

  if (knownSingleArtists.some((pattern) => pattern.test(trimmed))) {
    return true;
  }

  // Generic patterns: "Word & The word" or "Word + The word"
  // where the word after "The" is lowercase (indicating it's part of the
  // band name, not a separate band)
  const genericSingleArtistPatterns = [
    /^[^&]+\s+&\s+[Tt]he\s+[a-z]/, // "Artist & The something" (lowercase word after "The")
    /^[^+]+\s+\+\s+[Tt]he\s+[a-z]/, // "Artist + The something" (lowercase word after "The")
  ];

  return genericSingleArtistPatterns.some((pattern) => pattern.test(trimmed));
}

/**
 * Parse a string into multiple artist names
 * Handles commas, "and", "&", "ft.", "feat.", etc.
 */
export function parseArtistNames(artistString: string): string[] {
  if (!artistString || !artistString.trim()) return [];

  // Check if this is a single artist with a conjunction in the name
  if (isSingleArtistWithConjunction(artistString)) {
    return [artistString.trim()];
  }

  let working = artistString;

  // Handle "ft." and "feat." - replace with comma for consistent splitting
  working = working.replace(/\s+f(?:ea)?t\.\s+/gi, ', ');

  // Split by common delimiters
  let artists = working.split(/\s*(?:,|;|\band\b|&|\+)\s*/);

  // Filter and clean
  artists = artists
    .map((a) => a.trim())
    .filter((a) => a.length > 0)
    // Remove "more" or "more..." entries
    .filter((a) => !/^more(\.\.\.)?$/i.test(a));

  return artists;
}

/**
 * Extract artist names from a custom title string
 * (e.g., "Ron Gallo (Album Release)" -> ["Ron Gallo"])
 */
export function extractArtistsFromTitle(customTitle: string): string[] {
  // Remove everything from the first parenthesis or bracket onwards
  let baseTitle = customTitle.replace(/[([[].*$/, '').trim();

  // Also remove anything after colons that might be concert-specific (e.g.,
  // "Strand of Oaks (Full Band): Winter Classic Night 2")
  if (/:\s+winter\s+classic/i.test(customTitle)) {
    baseTitle = baseTitle.replace(/\s*:.*$/, '').trim();
  }

  return parseArtistNames(baseTitle);
}

/**
 * Extract artist names from an event string (e.g., "<i>Frantic City Festival</i>
 * ft. Yo La Tengo, Snail Mail..." -> ["Yo La Tengo", "Snail Mail"])
 */
export function extractArtistsFromEventString(eventString: string): string[] {
  // Find the "ft." part and extract everything after it
  const ftMatch = eventString.match(/\s+f(?:ea)?t\.\s+(.+)$/i);

  if (!ftMatch) {
    // No "ft." found, just parse the whole string
    return parseArtistNames(eventString);
  }

  const artistsPart = ftMatch[1];
  return parseArtistNames(artistsPart);
}

/**
 * Main processing function that handles all artist string cleanup and parsing
 */
export interface ProcessedArtistResult {
  customTitle: string | null;
  artistNames: string[];
}

export function processArtistString(rawArtistString: string): ProcessedArtistResult {
  // Step 1: Clean HTML and formatting
  const cleanedString = cleanArtistString(rawArtistString);

  if (!cleanedString) {
    return {
      customTitle: null,
      artistNames: [],
    };
  }

  // Step 2: Check for custom title (before cleaning, to detect HTML patterns)
  const useCustomTitle = shouldPreserveAsCustomTitle(rawArtistString);

  // Step 3: Check for event name (before cleaning, to detect HTML patterns)
  const isEvent = isEventName(rawArtistString);

  if (isEvent) {
    // Extract artist names from "Event ft. Artist1, Artist2, and Artist3"
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
    artistNames,
  };
}
