import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Payload } from 'payload';

// Mock modules that pull in Payload CMS runtime / Next.js config
vi.mock('@payload-config', () => ({ default: {} }));
vi.mock('payload', () => ({ getPayload: vi.fn() }));

const {
  generateNameSlug,
  generatePostSlug,
  generateMusicSlug,
  generateCdOfTheWeekSlug,
} = await import('./integrity-check-slugs');

// ---------------------------------------------------------------------------
// generateNameSlug
// ---------------------------------------------------------------------------

describe('generateNameSlug', () => {
  it('slugifies a simple name', () => {
    expect(generateNameSlug('John Doe')).toBe('john-doe');
  });

  it('strips special characters', () => {
    expect(generateNameSlug("O'Brien & Partners")).toBe('obrien-partners');
  });

  it('handles unicode characters', () => {
    expect(generateNameSlug('Jos\u00e9 Garc\u00eda')).toBe('jos-garca');
  });

  it('collapses multiple spaces and hyphens', () => {
    expect(generateNameSlug('  Multiple   Spaces  ')).toBe('multiple-spaces');
  });

  it('returns empty string for empty input', () => {
    expect(generateNameSlug('')).toBe('');
  });

  it('removes leading/trailing hyphens', () => {
    expect(generateNameSlug('-leading-trailing-')).toBe('leading-trailing');
  });
});

// ---------------------------------------------------------------------------
// generatePostSlug
// ---------------------------------------------------------------------------

describe('generatePostSlug', () => {
  it('slugifies plain text headline', () => {
    expect(generatePostSlug('Hello World')).toBe('hello-world');
  });

  it('strips HTML tags', () => {
    expect(generatePostSlug('<b>Bold</b> and <i>Italic</i>')).toBe('bold-and-italic');
  });

  it('strips nested HTML tags', () => {
    expect(generatePostSlug('<p><a href="http://example.com">Link Text</a></p>'))
      .toBe('link-text');
  });

  it('handles special characters', () => {
    expect(generatePostSlug("What's New in 2024!")).toBe('whats-new-in-2024');
  });

  it('collapses multiple hyphens', () => {
    expect(generatePostSlug('Foo---Bar')).toBe('foo-bar');
  });

  it('removes leading/trailing hyphens', () => {
    expect(generatePostSlug('---Surrounded---')).toBe('surrounded');
  });

  it('handles empty string', () => {
    expect(generatePostSlug('')).toBe('');
  });

  it('handles only HTML tags', () => {
    expect(generatePostSlug('<br/><hr/>')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// generateMusicSlug
// ---------------------------------------------------------------------------

describe('generateMusicSlug', () => {
  const mockPayload = {
    findByID: vi.fn(),
  } as unknown as Payload;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates artist--title slug with populated artist', async () => {
    const doc = {
      title: 'My Song',
      artist: { name: 'The Band', id: 1 },
    };
    const result = await generateMusicSlug(mockPayload, doc);
    expect(result).toBe('the-band--my-song');
  });

  it('looks up artist by ID when not populated', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      name: 'Found Artist',
    });
    const doc = { title: 'Track', artist: 42 };
    const result = await generateMusicSlug(mockPayload, doc);
    expect(result).toBe('found-artist--track');
    expect(mockPayload.findByID).toHaveBeenCalledWith({
      collection: 'artists',
      id: 42,
    });
  });

  it('returns title-only slug when artist lookup fails', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>)
      .mockRejectedValue(new Error('not found'));
    const doc = { title: 'Solo Track', artist: 999 };
    const result = await generateMusicSlug(mockPayload, doc);
    expect(result).toBe('solo-track');
  });

  it('returns title-only slug when no artist', async () => {
    const doc = { title: 'Instrumental' };
    const result = await generateMusicSlug(mockPayload, doc);
    expect(result).toBe('instrumental');
  });

  it('returns null when title is missing', async () => {
    const doc = { artist: { name: 'Band', id: 1 } };
    const result = await generateMusicSlug(mockPayload, doc);
    expect(result).toBeNull();
  });

  it('returns null when title produces empty slug', async () => {
    const doc = { title: '\u266a\u266b\u2605', artist: { name: 'Band', id: 1 } };
    const result = await generateMusicSlug(mockPayload, doc);
    expect(result).toBeNull();
  });

  it('returns title-only slug when artist name is empty string', async () => {
    const doc = { title: 'Song', artist: { name: '', id: 1 } };
    const result = await generateMusicSlug(mockPayload, doc);
    expect(result).toBe('song');
  });
});

// ---------------------------------------------------------------------------
// generateCdOfTheWeekSlug
// ---------------------------------------------------------------------------

describe('generateCdOfTheWeekSlug', () => {
  const mockPayload = {
    findByID: vi.fn(),
  } as unknown as Payload;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('derives slug from associated record with populated artist', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      title: 'Album Title',
      artist: { name: 'Great Artist', id: 5 },
    });
    const doc = { record: 10 };
    const result = await generateCdOfTheWeekSlug(mockPayload, doc);
    expect(result).toBe('great-artist--album-title');
    expect(mockPayload.findByID).toHaveBeenCalledWith({
      collection: 'records',
      id: 10,
      depth: 1,
    });
  });

  it('handles populated record object', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      title: 'Record Title',
      artist: { name: 'Some Band', id: 3 },
    });
    const doc = { record: { id: 7 } };
    const result = await generateCdOfTheWeekSlug(mockPayload, doc);
    expect(result).toBe('some-band--record-title');
    expect(mockPayload.findByID).toHaveBeenCalledWith({
      collection: 'records',
      id: 7,
      depth: 1,
    });
  });

  it('returns null when record is missing', async () => {
    const doc = {};
    const result = await generateCdOfTheWeekSlug(mockPayload, doc);
    expect(result).toBeNull();
  });

  it('returns null when record lookup fails', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>)
      .mockRejectedValue(new Error('not found'));
    const doc = { record: 999 };
    const result = await generateCdOfTheWeekSlug(mockPayload, doc);
    expect(result).toBeNull();
  });

  it('returns null when record has no data', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const doc = { record: 5 };
    const result = await generateCdOfTheWeekSlug(mockPayload, doc);
    expect(result).toBeNull();
  });
});
