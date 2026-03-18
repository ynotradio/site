import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Payload } from 'payload';

// Mock modules that pull in Payload CMS runtime / Next.js config
vi.mock('@payload-config', () => ({ default: {} }));
vi.mock('payload', () => ({ getPayload: vi.fn() }));

const { generateNameSlug, generatePostSlug, generateMusicSlug, generateCdOfTheWeekSlug } = await import('./integrity-check-slugs');

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
  it('generates date-prefixed slug from headline and startDate', () => {
    expect(generatePostSlug({ headline: 'Hello World', startDate: '2014-10-20T12:00:00Z' })).toBe(
      '2014-10-20--hello-world',
    );
  });

  it('strips HTML tags from headline', () => {
    expect(
      generatePostSlug({ headline: '<b>Bold</b> and <i>Italic</i>', startDate: '2025-06-15' }),
    ).toBe('2025-06-15--bold-and-italic');
  });

  it('returns headline-only slug when no startDate', () => {
    expect(generatePostSlug({ headline: 'No Date Post' })).toBe('no-date-post');
  });

  it('returns null when no headline', () => {
    expect(generatePostSlug({ startDate: '2025-01-01' })).toBeNull();
  });

  it('returns null when headline is empty', () => {
    expect(generatePostSlug({ headline: '' })).toBeNull();
  });

  it('returns null when headline produces empty slug', () => {
    expect(generatePostSlug({ headline: '<br/><hr/>', startDate: '2025-01-01' })).toBeNull();
  });

  it('handles special characters in headline', () => {
    expect(generatePostSlug({ headline: "What's New in 2024!", startDate: '2024-03-15' })).toBe(
      '2024-03-15--whats-new-in-2024',
    );
  });

  it('preserves the double-hyphen separator between date and slug', () => {
    const result = generatePostSlug({
      headline: 'Courtney Barnett Radio Takeover',
      startDate: '2014-10-20',
    });
    expect(result).toBe('2014-10-20--courtney-barnett-radio-takeover');
    // Verify the -- separator is present
    expect(result!.match(/^\d{4}-\d{2}-\d{2}--/)).toBeTruthy();
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
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('not found'));
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

  it('generates date-prefixed slug from associated record', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      title: 'Album Title',
      artist: { name: 'Great Artist', id: 5 },
    });
    const doc = { record: 10, date: '2026-01-15' };
    const result = await generateCdOfTheWeekSlug(mockPayload, doc);
    expect(result).toBe('2026-01-15--great-artist--album-title');
    expect(mockPayload.findByID).toHaveBeenCalledWith({
      collection: 'records',
      id: 10,
      depth: 1,
    });
  });

  it('handles populated record object with date', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      title: 'Record Title',
      artist: { name: 'Some Band', id: 3 },
    });
    const doc = { record: { id: 7 }, date: '2026-03-01' };
    const result = await generateCdOfTheWeekSlug(mockPayload, doc);
    expect(result).toBe('2026-03-01--some-band--record-title');
  });

  it('returns record slug without date prefix when no date', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      title: 'Album',
      artist: { name: 'Artist', id: 1 },
    });
    const doc = { record: 5 };
    const result = await generateCdOfTheWeekSlug(mockPayload, doc);
    expect(result).toBe('artist--album');
  });

  it('returns null when record is missing', async () => {
    const doc = {};
    const result = await generateCdOfTheWeekSlug(mockPayload, doc);
    expect(result).toBeNull();
  });

  it('returns null when record lookup fails', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('not found'));
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
