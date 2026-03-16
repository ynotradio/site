export type EmbedType = 'youtube' | 'vimeo' | 'spotify' | 'soundcloud' | 'generic';

export interface EmbedInfo {
  type: EmbedType;
  embedUrl: string;
  originalUrl: string;
}

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];
  const match = patterns.map((p) => url.match(p)).find(Boolean);
  return match ? match[1] : null;
}

export function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

export function extractSpotifyInfo(url: string): { type: string; id: string } | null {
  const match = url.match(/spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
  return match ? { type: match[1], id: match[2] } : null;
}

export function extractSoundCloudInfo(url: string): string | null {
  const match = url.match(/soundcloud\.com\/([a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

export function detectEmbedType(url: string): EmbedInfo {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = extractYouTubeId(url);
    if (videoId) {
      return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${videoId}`, originalUrl: url };
    }
  }

  if (url.includes('vimeo.com')) {
    const videoId = extractVimeoId(url);
    if (videoId) {
      return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${videoId}`, originalUrl: url };
    }
  }

  if (url.includes('spotify.com')) {
    const info = extractSpotifyInfo(url);
    if (info) {
      return { type: 'spotify', embedUrl: `https://open.spotify.com/embed/${info.type}/${info.id}`, originalUrl: url };
    }
  }

  if (url.includes('soundcloud.com')) {
    const trackInfo = extractSoundCloudInfo(url);
    if (trackInfo) {
      return { type: 'soundcloud', embedUrl: `https://w.soundcloud.com/player/?url=https://soundcloud.com/${trackInfo}`, originalUrl: url };
    }
  }

  return { type: 'generic', embedUrl: url, originalUrl: url };
}
