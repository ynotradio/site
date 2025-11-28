import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fixImagePath, isImgurUrl } from './imageUploader';

// Note: createImageUploader requires a SanityClient which is complex to mock
// We test the pure utility functions directly

describe('imageUploader', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fixImagePath', () => {
    it('should return null for null input', () => {
      expect(fixImagePath(null, 'https://example.com')).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(fixImagePath(undefined, 'https://example.com')).toBeNull();
    });

    it('should return full URL as-is for http URL', () => {
      const url = 'http://example.com/image.jpg';
      expect(fixImagePath(url, 'https://base.com')).toBe(url);
    });

    it('should return full URL as-is for https URL', () => {
      const url = 'https://example.com/image.jpg';
      expect(fixImagePath(url, 'https://base.com')).toBe(url);
    });

    it('should combine relative path with base URL', () => {
      expect(fixImagePath('images/photo.jpg', 'https://example.com')).toBe(
        'https://example.com/images/photo.jpg',
      );
    });

    it('should handle base URL with trailing slash', () => {
      expect(fixImagePath('images/photo.jpg', 'https://example.com/')).toBe(
        'https://example.com/images/photo.jpg',
      );
    });

    it('should handle path with leading slash', () => {
      expect(fixImagePath('/images/photo.jpg', 'https://example.com')).toBe(
        'https://example.com/images/photo.jpg',
      );
    });

    it('should normalize Windows-style paths', () => {
      expect(fixImagePath('images\\photo.jpg', 'https://example.com')).toBe(
        'https://example.com/images/photo.jpg',
      );
    });
  });

  describe('isImgurUrl', () => {
    it('should return true for imgur.com URL', () => {
      expect(isImgurUrl('https://imgur.com/abc123')).toBe(true);
    });

    it('should return true for i.imgur.com URL', () => {
      expect(isImgurUrl('https://i.imgur.com/abc123.jpg')).toBe(true);
    });

    it('should return false for non-imgur URL', () => {
      expect(isImgurUrl('https://example.com/image.jpg')).toBe(false);
    });

    it('should return false for URL containing imgur in path', () => {
      expect(isImgurUrl('https://example.com/not-imgur-really')).toBe(false);
    });
  });
});
