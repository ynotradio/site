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
  findDJByDisplayName: vi.fn(),
  findOrCreateArtist: vi.fn(),
  parseOnDemandHeadline: vi.fn().mockReturnValue({
    djNames: [],
    artistNames: [],
    cleanTitle: '',
  }),
}));

vi.mock('./shared/importUtils', () => ({
  convertHtmlToLexical: vi.fn((html) => {
    if (!html || html.trim() === '') {
      // Match the actual implementation - return minimal paragraph for empty content
      return {
        root: {
          type: 'root',
          children: [{
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            children: [{
              type: 'text',
              format: 0,
              version: 1,
              text: '',
              mode: 'normal',
              style: '',
              detail: 0,
            }],
            direction: 'ltr',
          }],
          direction: 'ltr',
        },
      };
    }
    return {
      root: {
        type: 'root',
        children: [{ type: 'paragraph', children: [{ type: 'text', text: html }] }],
      },
    };
  }),
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
  importImageFromUrl: vi.fn().mockResolvedValue({
    success: false,
    mediaId: undefined,
  }),
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
    it('should default to prod-neon target', async () => {
      const { parseArgs } = await import('./importOnDemand');

      process.argv = ['node', 'script.ts'];
      const options = parseArgs();

      expect(options.to).toBe('prod-neon');
    });

    it('should parse --to prod-neon argument', async () => {
      const { parseArgs } = await import('./importOnDemand');

      process.argv = ['node', 'script.ts', '--to', 'prod-neon'];
      const options = parseArgs();

      expect(options.to).toBe('prod-neon');
    });

    it('should parse --to local-postgres argument', async () => {
      const { parseArgs } = await import('./importOnDemand');

      process.argv = ['node', 'script.ts', '--to', 'local-postgres'];
      const options = parseArgs();

      expect(options.to).toBe('local-postgres');
    });

    it('should throw error for invalid --to value', async () => {
      const { parseArgs } = await import('./importOnDemand');

      process.argv = ['node', 'script.ts', '--to', 'invalid'];

      expect(() => parseArgs()).toThrow('--to must be');
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
      const { parseOnDemandHeadline } = await import('./shared/payloadClient');

      (parseOnDemandHeadline as Mock).mockReturnValue({
        djNames: [],
        artistNames: [],
        cleanTitle: 'Test Show Episode 1',
      });

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
        data: expect.objectContaining({
          headline: 'Test Show Episode 1',
          description: expect.objectContaining({
            root: expect.objectContaining({
              type: 'root',
            }),
          }),
          audioUrl: 'https://example.com/audio.mp3',
          date: '2024-01-15',
          legacyId: 1,
        }),
      });
    });

    it('should handle empty optional fields', async () => {
      const { importOnDemandItem } = await import('./importOnDemand');
      const { parseOnDemandHeadline } = await import('./shared/payloadClient');

      (parseOnDemandHeadline as Mock).mockReturnValue({
        djNames: [],
        artistNames: [],
        cleanTitle: '',
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
          description: undefined,
          audioUrl: undefined,
          image: undefined,
          _status: 'published',
        }),
      });
    });

    it('should include DJ relationships when DJs are found', async () => {
      const { importOnDemandItem } = await import('./importOnDemand');
      const { parseOnDemandHeadline, findDJByDisplayName } = await import('./shared/payloadClient');

      (parseOnDemandHeadline as Mock).mockReturnValue({
        djNames: ['Shana'],
        artistNames: [],
        cleanTitle: 'Aussie Unlocked',
      });

      (findDJByDisplayName as Mock).mockResolvedValue(42);

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'ondemand-id-123' });

      const item: OnDemand = {
        id: 1,
        date: '2024-01-15',
        image: '',
        headline: 'Aussie Unlocked with Shana',
        note: 'Great Australian music',
        songs: '',
        audio_url: 'https://example.com/audio.mp3',
        source: 'mixcloud',
        deleted: 'n',
      };

      const result = await importOnDemandItem(mockPayload as Payload, item);

      expect(result).toBe(true);
      expect(findDJByDisplayName).toHaveBeenCalledWith(mockPayload, 'Shana');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'ondemand',
        data: expect.objectContaining({
          djs: [42],
        }),
      });
    });

    it('should include artist relationships when artists are found', async () => {
      const { importOnDemandItem } = await import('./importOnDemand');
      const { parseOnDemandHeadline, findOrCreateArtist } = await import('./shared/payloadClient');

      (parseOnDemandHeadline as Mock).mockReturnValue({
        djNames: [],
        artistNames: ['The Beatles'],
        cleanTitle: 'Special Session',
      });

      (findOrCreateArtist as Mock).mockResolvedValue(99);

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'ondemand-id-123' });

      const item: OnDemand = {
        id: 1,
        date: '2024-01-15',
        image: '',
        headline: 'Special Session featuring The Beatles',
        note: 'Live performance',
        songs: '',
        audio_url: 'https://example.com/audio.mp3',
        source: 'mixcloud',
        deleted: 'n',
      };

      const result = await importOnDemandItem(mockPayload as Payload, item);

      expect(result).toBe(true);
      expect(findOrCreateArtist).toHaveBeenCalledWith(mockPayload, 'The Beatles');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'ondemand',
        data: expect.objectContaining({
          artists: [99],
        }),
      });
    });
  });
});
