/**
 * Unit tests for MusicBrainz API client
 *
 * The getMbEntityType tests use mocked fetch and run in CI.
 * The isKnownArtist tests make real API calls and are skipped in CI.
 */

import {
  describe, it, expect, beforeEach, vi, afterEach,
} from 'vitest';
import { isKnownArtist, clearArtistCache, getMbEntityType } from './musicbrainz';

// Skip these tests in CI as they require external API access
const shouldSkip = process.env.CI === 'true';
const testFn = shouldSkip ? it.skip : it;

describe('musicbrainz', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearArtistCache();
  });

  testFn('should find well-known artists', async () => {
    const result = await isKnownArtist('The Beatles');
    expect(result).toBe(true);
  }, 10000); // 10 second timeout for API call

  testFn('should find artists with conjunctions', async () => {
    const result = await isKnownArtist('Simon & Garfunkel');
    expect(result).toBe(true);
  }, 10000);

  testFn('should return false for non-existent artists', async () => {
    const result = await isKnownArtist('Totally Made Up Band Name 12345');
    expect(result).toBe(false);
  }, 10000);

  testFn('should use cache for repeated lookups', async () => {
    // First call
    const start1 = Date.now();
    await isKnownArtist('The Beatles');
    const duration1 = Date.now() - start1;

    // Second call (should be cached)
    const start2 = Date.now();
    await isKnownArtist('The Beatles');
    const duration2 = Date.now() - start2;

    // Cached call should be much faster (< 10ms vs > 1000ms for API call)
    expect(duration2).toBeLessThan(10);
    expect(duration1).toBeGreaterThan(duration2);
  }, 15000);

  testFn('should handle case-insensitive lookups', async () => {
    const result1 = await isKnownArtist('the beatles');
    const result2 = await isKnownArtist('THE BEATLES');
    const result3 = await isKnownArtist('The Beatles');

    expect(result1).toBe(true);
    expect(result2).toBe(true);
    expect(result3).toBe(true);
  }, 15000);
});

describe('getMbEntityType', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('should return "artist" when the artist endpoint returns 200', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true, status: 200 } as Response);
    const result = await getMbEntityType('some-mbid');
    expect(result).toBe('artist');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toContain('/artist/');
  });

  it('should return "release" when artist returns 404 but release returns 200', async () => {
    fetchSpy
      .mockResolvedValueOnce({ ok: false, status: 404 } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200 } as Response);
    const result = await getMbEntityType('some-mbid');
    expect(result).toBe('release');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('should return "recording" when artist and release return 404', async () => {
    fetchSpy
      .mockResolvedValueOnce({ ok: false, status: 404 } as Response)
      .mockResolvedValueOnce({ ok: false, status: 404 } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200 } as Response);
    const result = await getMbEntityType('some-mbid');
    expect(result).toBe('recording');
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('should return null when all endpoints return 404', async () => {
    fetchSpy
      .mockResolvedValueOnce({ ok: false, status: 404 } as Response)
      .mockResolvedValueOnce({ ok: false, status: 404 } as Response)
      .mockResolvedValueOnce({ ok: false, status: 404 } as Response);
    const result = await getMbEntityType('nonexistent-mbid');
    expect(result).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('should skip to next endpoint on network error', async () => {
    fetchSpy
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: true, status: 200 } as Response);
    const result = await getMbEntityType('some-mbid');
    expect(result).toBe('release');
  });

  it('should return null when all endpoints throw', async () => {
    fetchSpy
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'));
    const result = await getMbEntityType('bad-mbid');
    expect(result).toBeNull();
  });

  it('should continue on non-404 error status', async () => {
    fetchSpy
      .mockResolvedValueOnce({ ok: false, status: 503 } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200 } as Response);
    const result = await getMbEntityType('some-mbid');
    expect(result).toBe('release');
  });
});
