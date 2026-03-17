/**
 * MusicBrainz API Client
 *
 * Provides artist lookup functionality using the MusicBrainz API
 * https://musicbrainz.org/doc/MusicBrainz_API
 */

import * as fs from 'fs';
import * as path from 'path';

interface MusicBrainzArtist {
  id: string;
  name: string;
  score: number;
  type?: string;
}

interface MusicBrainzRelease {
  id: string;
  title: string;
  score: number;
  date?: string;
  'artist-credit'?: Array<{
    name: string;
  }>;
}

interface MusicBrainzRecording {
  id: string;
  title: string;
  score: number;
  disambiguation?: string;
  'artist-credit'?: Array<{
    name: string;
  }>;
}

interface MusicBrainzSearchResponse {
  artists: MusicBrainzArtist[];
}

interface MusicBrainzReleaseSearchResponse {
  releases: MusicBrainzRelease[];
}

interface MusicBrainzRecordingSearchResponse {
  recordings: MusicBrainzRecording[];
}

interface CacheData {
  version: number;
  artists: Record<string, boolean>;
  artistMbids: Record<string, string>;
  releaseMbids: Record<string, string>;
  recordingMbids: Record<string, string>;
}

// Persistent cache file location
const CACHE_FILE = path.join(__dirname, '.musicbrainz-cache.json');
const CACHE_VERSION = 3;

// In-memory cache loaded from disk
let artistCache = new Map<string, boolean>();
let artistMbidCache = new Map<string, string>();
let releaseMbidCache = new Map<string, string>();
let recordingMbidCache = new Map<string, string>();
let cacheLoaded = false;

// Rate limiting: MusicBrainz requires max 1 request per second
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second in milliseconds

/**
 * Load cache from disk
 */
function loadCache(): void {
  if (cacheLoaded) return;

  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data: CacheData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      if (data.version === CACHE_VERSION) {
        artistCache = new Map(Object.entries(data.artists));
        artistMbidCache = new Map(Object.entries(data.artistMbids || {}));
        releaseMbidCache = new Map(Object.entries(data.releaseMbids || {}));
        recordingMbidCache = new Map(Object.entries(data.recordingMbids || {}));
      }
    }
  } catch (error) {
    // Ignore cache load errors
  }

  cacheLoaded = true;
}

/**
 * Save cache to disk
 */
function saveCache(): void {
  try {
    const data: CacheData = {
      version: CACHE_VERSION,
      artists: Object.fromEntries(artistCache),
      artistMbids: Object.fromEntries(artistMbidCache),
      releaseMbids: Object.fromEntries(releaseMbidCache),
      recordingMbids: Object.fromEntries(recordingMbidCache),
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    // Ignore cache save errors
  }
}

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
  // Load cache from disk on first use
  loadCache();

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

    // Cache the result (in memory and disk)
    artistCache.set(cacheKey, result);
    saveCache();

    return result;
  } catch (error) {
    // On error, don't cache and return false (fail safe)
    return false;
  }
}

/**
 * Clear the cache (useful for testing)
 */
export function clearArtistCache(): void {
  artistCache.clear();
  artistMbidCache.clear();
  releaseMbidCache.clear();
  recordingMbidCache.clear();
  cacheLoaded = false;
  if (fs.existsSync(CACHE_FILE)) {
    fs.unlinkSync(CACHE_FILE);
  }
}

/**
 * Get cache statistics (for monitoring)
 */
export function getCacheStats(): {
  size: number;
  keys: string[];
  mbidSize: number;
  releaseSize: number;
  recordingSize: number;
} {
  return {
    size: artistCache.size,
    keys: Array.from(artistCache.keys()),
    mbidSize: artistMbidCache.size,
    releaseSize: releaseMbidCache.size,
    recordingSize: recordingMbidCache.size,
  };
}

/**
 * Search MusicBrainz for an artist and return their MBID
 * Returns the MBID if found, null otherwise
 */
