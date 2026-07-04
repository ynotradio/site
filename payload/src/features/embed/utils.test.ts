/**
 * Unit tests for embed utility functions
 *
 * Tests URL detection and embed URL generation for various platforms
 */

import { describe, it, expect } from 'vitest';
import {
  extractYouTubeId,
  extractVimeoId,
  extractSpotifyInfo,
  extractSoundCloudInfo,
  extractMixcloudFeed,
  detectEmbedType,
} from './utils';

describe('extractYouTubeId', () => {
  it('should extract ID from standard watch URL', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('should extract ID from short URL', () => {
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('should extract ID from embed URL', () => {
    expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('should extract ID from watch URL with additional parameters', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s')).toBe(
      'dQw4w9WgXcQ',
    );
  });

  it('should return null for invalid YouTube URL', () => {
    expect(extractYouTubeId('https://www.example.com/video')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(extractYouTubeId('')).toBeNull();
  });
});

describe('extractVimeoId', () => {
  it('should extract ID from standard URL', () => {
    expect(extractVimeoId('https://vimeo.com/123456789')).toBe('123456789');
  });

  it('should extract ID from video/ path URL', () => {
    expect(extractVimeoId('https://vimeo.com/video/123456789')).toBe('123456789');
  });

  it('should return null for invalid Vimeo URL', () => {
    expect(extractVimeoId('https://www.example.com/video')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(extractVimeoId('')).toBeNull();
  });
});

describe('extractSpotifyInfo', () => {
  it('should extract track info', () => {
    const result = extractSpotifyInfo('https://open.spotify.com/track/abc123xyz');
    expect(result).toEqual({ type: 'track', id: 'abc123xyz' });
  });

  it('should extract album info', () => {
    const result = extractSpotifyInfo('https://open.spotify.com/album/def456uvw');
    expect(result).toEqual({ type: 'album', id: 'def456uvw' });
  });

  it('should extract playlist info', () => {
    const result = extractSpotifyInfo('https://open.spotify.com/playlist/ghi789rst');
    expect(result).toEqual({ type: 'playlist', id: 'ghi789rst' });
  });

  it('should extract artist info', () => {
    const result = extractSpotifyInfo('https://open.spotify.com/artist/jkl012mno');
    expect(result).toEqual({ type: 'artist', id: 'jkl012mno' });
  });

  it('should return null for invalid Spotify URL', () => {
    expect(extractSpotifyInfo('https://www.example.com/music')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(extractSpotifyInfo('')).toBeNull();
  });
});

describe('extractSoundCloudInfo', () => {
  it('should extract track info with username and track slug', () => {
    const result = extractSoundCloudInfo('https://soundcloud.com/artist-name/track-name');
    expect(result).toBe('artist-name/track-name');
  });

  it('should handle URLs with dashes and underscores', () => {
    const result = extractSoundCloudInfo('https://soundcloud.com/artist_name-123/track-name_456');
    expect(result).toBe('artist_name-123/track-name_456');
  });

  it('should return null for invalid SoundCloud URL', () => {
    expect(extractSoundCloudInfo('https://www.example.com/audio')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(extractSoundCloudInfo('')).toBeNull();
  });

  it('should return null for SoundCloud URL without track path', () => {
    expect(extractSoundCloudInfo('https://soundcloud.com/artist-name')).toBeNull();
  });
});

describe('detectEmbedType', () => {
  describe('YouTube detection', () => {
    it('should detect and convert standard YouTube watch URL', () => {
      const result = detectEmbedType('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result).toEqual({
        type: 'youtube',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        originalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      });
    });

    it('should detect and convert YouTube short URL', () => {
      const result = detectEmbedType('https://youtu.be/dQw4w9WgXcQ');
      expect(result).toEqual({
        type: 'youtube',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        originalUrl: 'https://youtu.be/dQw4w9WgXcQ',
      });
    });
  });

  describe('Vimeo detection', () => {
    it('should detect and convert Vimeo URL', () => {
      const result = detectEmbedType('https://vimeo.com/123456789');
      expect(result).toEqual({
        type: 'vimeo',
        embedUrl: 'https://player.vimeo.com/video/123456789',
        originalUrl: 'https://vimeo.com/123456789',
      });
    });
  });

  describe('Spotify detection', () => {
    it('should detect and convert Spotify track URL', () => {
      const result = detectEmbedType('https://open.spotify.com/track/abc123xyz');
      expect(result).toEqual({
        type: 'spotify',
        embedUrl: 'https://open.spotify.com/embed/track/abc123xyz',
        originalUrl: 'https://open.spotify.com/track/abc123xyz',
      });
    });

    it('should detect and convert Spotify album URL', () => {
      const result = detectEmbedType('https://open.spotify.com/album/def456uvw');
      expect(result).toEqual({
        type: 'spotify',
        embedUrl: 'https://open.spotify.com/embed/album/def456uvw',
        originalUrl: 'https://open.spotify.com/album/def456uvw',
      });
    });
  });

  describe('SoundCloud detection', () => {
    it('should detect and convert SoundCloud URL', () => {
      const result = detectEmbedType('https://soundcloud.com/artist-name/track-name');
      expect(result).toEqual({
        type: 'soundcloud',
        embedUrl:
          'https://w.soundcloud.com/player/?url=https://soundcloud.com/artist-name/track-name',
        originalUrl: 'https://soundcloud.com/artist-name/track-name',
      });
    });
  });

  describe('Generic embed fallback', () => {
    it('should return generic type for unknown URLs', () => {
      const url = 'https://www.example.com/video';
      const result = detectEmbedType(url);
      expect(result).toEqual({
        type: 'generic',
        embedUrl: url,
        originalUrl: url,
      });
    });

    it('should return generic type for invalid YouTube URL', () => {
      const url = 'https://www.youtube.com/invalid';
      const result = detectEmbedType(url);
      expect(result).toEqual({
        type: 'generic',
        embedUrl: url,
        originalUrl: url,
      });
    });

    it('should return generic type for invalid Spotify URL', () => {
      const url = 'https://open.spotify.com/invalid';
      const result = detectEmbedType(url);
      expect(result).toEqual({
        type: 'generic',
        embedUrl: url,
        originalUrl: url,
      });
    });

    it('should return generic type for invalid Vimeo URL', () => {
      const url = 'https://vimeo.com/invalid-no-id';
      const result = detectEmbedType(url);
      expect(result).toEqual({
        type: 'generic',
        embedUrl: url,
        originalUrl: url,
      });
    });

    it('should return generic type for invalid SoundCloud URL', () => {
      const url = 'https://soundcloud.com/';
      const result = detectEmbedType(url);
      expect(result).toEqual({
        type: 'generic',
        embedUrl: url,
        originalUrl: url,
      });
    });
  });

  describe('Mixcloud detection', () => {
    it('should convert a public show URL to the player widget', () => {
      const url = 'https://www.mixcloud.com/ynotradio/rodney-anonymous-6526/';
      const result = detectEmbedType(url);
      expect(result.type).toBe('mixcloud');
      expect(result.embedUrl).toBe(
        'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&feed=%2Fynotradio%2Frodney-anonymous-6526%2F',
      );
      expect(result.originalUrl).toBe(url);
    });

    it('should pass through an existing player-widget URL', () => {
      const url = 'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&feed=%2Fynotradio%2Fshow%2F';
      const result = detectEmbedType(url);
      expect(result).toEqual({ type: 'mixcloud', embedUrl: url, originalUrl: url });
    });

    it('should pass through the legacy www.mixcloud.com/widget/iframe/ URL unchanged', () => {
      // The format actually stored in ~180 of the 35 active custom-text pages
      // (e.g. rodney-anonymous): the widget path on the plain www.mixcloud.com
      // host, predating the player-widget.mixcloud.com host. Re-deriving the
      // feed from the path here would read "/widget/iframe/" itself as the
      // feed and produce a broken embed.
      const url = 'https://www.mixcloud.com/widget/iframe/?hide_cover=1&'
        + 'feed=%2Fynotradio%2Frodney-anonymous-tells-you-how-to-live-9823%2F';
      const result = detectEmbedType(url);
      expect(result).toEqual({ type: 'mixcloud', embedUrl: url, originalUrl: url });
    });

    it('should fall back to generic for a genre/hub URL', () => {
      const url = 'https://www.mixcloud.com/genres/british%2Bynotradio/?order=latest';
      const result = detectEmbedType(url);
      expect(result.type).toBe('generic');
    });
  });

  describe('OpenDrive detection', () => {
    it('should pass through an OpenDrive player URL', () => {
      const url = 'https://www.opendrive.com/player/216190430_XqukK';
      const result = detectEmbedType(url);
      expect(result).toEqual({ type: 'opendrive', embedUrl: url, originalUrl: url });
    });
  });

  describe('Live365 detection', () => {
    it('should pass through a Live365 embed player URL', () => {
      const url = 'https://live365.com/embed/player.html?station=a54553&s=xl&m=light';
      const result = detectEmbedType(url);
      expect(result).toEqual({ type: 'live365', embedUrl: url, originalUrl: url });
    });

    it('should pass through a Live365 "played" embed URL', () => {
      const url = 'https://live365.com/embed/played.html?station=a54553&s=lg&m=light';
      const result = detectEmbedType(url);
      expect(result.type).toBe('live365');
    });
  });
});

describe('extractMixcloudFeed', () => {
  it('should extract the feed path from a public show URL', () => {
    expect(extractMixcloudFeed('https://www.mixcloud.com/ynotradio/some-show/')).toBe(
      '/ynotradio/some-show/',
    );
  });

  it('should add a trailing slash when missing', () => {
    expect(extractMixcloudFeed('https://www.mixcloud.com/ynotradio/some-show')).toBe(
      '/ynotradio/some-show/',
    );
  });

  it('should return null for genre/hub URLs', () => {
    expect(extractMixcloudFeed('https://www.mixcloud.com/genres/punk%2Bynotradio/')).toBeNull();
  });

  it('should return null for a single-segment path', () => {
    expect(extractMixcloudFeed('https://www.mixcloud.com/ynotradio/')).toBeNull();
  });

  it('should return null for an unparseable URL', () => {
    expect(extractMixcloudFeed('not a url')).toBeNull();
  });
});
