/**
 * MusicBrainz API Client for Frontend
 *
 * Provides search functionality for artists, releases, and recordings
 * to be used in custom field components
 */

export interface MusicBrainzArtist {
  id: string;
  name: string;
  type?: string;
  'life-span'?: {
    begin?: string;
    end?: string;
  };
  disambiguation?: string;
  score: number;
}

export interface MusicBrainzRelease {
  id: string;
  title: string;
  date?: string;
  'artist-credit'?: Array<{
    name: string;
    artist: {
      id: string;
      name: string;
    };
  }>;
  'release-group'?: {
    'primary-type'?: string;
  };
  disambiguation?: string;
  score: number;
}

export interface MusicBrainzRecording {
  id: string;
  title: string;
  length?: number;
  'artist-credit'?: Array<{
    name: string;
    artist: {
      id: string;
      name: string;
    };
  }>;
  disambiguation?: string;
  score: number;
}

interface MusicBrainzArtistSearchResponse {
  artists: MusicBrainzArtist[];
}

interface MusicBrainzReleaseSearchResponse {
  releases: MusicBrainzRelease[];
}

interface MusicBrainzRecordingSearchResponse {
  recordings: MusicBrainzRecording[];
}

const API_BASE = 'https://musicbrainz.org/ws/2';
const USER_AGENT = 'YNotRadio/1.0.0 (https://ynotradio.org)';

// Rate limiting: MusicBrainz requires max 1 request per second
let lastRequestTime = 0;
let requestInProgress = false;
const MIN_REQUEST_INTERVAL = 1000; // 1 second in milliseconds
const BUSY_WAIT_INTERVAL = 50; // milliseconds to wait between checks

/**
 * Escape special characters for Lucene query syntax
 * MusicBrainz uses Lucene, which has special characters: + - && || ! ( ) { } [ ] ^ " ~ * ? : \
 */
function escapeLuceneSpecialChars(str: string): string {
  // Escape special Lucene characters
  // Note: && and || need to be escaped before individual & and |
  return str
    .replace(/&&/g, '\\&&')
    .replace(/\|\|/g, '\\||')
    .replace(/([+\-!(){}[\]^"~*?:\\&|])/g, '\\$1');
}

/**
 * Wait to respect rate limiting (1 request per second)
 * Uses a request queue to prevent race conditions
 */
async function waitForRateLimit(): Promise<void> {
  // eslint-disable-next-line no-await-in-loop
  while (requestInProgress) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      setTimeout(resolve, BUSY_WAIT_INTERVAL);
    });
  }

  requestInProgress = true;
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise((resolve) => {
      setTimeout(resolve, waitTime);
    });
  }

  // Update lastRequestTime before releasing the lock to prevent race conditions
  lastRequestTime = Date.now();
  requestInProgress = false;
}

/**
 * Fetch from MusicBrainz API with rate limiting and error handling.
 * Returns parsed JSON on success, null on failure or non-OK response.
 */