export async function getArtistMbid(artistName: string): Promise<string | null> {
  // Load cache from disk on first use
  loadCache();

  // Check cache first
  const cacheKey = artistName.toLowerCase().trim();
  if (artistMbidCache.has(cacheKey)) {
    return artistMbidCache.get(cacheKey) || null;
  }

  try {
    // Respect rate limiting
    await waitForRateLimit();

    // Build search query
    const query = encodeURIComponent(artistName);
    const url = `https://musicbrainz.org/ws/2/artist?query=${query}&fmt=json&limit=1`;

    // Make request with required User-Agent
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'YNotRadio/1.0.0 (https://ynotradio.org)',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data: MusicBrainzSearchResponse = await response.json();

    // Get the best match (first result)
    if (data.artists && data.artists.length > 0) {
      const artist = data.artists[0];
      // Only accept if score is reasonably high
      if (artist.score >= 85) {
        artistMbidCache.set(cacheKey, artist.id);
        saveCache();
        return artist.id;
      }
    }

    // Cache null result to avoid repeated lookups
    artistMbidCache.set(cacheKey, '');
    saveCache();
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Search MusicBrainz for a release (album) and return its MBID
 * Returns the MBID if found, null otherwise
 * Always includes artist name in search to avoid ambiguous results
 */
export async function getReleaseMbid(
  albumTitle: string,
  artistName?: string,
): Promise<string | null> {
  // Load cache from disk on first use
  loadCache();

  // Check cache first
  const cacheKey = `${albumTitle}|${artistName || ''}`.toLowerCase().trim();
  if (releaseMbidCache.has(cacheKey)) {
    return releaseMbidCache.get(cacheKey) || null;
  }

  try {
    // Respect rate limiting
    await waitForRateLimit();

    // Build search query using field-specific Lucene syntax for precision
    const queryParts = [`release:"${albumTitle}"`];
    if (artistName?.trim()) {
      queryParts.push(`artist:"${artistName}"`);
    }
    const query = encodeURIComponent(queryParts.join(' AND '));
    const url = `https://musicbrainz.org/ws/2/release?query=${query}&fmt=json&limit=10`;

    // Make request with required User-Agent
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'YNotRadio/1.0.0 (https://ynotradio.org)',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data: MusicBrainzReleaseSearchResponse = await response.json();

    // Get the best match (first result with high score)
    if (data.releases && data.releases.length > 0) {
      // Filter and sort to prioritize studio albums over compilations/live
      const studioReleases = data.releases
        .filter((release) => {
          // Filter out obvious live recordings
          const isLive = release.title?.toLowerCase().includes('live');
          return !isLive && release.score >= 75;
        })
        .sort((a, b) => {
          // Prefer official studio albums
          const aIsCompilation = a.title?.toLowerCase().includes('compilation')
            || a.title?.toLowerCase().includes('greatest hits');
          const bIsCompilation = b.title?.toLowerCase().includes('compilation')
            || b.title?.toLowerCase().includes('greatest hits');

          if (aIsCompilation !== bIsCompilation) {
            return aIsCompilation ? 1 : -1;
          }

          // Otherwise sort by score
          return (b.score || 0) - (a.score || 0);
        });

      if (studioReleases.length > 0) {
        const release = studioReleases[0];
        releaseMbidCache.set(cacheKey, release.id);
        saveCache();
        return release.id;
      }
    }

    // Cache null result to avoid repeated lookups
    releaseMbidCache.set(cacheKey, '');
    saveCache();
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Search MusicBrainz for a recording (song) and return its MBID
 * Returns the MBID if found, null otherwise
 * Filters out live and video recordings to prioritize studio versions
 * Always includes artist name in search to avoid ambiguous results
 */
export async function getRecordingMbid(
  songTitle: string,
  artistName?: string,
): Promise<string | null> {
  // Load cache from disk on first use
  loadCache();

  // Check cache first
  const cacheKey = `${songTitle}|${artistName || ''}`.toLowerCase().trim();
  if (recordingMbidCache.has(cacheKey)) {
    return recordingMbidCache.get(cacheKey) || null;
  }

  try {
    // Respect rate limiting
    await waitForRateLimit();

    // Build search query - always include artist if available
    const queryParts = [songTitle];
    if (artistName?.trim()) {
      queryParts.push(`artist:${artistName}`);
    }

    // Filter out video recordings
    queryParts.push('NOT video:true');

    const query = encodeURIComponent(queryParts.join(' AND '));
    const url = `https://musicbrainz.org/ws/2/recording?query=${query}&fmt=json&limit=10`;

    // Make request with required User-Agent
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'YNotRadio/1.0.0 (https://ynotradio.org)',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data: MusicBrainzRecordingSearchResponse = await response.json();

    // Get the best match, filtering and sorting to prioritize studio versions
    if (data.recordings && data.recordings.length > 0) {
      const studioRecordings = data.recordings
        .filter((recording) => {
          // Filter out live recordings based on disambiguation
          const isLive = recording.disambiguation?.toLowerCase().includes('live');
          return !isLive && recording.score >= 85;
        })
        .sort((a, b) => (b.score || 0) - (a.score || 0));

      if (studioRecordings.length > 0) {
        const recording = studioRecordings[0];
        recordingMbidCache.set(cacheKey, recording.id);
        saveCache();
        return recording.id;
      }
    }

    // Cache null result to avoid repeated lookups
    recordingMbidCache.set(cacheKey, '');
    saveCache();
    return null;
  } catch (error) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Release detail & direct cover-art lookups
// ---------------------------------------------------------------------------

export interface MusicBrainzReleaseDetails {
  id: string;
  title: string;
  date?: string; // YYYY-MM-DD or YYYY-MM or YYYY
  label?: string;
  country?: string;
}

/**
 * Get detailed release information from a MusicBrainz release ID.
 * Returns label name and release date.
 */
export async function getReleaseDetails(mbid: string): Promise<MusicBrainzReleaseDetails | null> {
  try {
    await waitForRateLimit();

    const url = `https://musicbrainz.org/ws/2/release/${mbid}?inc=labels&fmt=json`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'YNotRadio/1.0.0 (https://ynotradio.org)' },
    });

    if (!response.ok) return null;

    const data = await response.json();

    // Extract label from label-info array
    let label: string | undefined;
    if (data['label-info'] && Array.isArray(data['label-info']) && data['label-info'].length > 0) {
      const labelInfo = data['label-info'][0];
      if (labelInfo.label && labelInfo.label.name) {
        label = labelInfo.label.name;
      }
    }

    return {
      id: data.id,
      title: data.title,
      date: data.date || undefined,
      label,
      country: data.country || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Get album cover art URL directly from a MusicBrainz release MBID.
 * Unlike getAlbumCoverArt(), this skips the search step.
 */
export async function getCoverArtByMbid(mbid: string): Promise<string | null> {
  try {
    const url = `https://coverartarchive.org/release/${mbid}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'YNotRadio/1.0.0 (https://ynotradio.org)' },
    });
    if (!response.ok) return null;

    const data = await response.json();
    if (data.images && Array.isArray(data.images)) {
      const frontCover = data.images.find((img: any) => img.front === true);
      if (frontCover?.image) return frontCover.image;
      if (data.images.length > 0 && data.images[0].image) return data.images[0].image;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get album cover art URL from MusicBrainz Cover Art Archive
 * Returns the front cover URL if available, null otherwise
 */
export async function getAlbumCoverArt(
  albumTitle: string,
  artistName?: string,
): Promise<string | null> {
  try {
    // First, get the release MBID
    const mbid = await getReleaseMbid(albumTitle, artistName);
    if (!mbid) {
      return null;
    }

    // Fetch cover art from Cover Art Archive
    // Note: No rate limiting needed for Cover Art Archive (different service)
    const url = `https://coverartarchive.org/release/${mbid}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'YNotRadio/1.0.0 (https://ynotradio.org)',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Find the front cover
    if (data.images && Array.isArray(data.images)) {
      const frontCover = data.images.find((img: any) => img.front === true);
      if (frontCover && frontCover.image) {
        return frontCover.image;
      }

      // If no front cover specified, return the first image
      if (data.images.length > 0 && data.images[0].image) {
        return data.images[0].image;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}
