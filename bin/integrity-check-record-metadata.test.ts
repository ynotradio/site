import { describe, it, expect } from 'vitest';
import {
  normalizeMbDate,
  buildFieldResults,
  type RecordCheckContext,
  type MbLookupResult,
} from './integrity-check-record-metadata-utils';

// ---------------------------------------------------------------------------
// normalizeMbDate
// ---------------------------------------------------------------------------

describe('normalizeMbDate', () => {
  it('returns full date as-is', () => {
    expect(normalizeMbDate('2021-06-15')).toBe('2021-06-15');
  });

  it('normalizes year-month to first of month', () => {
    expect(normalizeMbDate('2021-06')).toBe('2021-06-01');
  });

  it('normalizes year-only to January 1st', () => {
    expect(normalizeMbDate('2021')).toBe('2021-01-01');
  });

  it('returns null for empty string', () => {
    expect(normalizeMbDate('')).toBeNull();
  });

  it('returns null for whitespace-only', () => {
    expect(normalizeMbDate('   ')).toBeNull();
  });

  it('returns null for unrecognised format', () => {
    expect(normalizeMbDate('June 2021')).toBeNull();
  });

  it('trims whitespace before matching', () => {
    expect(normalizeMbDate('  2021  ')).toBe('2021-01-01');
    expect(normalizeMbDate(' 2021-06 ')).toBe('2021-06-01');
  });
});

// ---------------------------------------------------------------------------
// buildFieldResults — all fields present
// ---------------------------------------------------------------------------

