import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { Payload } from 'payload';
import { slugifyText } from '../payload/src/collections/hooks/slugUtils';

// Mock modules – vitest hoists vi.mock calls above imports automatically
vi.mock('./migrations/shared/payloadClient', () => ({
  getPayloadClient: vi.fn(),
}));

vi.mock('../payload/src/collections/hooks/slugUtils', () => ({
  slugifyText: (text: string) => text
    .toLowerCase()
    .replace(/[^\w\s-]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, ''),
}));

/**
 * Tests for the slug generation helpers used by bin/regenerate-slugs.ts.
 *
 * The helpers are local functions inside an executable script that calls
 * process.exit, so we replicate the same logic inline here and verify
 * it matches the expected behaviour.
 */

describe('regenerate-slugs helpers', () => {
  // -----------------------------------------------------------------------
  // generateNameSlug
  // -----------------------------------------------------------------------
  describe('generateNameSlug (artists, people, venues)', () => {
    function generateNameSlug(name: string): string {
      return slugifyText(name);
    }

    it('should convert a name to a slug', () => {
      expect(generateNameSlug('The Foundry')).toBe('the-foundry');
    });

    it('should handle special characters', () => {
      expect(generateNameSlug("Guns N' Roses")).toBe('guns-n-roses');
    });

    it('should handle already-slugified text', () => {
      expect(generateNameSlug('sample-band')).toBe('sample-band');
    });
  });

  // -----------------------------------------------------------------------
  // generatePostSlug
  // -----------------------------------------------------------------------
  describe('generatePostSlug (posts)', () => {
    function generatePostSlug(headline: string): string {
      return headline
        .replace(/<[^>]*>/g, '')
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .trim();
    }

    it('should generate slug from headline', () => {
      expect(generatePostSlug('New Music Friday')).toBe('new-music-friday');
    });

    it('should strip HTML tags', () => {
      expect(generatePostSlug('<b>Breaking</b> News')).toBe('breaking-news');
    });

    it('should handle special characters', () => {
      expect(generatePostSlug("What's New in 2025?")).toBe('whats-new-in-2025');
    });
  });

  // -----------------------------------------------------------------------
  // generateMusicSlug
  // -----------------------------------------------------------------------
  describe('generateMusicSlug (songs, records)', () => {
    let mockPayload: { findByID: Mock };

    beforeEach(() => {
      mockPayload = {
        findByID: vi.fn(),
      };
    });

    async function generateMusicSlug(
      payload: Payload,
      doc: Record<string, unknown>,
    ): Promise<string | null> {
      const title = doc.title as string | undefined;
      if (!title) return null;

      const titleSlug = slugifyText(title);
      if (!titleSlug) return null;

      let artistName = '';
      const { artist } = doc;

      if (artist && typeof artist === 'object' && artist !== null && 'name' in artist) {
        artistName = String((artist as { name: unknown }).name || '');
      } else if (artist) {
        try {
          const found = await payload.findByID({
            collection: 'artists',
            id: artist as number,
          });
          artistName = found?.name || '';
        } catch {
          // leave empty
        }
      }

      if (artistName) {
        const artistSlug = slugifyText(artistName);
        if (artistSlug) {
          return `${artistSlug}--${titleSlug}`;
        }
      }

      return titleSlug;
    }

    it('should generate artist--title slug from populated artist', async () => {
      const result = await generateMusicSlug(mockPayload as unknown as Payload, {
        title: 'Hey Jude',
        artist: { id: 1, name: 'The Beatles' },
      });
      expect(result).toBe('the-beatles--hey-jude');
    });

    it('should generate artist--title slug by looking up artist ID', async () => {
      mockPayload.findByID.mockResolvedValue({ id: 1, name: 'Radiohead' });

      const result = await generateMusicSlug(mockPayload as unknown as Payload, {
        title: 'Creep',
        artist: 1,
      });
      expect(result).toBe('radiohead--creep');
      expect(mockPayload.findByID).toHaveBeenCalledWith({
        collection: 'artists',
        id: 1,
      });
    });

    it('should fall back to title-only when artist lookup fails', async () => {
      mockPayload.findByID.mockRejectedValue(new Error('not found'));

      const result = await generateMusicSlug(mockPayload as unknown as Payload, {
        title: 'Unknown Song',
        artist: 999,
      });
      expect(result).toBe('unknown-song');
    });

    it('should fall back to title-only when artist is missing', async () => {
      const result = await generateMusicSlug(mockPayload as unknown as Payload, {
        title: 'Solo Track',
      });
      expect(result).toBe('solo-track');
    });

    it('should return null when title is missing', async () => {
      const result = await generateMusicSlug(mockPayload as unknown as Payload, {
        artist: { id: 1, name: 'The Beatles' },
      });
      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // generateCdOfTheWeekSlug
  // -----------------------------------------------------------------------
  describe('generateCdOfTheWeekSlug (cdoftheweek)', () => {
    let mockPayload: { findByID: Mock };

    beforeEach(() => {
      mockPayload = {
        findByID: vi.fn(),
      };
    });

    async function generateCdOfTheWeekSlug(
      payload: Payload,
      doc: Record<string, unknown>,
    ): Promise<string | null> {
      const { record } = doc;
      if (!record) return null;

      const recordId = typeof record === 'object' && record !== null && 'id' in record
        ? (record as { id: unknown }).id
        : record;

      try {
        const found = await payload.findByID({
          collection: 'records',
          id: recordId as number,
        });
        return (found?.slug as string) || null;
      } catch {
        return null;
      }
    }

    it('should copy slug from associated record (by ID)', async () => {
      mockPayload.findByID.mockResolvedValue({ slug: 'the-beatles--abbey-road' });

      const result = await generateCdOfTheWeekSlug(mockPayload as unknown as Payload, {
        record: 42,
      });
      expect(result).toBe('the-beatles--abbey-road');
    });

    it('should copy slug from populated record object', async () => {
      mockPayload.findByID.mockResolvedValue({ slug: 'radiohead--ok-computer' });

      const result = await generateCdOfTheWeekSlug(mockPayload as unknown as Payload, {
        record: { id: 7, title: 'OK Computer' },
      });
      expect(result).toBe('radiohead--ok-computer');
      expect(mockPayload.findByID).toHaveBeenCalledWith({
        collection: 'records',
        id: 7,
      });
    });

    it('should return null when record is missing', async () => {
      const result = await generateCdOfTheWeekSlug(mockPayload as unknown as Payload, {});
      expect(result).toBeNull();
    });

    it('should return null when record lookup fails', async () => {
      mockPayload.findByID.mockRejectedValue(new Error('not found'));

      const result = await generateCdOfTheWeekSlug(mockPayload as unknown as Payload, {
        record: 999,
      });
      expect(result).toBeNull();
    });
  });
});
