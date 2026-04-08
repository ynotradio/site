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
  detectEmbedType,
} from './utils';

describe('extractYouTubeId', () => {
  it('should extract ID from standard watch URL', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    );
  });

  it('should extract ID from short URL', () => {
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('should extract ID from embed URL', () => {
    expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    );
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
    const result = extractSoundCloudInfo(
      'https://soundcloud.com/artist_name-123/track-name_456',
    );
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
});
