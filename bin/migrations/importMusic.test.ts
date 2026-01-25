/**
 * Unit tests for Music import script
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { Payload } from 'payload';

// Mock modules
vi.mock('./database', () => ({
  connectToDatabase: vi.fn(),
}));

vi.mock('./shared/payloadClient', () => ({
  getPayloadClient: vi.fn(),
  findOrCreateArtist: vi.fn(),
}));

vi.mock('./shared/importUtils', () => ({
  generateSlug: vi.fn((text) => text.toLowerCase().replace(/\s+/g, '-')),
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

describe('importMusic', () => {
  let mockPayload: Partial<Payload>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPayload = {
      find: vi.fn(),
      create: vi.fn(),
    };
  });

  describe('parseArgs', () => {
    it('should default to prod-neon target', async () => {
      const { parseArgs } = await import('./importMusic');

      process.argv = ['node', 'script.ts'];
      const options = parseArgs();

      expect(options.to).toBe('prod-neon');
    });

    it('should parse --to prod-neon argument', async () => {
      const { parseArgs } = await import('./importMusic');

      process.argv = ['node', 'script.ts', '--to', 'prod-neon'];
      const options = parseArgs();

      expect(options.to).toBe('prod-neon');
    });

    it('should parse --to local-postgres argument', async () => {
      const { parseArgs } = await import('./importMusic');

      process.argv = ['node', 'script.ts', '--to', 'local-postgres'];
      const options = parseArgs();

      expect(options.to).toBe('local-postgres');
    });

    it('should throw error for invalid --to value', async () => {
      const { parseArgs } = await import('./importMusic');

      process.argv = ['node', 'script.ts', '--to', 'invalid'];

      expect(() => parseArgs()).toThrow('--to must be "prod-neon" or "local-postgres"');
    });

    it('should parse --start-id argument', async () => {
      const { parseArgs } = await import('./importMusic');

      process.argv = ['node', 'script.ts', '--start-id', '1000'];
      const options = parseArgs();

      expect(options.startId).toBe(1000);
    });

    it('should parse both --to and --start-id arguments', async () => {
      const { parseArgs } = await import('./importMusic');

      process.argv = ['node', 'script.ts', '--to', 'local-postgres', '--start-id', '500'];
      const options = parseArgs();

      expect(options.to).toBe('local-postgres');
      expect(options.startId).toBe(500);
    });
  });

  describe('importMusic', () => {
    it('should skip already imported song', async () => {
      const { importMusic } = await import('./importMusic');

      (mockPayload.find as Mock).mockResolvedValue({
        docs: [{ id: 'existing-song' }],
      });

      const music = {
        id: 1,
        artist: 'The National',
        song: 'Bloodbuzz Ohio',
        url: 'https://example.com/song.mp3',
        date: '2024-01-15',
        deleted: 'n',
      };

      const result = await importMusic(mockPayload as Payload, music);

      expect(result).toBe(false);
      expect(mockPayload.create).not.toHaveBeenCalled();
    });

    it('should import new song and create artist', async () => {
      const { importMusic } = await import('./importMusic');
      const { findOrCreateArtist } = await import('./shared/payloadClient');
      const { generateSlug } = await import('./shared/importUtils');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (findOrCreateArtist as Mock).mockResolvedValue('artist-id-123');
      (generateSlug as Mock).mockReturnValue('the-national-bloodbuzz-ohio');
      (mockPayload.create as Mock).mockResolvedValue({ id: 'song-id-456' });

      const music = {
        id: 1,
        artist: 'The National',
        song: 'Bloodbuzz Ohio',
        url: 'https://example.com/song.mp3',
        date: '2024-01-15',
        deleted: 'n',
      };

      const result = await importMusic(mockPayload as Payload, music);

      expect(result).toBe(true);
      expect(findOrCreateArtist).toHaveBeenCalledWith(mockPayload, 'The National');
      expect(generateSlug).toHaveBeenCalledWith('The National Bloodbuzz Ohio');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'songs',
        data: {
          title: 'Bloodbuzz Ohio',
          slug: 'the-national-bloodbuzz-ohio',
          artist: 'artist-id-123',
          streamUrl: 'https://example.com/song.mp3',
          releaseDate: '2024-01-15',
          featureOnNewMusic: true,
          legacyId: 1,
          migratedAt: expect.any(String),
        },
      });
    });

    it('should handle empty stream URL', async () => {
      const { importMusic } = await import('./importMusic');
      const { findOrCreateArtist } = await import('./shared/payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (findOrCreateArtist as Mock).mockResolvedValue('artist-id-123');
      (mockPayload.create as Mock).mockResolvedValue({ id: 'song-id-456' });

      const music = {
        id: 1,
        artist: 'Test Artist',
        song: 'Test Song',
        url: '',
        date: '2024-01-15',
        deleted: 'n',
      };

      const result = await importMusic(mockPayload as Payload, music);

      expect(result).toBe(true);
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'songs',
        data: expect.objectContaining({
          streamUrl: undefined,
        }),
      });
    });

    it('should set featureOnNewMusic to true for all imported songs', async () => {
      const { importMusic } = await import('./importMusic');
      const { findOrCreateArtist } = await import('./shared/payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (findOrCreateArtist as Mock).mockResolvedValue('artist-id-123');
      (mockPayload.create as Mock).mockResolvedValue({ id: 'song-id-456' });

      const music = {
        id: 1,
        artist: 'Artist Name',
        song: 'Song Title',
        url: 'https://example.com/audio.mp3',
        date: '2024-01-15',
        deleted: 'n',
      };

      const result = await importMusic(mockPayload as Payload, music);

      expect(result).toBe(true);
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'songs',
        data: expect.objectContaining({
          featureOnNewMusic: true,
        }),
      });
    });

    it('should preserve release date', async () => {
      const { importMusic } = await import('./importMusic');
      const { findOrCreateArtist } = await import('./shared/payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (findOrCreateArtist as Mock).mockResolvedValue('artist-id-123');
      (mockPayload.create as Mock).mockResolvedValue({ id: 'song-id-456' });

      const music = {
        id: 1,
        artist: 'Test Artist',
        song: 'Test Song',
        url: '',
        date: '2023-05-20',
        deleted: 'n',
      };

      const result = await importMusic(mockPayload as Payload, music);

      expect(result).toBe(true);
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'songs',
        data: expect.objectContaining({
          releaseDate: '2023-05-20',
        }),
      });
    });
  });
});
