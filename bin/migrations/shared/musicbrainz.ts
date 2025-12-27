/**
 * MusicBrainz API Client
 *
 * Provides artist lookup functionality using the MusicBrainz API
 * https://musicbrainz.org/doc/MusicBrainz_API
 */

interface MusicBrainzArtist {
  id: string;
  name: string;
  score: number;
  type?: string;
}

interface MusicBrainzSearchResponse {
  artists: MusicBrainzArtist[];
}

// Simple in-memory cache to avoid repeated API calls
const artistCache = new Map<string, boolean>();

// Rate limiting: MusicBrainz requires max 1 request per second
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second in milliseconds

/**
 * Wait to respect rate limiting (1 request per second)
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise((resolve) => {
      setTimeout(resolve, waitTime);
    });
  }

  lastRequestTime = Date.now();
}

/**
 * Search MusicBrainz for an artist by name
 * Returns true if the exact artist name exists as a single artist/band
 */
export async function isKnownArtist(artistName: string): Promise<boolean> {
  // Check cache first
  const cacheKey = artistName.toLowerCase().trim();
  if (artistCache.has(cacheKey)) {
    return artistCache.get(cacheKey)!;
  }

  try {
    // Respect rate limiting
    await waitForRateLimit();

    // Build search query
    const query = encodeURIComponent(artistName);
    const url = `https://musicbrainz.org/ws/2/artist?query=artist:"${query}"&fmt=json&limit=5`;

    // Make request with required User-Agent
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'YNotRadio/1.0.0 (https://ynotradio.org)',
      },
    });

    if (!response.ok) {
      // Don't throw on HTTP errors, just return false
      return false;
    }

    const data: MusicBrainzSearchResponse = await response.json();

    // Look for exact match (case-insensitive) with reasonably high score
    // Score threshold of 85 allows for slight variations while still being confident
    const exactMatch = data.artists.find(
      (artist) => artist.name.toLowerCase() === artistName.toLowerCase() && artist.score >= 85,
    );

    const result = !!exactMatch;

    // Cache the result
    artistCache.set(cacheKey, result);

    return result;
  } catch (error) {
    // On error, don't cache and return false (fail safe)
    return false;
  }
}

/**
 * Clear the cache (useful for testing or long-running processes)
 */
export function clearArtistCache(): void {
  artistCache.clear();
}

/**
 * Get cache statistics (for monitoring)
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: artistCache.size,
    keys: Array.from(artistCache.keys()),
  };
}
