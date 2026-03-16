/**
 * Unit tests for music slug generation hooks
 *
 * Tests the custom slug generation for Songs, Records, and CdOfTheWeek.
 * - Songs/Records: "artist-name--title" format
 * - CdOfTheWeek: inherits slug from associated record
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Payload } from 'payload';
import { slugifyText, musicSlugify, setCdOfTheWeekSlugFromRecord } from './musicSlugify';

// Helper to create a mock request object
const createMockReq = (payload: Partial<Payload>) => ({
  payload: payload as Payload,
});

describe('slugifyText', () => {
  it('should convert text to lowercase with hyphens', () => {
    expect(slugifyText('Hello World')).toBe('hello-world');
  });

  it('should remove special characters', () => {
    expect(slugifyText('Rock & Roll! (Yeah)')).toBe('rock-roll-yeah');
  });

  it('should handle already slugified text', () => {
    expect(slugifyText('already-slug')).toBe('already-slug');
  });
});

describe('musicSlugify (Songs/Records)', () => {
  let mockPayload: Partial<Payload>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPayload = {
      findByID: vi.fn(),
    };
  });

  it('should generate artist--title slug when artist is an ID', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      name: 'The Beatles',
    });

    const result = await musicSlugify({
      data: { artist: 1, title: 'Hey Jude' },
      req: createMockReq(mockPayload) as any,
    });

    expect(result).toBe('the-beatles--hey-jude');
    expect(mockPayload.findByID).toHaveBeenCalledWith({
      collection: 'artists',
      id: 1,
    });
  });

  it('should generate artist--title slug from populated artist object', async () => {
    const result = await musicSlugify({
      data: { artist: { id: 1, name: 'Pink Floyd' }, title: 'Comfortably Numb' },
      req: createMockReq(mockPayload) as any,
    });

    expect(result).toBe('pink-floyd--comfortably-numb');
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('should generate title-only slug when no artist', async () => {
    const result = await musicSlugify({
      data: { title: 'Unknown Song' },
      req: createMockReq(mockPayload) as any,
    });

    expect(result).toBe('unknown-song');
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('should return undefined when no title', async () => {
    const result = await musicSlugify({
      data: {},
      req: createMockReq(mockPayload) as any,
    });

    expect(result).toBeUndefined();
  });

  it('should handle artist fetch error gracefully', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB error'));

    const result = await musicSlugify({
      data: { artist: 999, title: 'Test Song' },
      req: createMockReq(mockPayload) as any,
    });

    expect(result).toBe('test-song');
  });

  it('should handle special characters in artist and title', async () => {
    const result = await musicSlugify({
      data: { artist: { id: 1, name: "Guns N' Roses" }, title: "Sweet Child O' Mine" },
      req: createMockReq(mockPayload) as any,
    });

    expect(result).toBe('guns-n-roses--sweet-child-o-mine');
  });

  it('should preserve pre-existing slug when title cannot be slugified', async () => {
    const result = await musicSlugify({
      data: { artist: 1, title: '♪♫★', slug: 'legacy-song-5491' },
      req: createMockReq(mockPayload) as any,
      valueToSlugify: 'legacy-song-5491',
    });

    expect(result).toBe('legacy-song-5491');
  });

  it('should return undefined when title cannot be slugified and no slug exists', async () => {
    const result = await musicSlugify({
      data: { artist: 1, title: '♪♫★' },
      req: createMockReq(mockPayload) as any,
    });

    expect(result).toBeUndefined();
  });
});

describe('setCdOfTheWeekSlugFromRecord', () => {
  let mockPayload: Partial<Payload>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPayload = {
      findByID: vi.fn(),
    };
  });

  it('should copy slug from associated record (ID)', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 10,
      slug: 'pink-floyd--the-dark-side-of-the-moon',
    });

    const result = await setCdOfTheWeekSlugFromRecord({
      data: { record: 10, date: '2026-01-01' },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.slug).toBe('pink-floyd--the-dark-side-of-the-moon');
    expect(mockPayload.findByID).toHaveBeenCalledWith({
      collection: 'records',
      id: 10,
    });
  });

  it('should copy slug from populated record object', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 10,
      slug: 'the-beatles--abbey-road',
    });

    const result = await setCdOfTheWeekSlugFromRecord({
      data: { record: { id: 10 }, date: '2026-01-01' },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.slug).toBe('the-beatles--abbey-road');
  });

  it('should not change data when no record is set', async () => {
    const result = await setCdOfTheWeekSlugFromRecord({
      data: { date: '2026-01-01' },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.slug).toBeUndefined();
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('should handle record fetch error gracefully', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB error'));

    const result = await setCdOfTheWeekSlugFromRecord({
      data: { record: 999, date: '2026-01-01' },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.slug).toBeUndefined();
  });
});
