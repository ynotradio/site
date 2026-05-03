/**
 * Unit tests for slug generation hooks
 *
 * Tests the custom slug generation for Songs, Records, Posts, and CdOfTheWeek.
 * - Songs/Records: "artist-name--title" format
 * - Posts: "YYYY-MM-DD--headline" format
 * - CdOfTheWeek: "YYYY-MM-DD--record-slug" format
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Payload } from 'payload';
import {
  slugifyText,
  slugifyHeadline,
  formatDatePrefix,
  buildMusicSlug,
  musicSlugify,
  generateMusicSlugBeforeChangeHook,
  resolveArtistName,
  setCdOfTheWeekSlugFromRecord,
} from './slugUtils';

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

describe('slugifyHeadline', () => {
  it('should strip HTML tags and slugify', () => {
    expect(slugifyHeadline('Hello <br> World')).toBe('hello-world');
  });

  it('should strip nested HTML tags', () => {
    expect(slugifyHeadline('<font color="red">Headline</font> Text')).toBe('headline-text');
  });

  it('should handle plain text the same as slugifyText', () => {
    expect(slugifyHeadline('Simple Headline')).toBe('simple-headline');
  });

  it('should return empty string for HTML-only input', () => {
    expect(slugifyHeadline('<br><br>')).toBe('');
  });

  it('should return empty string for empty input', () => {
    expect(slugifyHeadline('')).toBe('');
  });
});

describe('formatDatePrefix', () => {
  it('should format date as YYYY-MM-DD', () => {
    expect(formatDatePrefix(new Date('2014-10-20T12:00:00Z'))).toBe('2014-10-20');
  });

  it('should handle midnight UTC dates', () => {
    expect(formatDatePrefix(new Date('2026-01-01T00:00:00Z'))).toBe('2026-01-01');
  });

  it('should handle end-of-year dates', () => {
    expect(formatDatePrefix(new Date('2025-12-31T23:59:59Z'))).toBe('2025-12-31');
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

  it('should generate artist--title slug when artist is an ID (async)', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      name: 'The Beatles',
    });

    const result = musicSlugify({
      data: { artist: 1, title: 'Hey Jude' },
      req: createMockReq(mockPayload) as any,
    });

    // Artist ID requires DB lookup, so returns a Promise
    expect(result).toBeInstanceOf(Promise);
    expect(await result).toBe('the-beatles--hey-jude');
    expect(mockPayload.findByID).toHaveBeenCalledWith({
      collection: 'artists',
      id: 1,
    });
  });

  it('should return pre-computed slug synchronously when data.slug was set by collection hook', () => {
    // Simulates the generateMusicSlugBeforeChangeHook having already run and
    // set data.slug before Payload's field-level generateSlug hook calls musicSlugify.
    // This is the fix for the async-Promise validation bug on create/update.
    const result = musicSlugify({
      data: { artist: 1, title: 'Hey Jude', slug: 'the-beatles--hey-jude' },
      req: createMockReq(mockPayload) as any,
    });

    expect(result).toBe('the-beatles--hey-jude');
    expect(result).not.toBeInstanceOf(Promise);
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('should generate artist--title slug from populated artist object (sync)', () => {
    const result = musicSlugify({
      data: { artist: { id: 1, name: 'Pink Floyd' }, title: 'Comfortably Numb' },
      req: createMockReq(mockPayload) as any,
    });

    // Populated artist = synchronous return
    expect(result).toBe('pink-floyd--comfortably-numb');
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('should return title-only slug when populated artist has empty name', () => {
    const result = musicSlugify({
      data: { artist: { id: 1, name: '' }, title: 'Some Song' },
      req: createMockReq(mockPayload) as any,
    });

    // Empty artist name falls back to title-only slug
    expect(result).toBe('some-song');
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('should return title-only slug when populated artist has null name', () => {
    const result = musicSlugify({
      data: { artist: { id: 1, name: null }, title: 'Another Song' },
      req: createMockReq(mockPayload) as any,
    });

    expect(result).toBe('another-song');
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('should generate title-only slug when no artist (sync)', () => {
    const result = musicSlugify({
      data: { title: 'Unknown Song' },
      req: createMockReq(mockPayload) as any,
    });

    expect(result).toBe('unknown-song');
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('should return undefined when no title (sync)', () => {
    const result = musicSlugify({
      data: {},
      req: createMockReq(mockPayload) as any,
    });

    expect(result).toBeUndefined();
  });

  it('should handle artist fetch error gracefully (async)', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB error'));

    const result = await musicSlugify({
      data: { artist: 999, title: 'Test Song' },
      req: createMockReq(mockPayload) as any,
    });

    expect(result).toBe('test-song');
  });

  it('should handle special characters in artist and title (sync)', () => {
    const result = musicSlugify({
      data: { artist: { id: 1, name: "Guns N' Roses" }, title: "Sweet Child O' Mine" },
      req: createMockReq(mockPayload) as any,
    });

    expect(result).toBe('guns-n-roses--sweet-child-o-mine');
  });

  it('should preserve pre-existing slug when title cannot be slugified (sync)', () => {
    const result = musicSlugify({
      data: { artist: 1, title: '♪♫★', slug: 'legacy-song-5491' },
      req: createMockReq(mockPayload) as any,
      valueToSlugify: 'legacy-song-5491',
    });

    // Returns synchronously — critical for Payload's generateSlug wrapper
    expect(result).toBe('legacy-song-5491');
    expect(result).not.toBeInstanceOf(Promise);
  });

  it('should return pre-computed slug synchronously even with numeric artist ID', () => {
    const result = musicSlugify({
      data: { artist: 1, title: 'Hey Jude' },
      req: createMockReq(mockPayload) as any,
      valueToSlugify: 'the-beatles--hey-jude',
    });

    // Pre-computed slug differs from title → returns synchronously
    expect(result).toBe('the-beatles--hey-jude');
    expect(result).not.toBeInstanceOf(Promise);
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('should return undefined when title cannot be slugified and no slug exists (sync)', () => {
    const result = musicSlugify({
      data: { artist: 1, title: '♪♫★' },
      req: createMockReq(mockPayload) as any,
    });

    expect(result).toBeUndefined();
  });

  it('should handle artist object with id (no name) via async DB lookup', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      name: 'Led Zeppelin',
    });

    const result = await musicSlugify({
      data: { artist: { id: 1 }, title: 'Stairway to Heaven' },
      req: createMockReq(mockPayload) as any,
    });

    expect(result).toBe('led-zeppelin--stairway-to-heaven');
    expect(mockPayload.findByID).toHaveBeenCalledWith({
      collection: 'artists',
      id: 1,
    });
  });

  it('should return title-only slug when artist DB lookup returns record with no name', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 });

    const result = await musicSlugify({
      data: { artist: 1, title: 'Mystery Song' },
      req: createMockReq(mockPayload) as any,
    });

    expect(result).toBe('mystery-song');
  });

  it('should return raw valueToSlugify when title and valueToSlugify both contain only special chars', () => {
    const result = musicSlugify({
      data: { title: '♪♫★' },
      req: createMockReq(mockPayload) as any,
      valueToSlugify: '♪♫★',
    });

    expect(result).toBe('♪♫★');
    expect(result).not.toBeInstanceOf(Promise);
  });
});

describe('buildMusicSlug', () => {
  it('returns title slug when artist name slugifies to empty string', () => {
    // Artist name contains only special characters — slugifyText returns ''
    expect(buildMusicSlug('♪♫★', 'my-song')).toBe('my-song');
  });

  it('returns artist--title when both slugify successfully', () => {
    expect(buildMusicSlug('Miles Davis', 'kind-of-blue')).toBe('miles-davis--kind-of-blue');
  });

  it('returns title slug when artistName is empty string', () => {
    expect(buildMusicSlug('', 'my-song')).toBe('my-song');
  });
});

describe('resolveArtistName', () => {
  let mockPayload: Partial<Payload>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPayload = {
      findByID: vi.fn(),
    };
  });

  it('returns empty string when no artist in data', async () => {
    const result = await resolveArtistName({}, mockPayload as Payload);
    expect(result).toBe('');
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('returns name directly from populated artist object', async () => {
    const result = await resolveArtistName(
      { artist: { id: 1, name: 'David Bowie' } },
      mockPayload as Payload,
    );
    expect(result).toBe('David Bowie');
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('performs DB lookup when artist is a numeric ID', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 7,
      name: 'Radiohead',
    });

    const result = await resolveArtistName({ artist: 7 }, mockPayload as Payload);

    expect(result).toBe('Radiohead');
    expect(mockPayload.findByID).toHaveBeenCalledWith({ collection: 'artists', id: 7 });
  });

  it('performs DB lookup when artist is an object with id but no name', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 3,
      name: 'The Cure',
    });

    const result = await resolveArtistName({ artist: { id: 3 } }, mockPayload as Payload);

    expect(result).toBe('The Cure');
    expect(mockPayload.findByID).toHaveBeenCalledWith({ collection: 'artists', id: 3 });
  });

  it('returns empty string on DB lookup failure', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB error'));

    const result = await resolveArtistName({ artist: 99 }, mockPayload as Payload);
    expect(result).toBe('');
  });

  it('returns empty string when DB lookup returns record without name', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 2 });

    const result = await resolveArtistName({ artist: 2 }, mockPayload as Payload);
    expect(result).toBe('');
  });
});

describe('generateMusicSlugBeforeChangeHook', () => {
  let mockPayload: Partial<Payload>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPayload = {
      findByID: vi.fn(),
    };
  });

  it('pre-computes artist--title slug when artist is a numeric ID', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 5,
      name: 'Tom Waits',
    });

    const data: Record<string, unknown> = { artist: 5, title: 'Tom Traubert Blues' };
    const result = await generateMusicSlugBeforeChangeHook({
      data,
      req: createMockReq(mockPayload) as any,
      operation: 'create',
    });

    expect(result.slug).toBe('tom-waits--tom-traubert-blues');
    expect(mockPayload.findByID).toHaveBeenCalledWith({ collection: 'artists', id: 5 });
  });

  it('sets title-only slug when artist DB lookup fails', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB error'));

    const data: Record<string, unknown> = { artist: 99, title: 'Unknown Artist Song' };
    const result = await generateMusicSlugBeforeChangeHook({
      data,
      req: createMockReq(mockPayload) as any,
      operation: 'create',
    });

    expect(result.slug).toBe('unknown-artist-song');
  });

  it('skips when artist is already a populated object with name', async () => {
    const data: Record<string, unknown> = {
      artist: { id: 1, name: 'Nina Simone' },
      title: 'Feeling Good',
    };
    const result = await generateMusicSlugBeforeChangeHook({
      data,
      req: createMockReq(mockPayload) as any,
      operation: 'create',
    });

    // musicSlugify handles populated objects synchronously; hook should not touch slug
    expect(result.slug).toBeUndefined();
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('skips when no artist present', async () => {
    const data: Record<string, unknown> = { title: 'No Artist Song' };
    const result = await generateMusicSlugBeforeChangeHook({
      data,
      req: createMockReq(mockPayload) as any,
      operation: 'create',
    });

    expect(result.slug).toBeUndefined();
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('skips when no title present', async () => {
    const data: Record<string, unknown> = { artist: 5 };
    const result = await generateMusicSlugBeforeChangeHook({
      data,
      req: createMockReq(mockPayload) as any,
      operation: 'create',
    });

    expect(result.slug).toBeUndefined();
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('respects manual slug override (generateSlug = false)', async () => {
    const data: Record<string, unknown> = {
      artist: 5,
      title: 'Test Song',
      slug: 'my-custom-slug',
      generateSlug: false,
    };
    const result = await generateMusicSlugBeforeChangeHook({
      data,
      req: createMockReq(mockPayload) as any,
      operation: 'update',
    });

    // Should preserve manual slug, not overwrite it
    expect(result.slug).toBe('my-custom-slug');
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('handles title with special characters gracefully', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 5,
      name: "Sinead O'Connor",
    });

    const data: Record<string, unknown> = { artist: 5, title: 'Nothing Compares 2 U' };
    const result = await generateMusicSlugBeforeChangeHook({
      data,
      req: createMockReq(mockPayload) as any,
      operation: 'create',
    });

    expect(result.slug).toBe('sinead-oconnor--nothing-compares-2-u');
  });

  it('skips when title cannot be slugified', async () => {
    const data: Record<string, unknown> = { artist: 5, title: '♪♫★' };
    const result = await generateMusicSlugBeforeChangeHook({
      data,
      req: createMockReq(mockPayload) as any,
      operation: 'create',
    });

    expect(result.slug).toBeUndefined();
    expect(mockPayload.findByID).not.toHaveBeenCalled();
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

  it('should generate date-prefixed slug from associated record (ID)', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 10,
      slug: 'pink-floyd--the-dark-side-of-the-moon',
    });

    const result = await setCdOfTheWeekSlugFromRecord({
      data: { record: 10, date: '2026-01-15' },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.slug).toBe('2026-01-15--pink-floyd--the-dark-side-of-the-moon');
    expect(mockPayload.findByID).toHaveBeenCalledWith({
      collection: 'records',
      id: 10,
    });
  });

  it('should generate date-prefixed slug from populated record object', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 10,
      slug: 'the-beatles--abbey-road',
    });

    const result = await setCdOfTheWeekSlugFromRecord({
      data: { record: { id: 10 }, date: '2026-03-01' },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.slug).toBe('2026-03-01--the-beatles--abbey-road');
  });

  it('should use record slug without prefix when no date', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 10,
      slug: 'the-beatles--abbey-road',
    });

    const result = await setCdOfTheWeekSlugFromRecord({
      data: { record: 10 },
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

  it('should leave slug unchanged when found record has no slug', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 10,
      // no slug field
    });

    const result = await setCdOfTheWeekSlugFromRecord({
      data: { record: 10, date: '2026-01-15' },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.slug).toBeUndefined();
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
