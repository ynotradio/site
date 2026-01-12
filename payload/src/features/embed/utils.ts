/**
 * Shared utility functions for embed detection
 * Can be used in both client and server contexts
 */

export type EmbedType = 'youtube' | 'vimeo' | 'spotify' | 'soundcloud' | 'generic';

export interface EmbedInfo {
  type: EmbedType;
  embedUrl: string;
  originalUrl: string;
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];

  let match;
  for (let i = 0; i < patterns.length; i += 1) {
    match = url.match(patterns[i]);
    if (match) return match[1];
  }
  return null;
}

/**
 * Extract Vimeo video ID from URL
 */
export function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

/**
 * Extract Spotify embed info from URL
 */
export function extractSpotifyInfo(url: string): { type: string; id: string } | null {
  const match = url.match(/spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
  return match ? { type: match[1], id: match[2] } : null;
}

/**
 * Extract SoundCloud track info
 */
export function extractSoundCloudInfo(url: string): string | null {
  const match = url.match(/soundcloud\.com\/([a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * Detect embed type and generate proper embed URL
 */
export function detectEmbedType(url: string): EmbedInfo {
  // YouTube
  if (url.match(/youtube\.com|youtu\.be/)) {
    const videoId = extractYouTubeId(url);
    if (videoId) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        originalUrl: url,
      };
    }
  }

  // Vimeo
  if (url.match(/vimeo\.com/)) {
    const videoId = extractVimeoId(url);
    if (videoId) {
      return {
        type: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${videoId}`,
        originalUrl: url,
      };
    }
  }

  // Spotify
  if (url.match(/spotify\.com/)) {
    const info = extractSpotifyInfo(url);
    if (info) {
      return {
        type: 'spotify',
        embedUrl: `https://open.spotify.com/embed/${info.type}/${info.id}`,
        originalUrl: url,
      };
    }
  }

  // SoundCloud
  if (url.match(/soundcloud\.com/)) {
    const trackInfo = extractSoundCloudInfo(url);
    if (trackInfo) {
      return {
        type: 'soundcloud',
        embedUrl: `https://w.soundcloud.com/player/?url=https://soundcloud.com/${trackInfo}`,
        originalUrl: url,
      };
    }
  }

  // Generic iframe embed
  return {
    type: 'generic',
    embedUrl: url,
    originalUrl: url,
  };
}
