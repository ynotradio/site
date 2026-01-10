/**
 * Unit tests for CD of the Week import script
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { Payload } from 'payload';
import type { CdOfTheWeek } from './database';

// Mock modules
vi.mock('./database', () => ({
  connectToDatabase: vi.fn(),
  getActiveCdOfTheWeek: vi.fn(),
}));

vi.mock('./shared/payloadClient', () => ({
  getPayloadClient: vi.fn(),
  findOrCreateArtist: vi.fn(),
}));

vi.mock('./shared/importUtils', () => ({
  convertHtmlToLexical: vi.fn((html) => ({ root: { children: [{ text: html }] } })),
}));

vi.mock('./shared/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
  logProgress: vi.fn(),
  logSummary: vi.fn(),
}));

vi.mock('./shared/mediaImporter', () => ({
  importImageFromUrl: vi.fn(() => Promise.resolve({ success: false, error: 'Mocked' })),
}));

vi.mock('./shared/musicbrainz', () => ({
  getReleaseMbid: vi.fn(() => Promise.resolve(null)),
  getAlbumCoverArt: vi.fn(() => Promise.resolve(null)),
}));

describe('importCdOfTheWeek', () => {
  let mockPayload: Partial<Payload>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPayload = {
      find: vi.fn(),
      create: vi.fn(),
    };
  });

  describe('parseArgs', () => {
    it('should parse --env dev argument', async () => {
      const { parseArgs } = await import('./importCdOfTheWeek');

      process.argv = ['node', 'script.ts', '--env', 'dev'];
      const options = parseArgs();

      expect(options.env).toBe('dev');
    });

    it('should throw error for invalid --env value', async () => {
      const { parseArgs } = await import('./importCdOfTheWeek');

      process.argv = ['node', 'script.ts', '--env', 'invalid'];

      expect(() => parseArgs()).toThrow('--env must be either "dev" or "prod"');
    });
  });

  describe('importCdOfTheWeekItem', () => {
    it('should skip already imported CD of the Week', async () => {
      const { importCdOfTheWeekItem } = await import('./importCdOfTheWeek');

      (mockPayload.find as Mock).mockResolvedValue({
        docs: [{ id: 'existing-cdotw' }],
      });

      const item: CdOfTheWeek = {
        id: 1,
        artist: 'The National',
        title: 'High Violet',
        label: 'Beggars Banquet',
        review: '<p>Great album!</p>',
        cd_pic_url: 'https://example.com/cover.jpg',
        band: 'The National',
        reviewer: 'John Doe',
        date: '2024-01-15',
        deleted: 'n',
      };

      const result = await importCdOfTheWeekItem(mockPayload as Payload, item);

      expect(result).toBe(false);
      expect(mockPayload.create).not.toHaveBeenCalled();
    });

    it('should import new CD of the Week with new artist and record', async () => {
      const { importCdOfTheWeekItem } = await import('./importCdOfTheWeek');
      const { findOrCreateArtist } = await import('./shared/payloadClient');

      // Mock: CDOTW doesn't exist, record doesn't exist, so create both
      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] }) // CDOTW check
        .mockResolvedValueOnce({ docs: [] }); // Record check

      (findOrCreateArtist as Mock).mockResolvedValue('artist-id-123');
      (mockPayload.create as Mock)
        .mockResolvedValueOnce({ id: 'record-id-456' }) // Record creation
        .mockResolvedValueOnce({ id: 'cdotw-id-789' }); // CDOTW creation

      const item: CdOfTheWeek = {
        id: 1,
        artist: 'The National',
        title: 'High Violet',
        label: 'Beggars Banquet',
        review: '<p>Great album!</p>',
        cd_pic_url: 'https://example.com/cover.jpg',
        band: 'The National',
        reviewer: 'John Doe',
        date: '2024-01-15',
        deleted: 'n',
      };

      const result = await importCdOfTheWeekItem(mockPayload as Payload, item);

      expect(result).toBe(true);
      expect(findOrCreateArtist).toHaveBeenCalledWith(mockPayload, 'The National');

      // Should create record
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'records',
        data: {
          title: 'High Violet',
          artist: 'artist-id-123',
          label: 'Beggars Banquet',
          coverImage: undefined,
          musicbrainzId: undefined,
          legacyId: 1,
          migratedAt: expect.any(String),
        },
      });

      // Should create CDOTW
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'cdoftheweek',
        data: {
          record: 'record-id-456',
          review: expect.any(Object),
          reviewer: 'John Doe',
          date: '2024-01-15',
          legacyId: 1,
          migratedAt: expect.any(String),
        },
      });
    });

    it('should use existing record if found', async () => {
      const { importCdOfTheWeekItem } = await import('./importCdOfTheWeek');
      const { findOrCreateArtist } = await import('./shared/payloadClient');

      // Mock: CDOTW doesn't exist, but record already exists
      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] }) // CDOTW check
        .mockResolvedValueOnce({ docs: [{ id: 'existing-record-id' }] }); // Record exists

      (findOrCreateArtist as Mock).mockResolvedValue('artist-id-123');
      (mockPayload.create as Mock).mockResolvedValueOnce({ id: 'cdotw-id-789' });

      const item: CdOfTheWeek = {
        id: 1,
        artist: 'The National',
        title: 'High Violet',
        label: 'Beggars Banquet',
        review: '<p>Great album!</p>',
        cd_pic_url: '',
        band: '',
        reviewer: '',
        date: '2024-01-15',
        deleted: 'n',
      };

      const result = await importCdOfTheWeekItem(mockPayload as Payload, item);

      expect(result).toBe(true);

      // Should NOT create record (uses existing)
      expect(mockPayload.create).toHaveBeenCalledTimes(1);

      // Should create CDOTW with existing record ID
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'cdoftheweek',
        data: {
          record: 'existing-record-id',
          review: expect.any(Object),
          reviewer: undefined,
          date: '2024-01-15',
          legacyId: 1,
          migratedAt: expect.any(String),
        },
      });
    });

    it('should handle empty optional fields', async () => {
      const { importCdOfTheWeekItem } = await import('./importCdOfTheWeek');
      const { findOrCreateArtist } = await import('./shared/payloadClient');

      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] });

      (findOrCreateArtist as Mock).mockResolvedValue('artist-id-123');
      (mockPayload.create as Mock)
        .mockResolvedValueOnce({ id: 'record-id-456' })
        .mockResolvedValueOnce({ id: 'cdotw-id-789' });

      const item: CdOfTheWeek = {
        id: 1,
        artist: 'Test Artist',
        title: 'Test Album',
        label: '',
        review: 'Simple review',
        cd_pic_url: '',
        band: '',
        reviewer: '',
        date: '2024-01-15',
        deleted: 'n',
      };

      const result = await importCdOfTheWeekItem(mockPayload as Payload, item);

      expect(result).toBe(true);
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'records',
        data: expect.objectContaining({
          label: undefined,
          coverImage: undefined,
        }),
      });
    });
  });
});