describe('buildFieldResults', () => {
  const baseCtx: RecordCheckContext = {
    id: 'rec-1',
    title: 'OK Computer',
    artistName: 'Radiohead',
    label: 'Parlophone',
    releaseDate: '1997-06-16',
    coverImage: 'media-42',
    musicbrainzId: 'mbid-abc',
  };

  const emptyMb: MbLookupResult = {
    mbid: null,
    details: null,
    coverArtUrl: null,
    mbidSource: 'none',
  };

  it('returns three OK results when all fields present', () => {
    const results = buildFieldResults(baseCtx, emptyMb);
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.status === 'ok')).toBe(true);
    expect(results.map((r) => r.field)).toEqual(['label', 'releaseDate', 'coverImage']);
  });

  it('sets correct identifier with artist name', () => {
    const results = buildFieldResults(baseCtx, emptyMb);
    expect(results[0].identifier).toBe('Radiohead — OK Computer');
  });

  it('uses title only when no artist name', () => {
    const ctx = { ...baseCtx, artistName: null };
    const results = buildFieldResults(ctx, emptyMb);
    expect(results[0].identifier).toBe('OK Computer');
  });

  // -------------------------------------------------------------------------
  // Missing fields with MB data available
  // -------------------------------------------------------------------------

  describe('missing fields with MB data', () => {
    const mbWithData: MbLookupResult = {
      mbid: 'mbid-abc',
      details: {
        id: 'mbid-abc',
        title: 'OK Computer',
        label: 'Parlophone',
        date: '1997-06',
        country: 'GB',
      },
      coverArtUrl: 'https://coverartarchive.org/release/mbid-abc/front.jpg',
      mbidSource: 'existing',
    };

    it('reports missing label with expected value from MB', () => {
      const ctx = { ...baseCtx, label: null };
      const results = buildFieldResults(ctx, mbWithData);
      const labelResult = results.find((r) => r.field === 'label')!;
      expect(labelResult.status).toBe('missing');
      expect(labelResult.expectedValue).toBe('Parlophone');
      expect(labelResult.currentValue).toBe('(empty)');
    });

    it('reports missing releaseDate with normalized expected value', () => {
      const ctx = { ...baseCtx, releaseDate: null };
      const results = buildFieldResults(ctx, mbWithData);
      const dateResult = results.find((r) => r.field === 'releaseDate')!;
      expect(dateResult.status).toBe('missing');
      expect(dateResult.expectedValue).toBe('1997-06-01');
    });

    it('reports missing coverImage with expected URL', () => {
      const ctx = { ...baseCtx, coverImage: null };
      const results = buildFieldResults(ctx, mbWithData);
      const coverResult = results.find((r) => r.field === 'coverImage')!;
      expect(coverResult.status).toBe('missing');
      expect(coverResult.expectedValue).toContain('coverartarchive.org');
    });

    it('treats empty-string label as missing', () => {
      const ctx = { ...baseCtx, label: '   ' };
      const results = buildFieldResults(ctx, mbWithData);
      const labelResult = results.find((r) => r.field === 'label')!;
      expect(labelResult.status).toBe('missing');
    });

    it('treats empty-string releaseDate as missing', () => {
      const ctx = { ...baseCtx, releaseDate: '' };
      const results = buildFieldResults(ctx, mbWithData);
      const dateResult = results.find((r) => r.field === 'releaseDate')!;
      expect(dateResult.status).toBe('missing');
    });
  });

  // -------------------------------------------------------------------------
  // Missing fields without MB data
  // -------------------------------------------------------------------------

  describe('missing fields without MB data', () => {
    it('reports skipped when no MBID at all', () => {
      const ctx: RecordCheckContext = {
        ...baseCtx,
        label: null,
        releaseDate: null,
        coverImage: null,
        musicbrainzId: null,
      };
      const results = buildFieldResults(ctx, emptyMb);
      expect(results.every((r) => r.status === 'skipped')).toBe(true);
    });

    it('reports missing when MBID exists but MB has no info', () => {
      const mbNoInfo: MbLookupResult = {
        mbid: 'mbid-abc',
        details: { id: 'mbid-abc', title: 'Test' },
        coverArtUrl: null,
        mbidSource: 'existing',
      };
      const ctx = { ...baseCtx, label: null, releaseDate: null, coverImage: null };
      const results = buildFieldResults(ctx, mbNoInfo);

      const labelResult = results.find((r) => r.field === 'label')!;
      expect(labelResult.status).toBe('missing');
      expect(labelResult.detail).toContain('MB has no label info');

      const dateResult = results.find((r) => r.field === 'releaseDate')!;
      expect(dateResult.status).toBe('missing');
      expect(dateResult.detail).toContain('MB has no date info');

      const coverResult = results.find((r) => r.field === 'coverImage')!;
      expect(coverResult.status).toBe('missing');
      expect(coverResult.detail).toContain('No cover art in CAA');
    });
  });

  // -------------------------------------------------------------------------
  // Mixed scenarios
  // -------------------------------------------------------------------------

  describe('mixed field states', () => {
    it('handles some fields present, some missing', () => {
      const ctx: RecordCheckContext = {
        ...baseCtx,
        label: 'Parlophone',
        releaseDate: null,
        coverImage: null,
      };
      const mb: MbLookupResult = {
        mbid: 'mbid-abc',
        details: {
          id: 'mbid-abc',
          title: 'OK Computer',
          date: '1997',
        },
        coverArtUrl: 'https://example.com/cover.jpg',
        mbidSource: 'searched',
      };

      const results = buildFieldResults(ctx, mb);
      const labelResult = results.find((r) => r.field === 'label')!;
      const dateResult = results.find((r) => r.field === 'releaseDate')!;
      const coverResult = results.find((r) => r.field === 'coverImage')!;

      expect(labelResult.status).toBe('ok');
      expect(dateResult.status).toBe('missing');
      expect(dateResult.expectedValue).toBe('1997-01-01');
      expect(coverResult.status).toBe('missing');
    });
  });

  // -------------------------------------------------------------------------
  // Report generation with multiple field results per record
  // -------------------------------------------------------------------------

  describe('report generation', () => {
    it('produces three results per record', () => {
      const ctx = { ...baseCtx };
      const results = buildFieldResults(ctx, emptyMb);
      expect(results).toHaveLength(3);
      const fields = results.map((r) => r.field);
      expect(fields).toContain('label');
      expect(fields).toContain('releaseDate');
      expect(fields).toContain('coverImage');
    });

    it('all results share the same record id and collection', () => {
      const ctx = { ...baseCtx };
      const results = buildFieldResults(ctx, emptyMb);
      results.forEach((r) => {
        expect(r.id).toBe('rec-1');
        expect(r.collection).toBe('records');
      });
    });
  });
});