async function fetchMusicBrainz<T>(
  endpoint: string,
  encodedQuery: string,
  limit: number,
): Promise<T | null> {
  try {
    await waitForRateLimit();
    const url = `${API_BASE}/${endpoint}?query=${encodedQuery}&fmt=json&limit=${limit}`;
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Search for artists by name
 */
export async function searchArtists(
  query: string,
  limit: number = 10,
): Promise<MusicBrainzArtist[]> {
  if (!query.trim()) return [];
  const encodedQuery = encodeURIComponent(escapeLuceneSpecialChars(query));
  const data = await fetchMusicBrainz<MusicBrainzArtistSearchResponse>('artist', encodedQuery, limit);
  return data?.artists ?? [];
}

/**
 * Check if any artist credit matches the target artist name (case-insensitive)
 */
function artistCreditMatches(
  artistCredits: Array<{ name: string }> | undefined,
  targetArtist: string,
): boolean {
  if (!artistCredits || !targetArtist.trim()) return false;
  const normalized = targetArtist.toLowerCase().trim();
  return artistCredits.some((ac) => ac.name.toLowerCase().trim() === normalized);
}

/**
 * Default release type ranking (lower = better).
 * Types not listed get DEFAULT_TYPE_RANK.
 */
const RELEASE_TYPE_RANKS: Record<string, number> = {
  Album: 1,
  EP: 2,
  Single: 3,
  Broadcast: 4,
  Compilation: 5,
  Soundtrack: 5,
};
const DEFAULT_TYPE_RANK = 4;

/**
 * Get a numeric rank for a release type (lower = better).
 * The preferredType always gets rank 0 (top).
 */
function releaseTypeRank(type: string | undefined, preferredType: string): number {
  if (!type) return DEFAULT_TYPE_RANK;
  if (type === preferredType) return 0;
  return RELEASE_TYPE_RANKS[type] ?? DEFAULT_TYPE_RANK;
}

/**
 * Search for releases (albums/singles/EPs) by title and optional artist
 * Results are re-ranked to prioritize artist matches and the preferred release type
 */
export async function searchReleases(
  title: string,
  artistName?: string,
  preferredType: string = 'Album',
  limit: number = 10,
): Promise<MusicBrainzRelease[]> {
  if (!title.trim()) return [];

  const queryParts = [escapeLuceneSpecialChars(title)];
  if (artistName?.trim()) {
    queryParts.push(`artist:${escapeLuceneSpecialChars(artistName)}`);
  }
  const encodedQuery = encodeURIComponent(queryParts.join(' AND '));

  const data = await fetchMusicBrainz<MusicBrainzReleaseSearchResponse>('release', encodedQuery, limit);
  const releases = data?.releases ?? [];

  if (!artistName?.trim()) return releases;

  return releases.sort((a, b) => {
    const aArtistMatch = artistCreditMatches(a['artist-credit'], artistName) ? 1 : 0;
    const bArtistMatch = artistCreditMatches(b['artist-credit'], artistName) ? 1 : 0;
    if (aArtistMatch !== bArtistMatch) return bArtistMatch - aArtistMatch;

    const aTypeRank = releaseTypeRank(a['release-group']?.['primary-type'], preferredType);
    const bTypeRank = releaseTypeRank(b['release-group']?.['primary-type'], preferredType);
    if (aTypeRank !== bTypeRank) return aTypeRank - bTypeRank;

    return (b.score || 0) - (a.score || 0);
  });
}

/**
 * Search for recordings (songs) by title and optional artist
 * Filters out live and video recordings to prioritize studio versions
 * Results are re-ranked to prioritize artist matches
 */
export async function searchRecordings(
  title: string,
  artistName?: string,
  limit: number = 10,
): Promise<MusicBrainzRecording[]> {
  if (!title.trim()) return [];

  const queryParts = [escapeLuceneSpecialChars(title)];
  if (artistName?.trim()) {
    queryParts.push(`artist:${escapeLuceneSpecialChars(artistName)}`);
  }
  queryParts.push('NOT video:true');
  const encodedQuery = encodeURIComponent(queryParts.join(' AND '));

  const data = await fetchMusicBrainz<MusicBrainzRecordingSearchResponse>('recording', encodedQuery, limit);
  const recordings = data?.recordings ?? [];

  return recordings.sort((a, b) => {
    if (artistName?.trim()) {
      const aArtistMatch = artistCreditMatches(a['artist-credit'], artistName) ? 1 : 0;
      const bArtistMatch = artistCreditMatches(b['artist-credit'], artistName) ? 1 : 0;
      if (aArtistMatch !== bArtistMatch) return bArtistMatch - aArtistMatch;
    }

    const aIsLive = a.disambiguation?.toLowerCase().includes('live') ? 1 : 0;
    const bIsLive = b.disambiguation?.toLowerCase().includes('live') ? 1 : 0;
    if (aIsLive !== bIsLive) return aIsLive - bIsLive;

    return (b.score || 0) - (a.score || 0);
  });
}

/**
 * Format a list of artist credits into a display string.
 */
export function getArtistCreditName(
  credits: Array<{ name: string }> | undefined,
): string {
  if (!credits?.length) return 'Unknown Artist';
  return credits.map((ac) => ac.name).join(', ');
}

/**
 * Format duration in milliseconds to MM:SS
 */
export function formatDuration(ms?: number): string {
  if (ms === undefined) return '';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
