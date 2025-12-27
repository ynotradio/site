/**
 * Unit tests for MusicBrainz API client
 *
 * Note: These tests make real API calls to MusicBrainz.
 * They should be run sparingly to respect rate limits.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { isKnownArtist, clearArtistCache } from './musicbrainz';

describe('musicbrainz', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearArtistCache();
  });

  it('should find well-known artists', async () => {
    const result = await isKnownArtist('The Beatles');
    expect(result).toBe(true);
  }, 10000); // 10 second timeout for API call

  it('should find artists with conjunctions', async () => {
    const result = await isKnownArtist('Simon & Garfunkel');
    expect(result).toBe(true);
  }, 10000);

  it('should return false for non-existent artists', async () => {
    const result = await isKnownArtist('Totally Made Up Band Name 12345');
    expect(result).toBe(false);
  }, 10000);

  it('should use cache for repeated lookups', async () => {
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

  it('should handle case-insensitive lookups', async () => {
    const result1 = await isKnownArtist('the beatles');
    const result2 = await isKnownArtist('THE BEATLES');
    const result3 = await isKnownArtist('The Beatles');

    expect(result1).toBe(true);
    expect(result2).toBe(true);
    expect(result3).toBe(true);
  }, 15000);
});
