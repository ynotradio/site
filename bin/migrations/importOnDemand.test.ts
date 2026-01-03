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

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'ondemand-id-123' });

      const item: OnDemand = {
        id: 1,
        date: '2024-01-15',
        image: 'https://example.com/image.jpg',
        headline: 'Test Show Episode 1',
        note: 'Great music and discussion',
        songs: 'Track 1, Track 2, Track 3',
        audio_url: 'https://example.com/audio.mp3',
        source: 'mixcloud',
        deleted: 'n',
      };

      const result = await importOnDemandItem(mockPayload as Payload, item);

      expect(result).toBe(true);
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'ondemand',
        data: {
          headline: 'Test Show Episode 1',
          note: 'Great music and discussion',
          songs: 'Track 1, Track 2, Track 3',
          audioUrl: 'https://example.com/audio.mp3',
          imageUrl: 'https://example.com/image.jpg',
          date: '2024-01-15',
          legacyId: 1,
          migratedAt: expect.any(String),
        },
      });
    });

    it('should handle empty optional fields', async () => {
      const { importOnDemandItem } = await import('./importOnDemand');

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
          note: undefined,
          songs: undefined,
          audioUrl: undefined,
          imageUrl: undefined,
        }),
      });
    });

    it('should preserve all field values', async () => {
      const { importOnDemandItem } = await import('./importOnDemand');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'ondemand-id-123' });

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
        data: {
          headline: 'Special Episode',
          note: 'Live from the studio',
          songs: 'Song A, Song B, Song C',
          audioUrl: 'https://audio.example.com/episode42.mp3',
          imageUrl: 'https://img.example.com/show.jpg',
          date: '2024-03-20',
          legacyId: 42,
          migratedAt: expect.any(String),
        },
      });
    });
  });
});
