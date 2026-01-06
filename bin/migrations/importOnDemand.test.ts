/**
 * Unit tests for OnDemand import script
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { Payload } from 'payload';
import type { OnDemand } from './database';

// Mock modules
vi.mock('./database', () => ({
  connectToDatabase: vi.fn(),
  getActiveOnDemand: vi.fn(),
}));

vi.mock('./shared/payloadClient', () => ({
  getPayloadClient: vi.fn(),
  findOrCreateArtist: vi.fn(),
}));

vi.mock('./shared/artistCleaner', () => ({
  processArtistString: vi.fn(),
}));

vi.mock('./shared/mediaImporter', () => ({
  importImageFromUrl: vi.fn(),
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

describe('importOnDemand', () => {
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
      const { parseArgs } = await import('./importOnDemand');

      process.argv = ['node', 'script.ts', '--env', 'dev'];
      const options = parseArgs();

      expect(options.env).toBe('dev');
    });

    it('should throw error for invalid --env value', async () => {
      const { parseArgs } = await import('./importOnDemand');

      process.argv = ['node', 'script.ts', '--env', 'invalid'];

      expect(() => parseArgs()).toThrow('--env must be either "dev" or "prod"');
    });
  });

  describe('importOnDemandItem', () => {
    it('should skip already imported on-demand item', async () => {
      const { importOnDemandItem } = await import('./importOnDemand');

      (mockPayload.find as Mock).mockResolvedValue({
        docs: [{ id: 'existing-ondemand' }],
      });

      const item: OnDemand = {
        id: 1,
        date: '2024-01-15',
        image: 'https://example.com/image.jpg',
        headline: 'Test Show',
        note: 'Episode description',
        songs: 'Track 1, Track 2',
        audio_url: 'https://example.com/audio.mp3',
        source: 'mixcloud',
        deleted: 'n',
      };

      const result = await importOnDemandItem(mockPayload as Payload, item);

      expect(result).toBe(false);
      expect(mockPayload.create).not.toHaveBeenCalled();
    });

    it('should import new on-demand item successfully', async () => {
      const { importOnDemandItem } = await import('./importOnDemand');
      const { findOrCreateArtist } = await import('./shared/payloadClient');
      const { processArtistString } = await import('./shared/artistCleaner');
      const { importImageFromUrl } = await import('./shared/mediaImporter');

      // Mock artist parsing and creation
      (processArtistString as Mock).mockReturnValue({
        artistNames: ['Test Artist'],
        customTitle: null,
      });
      (findOrCreateArtist as Mock).mockResolvedValue('artist-id-123');

      // Mock image import
      (importImageFromUrl as Mock).mockResolvedValue({
        success: true,
        mediaId: 'media-id-123',
        cloudinaryUrl: 'https://cloudinary.com/image.jpg',
      });

      // Mock song/DJ find operations (return empty - will create new)
      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      
      // Mock creation operations
      (mockPayload.create as Mock)
        .mockResolvedValueOnce({ id: 'song-id-1' }) // First song
        .mockResolvedValueOnce({ id: 'song-id-2' }) // Second song
        .mockResolvedValueOnce({ id: 'song-id-3' }) // Third song
        .mockResolvedValueOnce({ id: 'ondemand-id-123' }); // OnDemand record

      const item: OnDemand = {
        id: 1,
        date: '2024-01-15',
        image: 'https://example.com/image.jpg',
        headline: 'Test Artist',
        note: 'Great music and discussion',
        songs: 'Track 1 / Track 2 / Track 3',
        audio_url: 'https://example.com/audio.mp3',
        source: 'mixcloud',
        deleted: 'n',
      };

      const result = await importOnDemandItem(mockPayload as Payload, item);

      expect(result).toBe(true);
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'ondemand',
        data: expect.objectContaining({
          headline: 'Test Artist',
          note: expect.objectContaining({
            root: expect.objectContaining({
              type: 'root',
              children: expect.arrayContaining([
                expect.objectContaining({
                  type: 'paragraph',
                  children: expect.arrayContaining([
                    expect.objectContaining({
                      type: 'text',
                      text: 'Great music and discussion',
                    }),
                  ]),
                }),
              ]),
            }),
          }),
          songs: ['song-id-1', 'song-id-2', 'song-id-3'],
          artists: ['artist-id-123'],
          audioUrl: 'https://example.com/audio.mp3',
          source: 'mixcloud',
          image: 'media-id-123',
          date: '2024-01-15',
          legacyId: 1,
          migratedAt: expect.any(String),
        }),
      });
    });

    it('should handle empty optional fields', async () => {
      const { importOnDemandItem } = await import('./importOnDemand');
      const { processArtistString } = await import('./shared/artistCleaner');
      const { importImageFromUrl } = await import('./shared/mediaImporter');

      // Mock empty artist parsing
      (processArtistString as Mock).mockReturnValue({
        artistNames: [],
        customTitle: null,
      });

      // Mock no image import
      (importImageFromUrl as Mock).mockResolvedValue({
        success: false,
        error: 'No URL provided',
      });

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'ondemand-id-123' });

      const item: OnDemand = {
        id: 1,
        date: '2024-01-15',
        image: '',
        headline: '',
        note: '',
        songs: '',
        audio_url: '',
        source: '',
        deleted: 'n',
      };

      const result = await importOnDemandItem(mockPayload as Payload, item);

      expect(result).toBe(true);
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'ondemand',
        data: expect.objectContaining({
          headline: undefined,
          note: expect.objectContaining({
            root: expect.objectContaining({
              type: 'root',
              children: [],
            }),
          }),
          songs: undefined,
          djs: undefined,
          artists: undefined,
          audioUrl: undefined,
          source: 'opendrive',
          image: undefined,
          date: '2024-01-15',
          legacyId: 1,
          migratedAt: expect.any(String),
        }),
      });
    });

    it('should preserve all field values', async () => {
      const { importOnDemandItem } = await import('./importOnDemand');
      const { findOrCreateArtist } = await import('./shared/payloadClient');
      const { processArtistString } = await import('./shared/artistCleaner');
      const { importImageFromUrl } = await import('./shared/mediaImporter');

      // Mock artist parsing and creation
      (processArtistString as Mock).mockReturnValue({
        artistNames: ['Special Artist'],
        customTitle: null,
      });
      (findOrCreateArtist as Mock).mockResolvedValue('artist-id-456');

      // Mock image import
      (importImageFromUrl as Mock).mockResolvedValue({
        success: true,
        mediaId: 'media-id-456',
        cloudinaryUrl: 'https://cloudinary.com/show.jpg',
      });

      // Mock song/DJ operations
      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock)
        .mockResolvedValueOnce({ id: 'song-id-a' })
        .mockResolvedValueOnce({ id: 'song-id-b' })
        .mockResolvedValueOnce({ id: 'song-id-c' })
        .mockResolvedValueOnce({ id: 'ondemand-id-123' });

      const item: OnDemand = {
        id: 42,
        date: '2024-03-20',
        image: 'https://img.example.com/show.jpg',
        headline: 'Special Episode',
        note: 'Live from the studio',
        songs: 'Song A, Song B, Song C',
        audio_url: 'https://audio.example.com/episode42.mp3',
        source: 'soundcloud',
        deleted: 'n',
      };

      const result = await importOnDemandItem(mockPayload as Payload, item);

      expect(result).toBe(true);
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'ondemand',
        data: expect.objectContaining({
          headline: 'Special Episode',
          note: expect.objectContaining({
            root: expect.objectContaining({
              type: 'root',
              children: expect.arrayContaining([
                expect.objectContaining({
                  type: 'paragraph',
                  children: expect.arrayContaining([
                    expect.objectContaining({
                      type: 'text',
                      text: 'Live from the studio',
                    }),
                  ]),
                }),
              ]),
            }),
          }),
          songs: ['song-id-a', 'song-id-b', 'song-id-c'],
          artists: ['artist-id-456'],
          audioUrl: 'https://audio.example.com/episode42.mp3',
          source: 'soundcloud',
          image: 'media-id-456',
          date: '2024-03-20',
          legacyId: 42,
          migratedAt: expect.any(String),
        }),
      });
    });
  });
});
