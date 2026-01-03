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
const MIN_REQUEST_INTERVAL = 1000; // 1 second in milliseconds

/**
 * Escape special characters for Lucene query syntax
 * MusicBrainz uses Lucene, which has special characters: + - && || ! ( ) { } [ ] ^ " ~ * ? : \
 */
function escapeLuceneSpecialChars(str: string): string {
  // Escape special Lucene characters
  return str.replace(/([+\-!(){}[\]^"~*?:\\])/g, '\\$1');
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
 * Search for artists by name
 */
export async function searchArtists(query: string, limit: number = 10): Promise<MusicBrainzArtist[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    await waitForRateLimit();

    const encodedQuery = encodeURIComponent(query);
    const url = `${API_BASE}/artist?query=${encodedQuery}&fmt=json&limit=${limit}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      console.error('MusicBrainz API error:', response.statusText);
      return [];
    }

    const data: MusicBrainzArtistSearchResponse = await response.json();
    return data.artists || [];
  } catch (error) {
    console.error('Error searching artists:', error);
    return [];
  }
}

/**
 * Search for releases (albums) by title and optional artist
 */
export async function searchReleases(
  title: string,
  artistName?: string,
  limit: number = 10,
): Promise<MusicBrainzRelease[]> {
  if (!title.trim()) {
    return [];
  }

  try {
    await waitForRateLimit();

    // Build query with proper escaping
    const escapedTitle = escapeLuceneSpecialChars(title);
    const queryParts = [escapedTitle];
    if (artistName?.trim()) {
      const escapedArtist = escapeLuceneSpecialChars(artistName);
      queryParts.push(`artist:${escapedArtist}`);
    }
    const query = encodeURIComponent(queryParts.join(' AND '));
    const url = `${API_BASE}/release?query=${query}&fmt=json&limit=${limit}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      console.error('MusicBrainz API error:', response.statusText);
      return [];
    }

    const data: MusicBrainzReleaseSearchResponse = await response.json();
    return data.releases || [];
  } catch (error) {
    console.error('Error searching releases:', error);
    return [];
  }
}

/**
 * Search for recordings (songs) by title and optional artist
 */
export async function searchRecordings(
  title: string,
  artistName?: string,
  limit: number = 10,
): Promise<MusicBrainzRecording[]> {
  if (!title.trim()) {
    return [];
  }

  try {
    await waitForRateLimit();

    // Build query with proper escaping
    const escapedTitle = escapeLuceneSpecialChars(title);
    const queryParts = [escapedTitle];
    if (artistName?.trim()) {
      const escapedArtist = escapeLuceneSpecialChars(artistName);
      queryParts.push(`artist:${escapedArtist}`);
    }
    const query = encodeURIComponent(queryParts.join(' AND '));
    const url = `${API_BASE}/recording?query=${query}&fmt=json&limit=${limit}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      console.error('MusicBrainz API error:', response.statusText);
      return [];
    }

    const data: MusicBrainzRecordingSearchResponse = await response.json();
    return data.recordings || [];
  } catch (error) {
    console.error('Error searching recordings:', error);
    return [];
  }
}

/**
 * Format duration in milliseconds to MM:SS
 */
export function formatDuration(ms?: number): string {
  if (!ms) return '';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
