/**
 * Unit tests for concert import script
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { Payload } from 'payload';
import type { Concert } from './database';

// Mock modules
vi.mock('./database', () => ({
  connectToDatabase: vi.fn(),
  getActiveConcerts: vi.fn(),
}));

vi.mock('./shared/payloadClient', () => ({
  getPayloadClient: vi.fn(),
  findOrCreateArtist: vi.fn(),
  findOrCreateVenue: vi.fn(),
}));

vi.mock('./shared/artistCleaner', () => ({
  processArtistString: vi.fn(),
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

describe('importConcerts', () => {
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
      const { parseArgs } = await import('./importConcerts');

      process.argv = ['node', 'script.ts'];
      const options = parseArgs();

      expect(options.to).toBe('prod-neon');
    });

    it('should parse --to prod-neon argument', async () => {
      const { parseArgs } = await import('./importConcerts');

      process.argv = ['node', 'script.ts', '--to', 'prod-neon'];
      const options = parseArgs();

      expect(options.to).toBe('prod-neon');
      expect(options.startId).toBeUndefined();
    });

    it('should parse --to local-postgres argument', async () => {
      const { parseArgs } = await import('./importConcerts');

      process.argv = ['node', 'script.ts', '--to', 'local-postgres'];
      const options = parseArgs();

      expect(options.to).toBe('local-postgres');
    });

    it('should parse --start-id argument', async () => {
      const { parseArgs } = await import('./importConcerts');

      process.argv = ['node', 'script.ts', '--start-id', '100'];
      const options = parseArgs();

      expect(options.startId).toBe(100);
    });

    it('should parse both --to and --start-id', async () => {
      const { parseArgs } = await import('./importConcerts');

      process.argv = ['node', 'script.ts', '--to', 'local-postgres', '--start-id', '500'];
      const options = parseArgs();

      expect(options.to).toBe('local-postgres');
      expect(options.startId).toBe(500);
    });

    it('should throw error for invalid --to value', async () => {
      const { parseArgs } = await import('./importConcerts');

      process.argv = ['node', 'script.ts', '--to', 'invalid'];

      expect(() => parseArgs()).toThrow('--to must be "prod-neon" or "local-postgres"');
    });

    it('should throw error for invalid --start-id value', async () => {
      const { parseArgs } = await import('./importConcerts');

      process.argv = ['node', 'script.ts', '--start-id', 'abc'];

      expect(() => parseArgs()).toThrow('--start-id must be a positive number');
    });

    it('should throw error for negative --start-id value', async () => {
      const { parseArgs } = await import('./importConcerts');

      process.argv = ['node', 'script.ts', '--start-id', '-5'];

      expect(() => parseArgs()).toThrow('--start-id must be a positive number');
    });
  });

  describe('importConcert', () => {
    it('should skip already imported concert', async () => {
      const { importConcert } = await import('./importConcerts');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [{ id: 'existing-concert' }] });

      const concert: Concert = {
        id: 1,
        date: '2024-01-15',
        artist: 'Test Artist',
        band_pic_url: '',
        band_url: '',
        venue: 'Test Venue',
        ticketinfo: '',
        ticketurl: '',
        featured: 'No',
        deleted: 'N',
      };

      const result = await importConcert(mockPayload as Payload, concert);

      expect(result).toBe(false);
      expect(mockPayload.create).not.toHaveBeenCalled();
    });

    it('should import new concert successfully', async () => {
      const { importConcert } = await import('./importConcerts');
      const { processArtistString } = await import('./shared/artistCleaner');
      const { findOrCreateArtist, findOrCreateVenue } = await import(
        './shared/payloadClient'
      );

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (processArtistString as Mock).mockReturnValue({
        artistNames: ['The National'],
        customTitle: null,
      });
      (findOrCreateArtist as Mock).mockResolvedValue('artist-id-123');
      (findOrCreateVenue as Mock).mockResolvedValue('venue-id-456');
      (mockPayload.create as Mock).mockResolvedValue({ id: 'concert-id-789' });

      const concert: Concert = {
        id: 1,
        date: '2024-01-15',
        artist: 'The National',
        band_pic_url: '',
        band_url: '',
        venue: 'Union Transfer',
        ticketinfo: '$25',
        ticketurl: 'https://example.com',
        featured: 'Yes',
        deleted: 'N',
      };

      const result = await importConcert(mockPayload as Payload, concert);

      expect(result).toBe(true);
      expect(findOrCreateArtist).toHaveBeenCalledWith(mockPayload, 'The National');
      expect(findOrCreateVenue).toHaveBeenCalledWith(mockPayload, 'Union Transfer');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'concerts',
        data: {
          date: '2024-01-15',
          artists: ['artist-id-123'],
          title: undefined,
          venue: 'venue-id-456',
          ticketInfo: '$25',
          ticketUrl: 'https://example.com',
          featured: true,
          legacyId: 1,
          migratedAt: expect.any(String),
        },
      });
    });

    it('should skip concert with no valid artist names', async () => {
      const { importConcert } = await import('./importConcerts');
      const { processArtistString } = await import('./shared/artistCleaner');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (processArtistString as Mock).mockReturnValue({
        artistNames: [],
        customTitle: null,
      });

      const concert: Concert = {
        id: 1,
        date: '2024-01-15',
        artist: '',
        band_pic_url: '',
        band_url: '',
        venue: 'Test Venue',
        ticketinfo: '',
        ticketurl: '',
        featured: 'No',
        deleted: 'N',
      };

      const result = await importConcert(mockPayload as Payload, concert);

      expect(result).toBe(false);
      expect(mockPayload.create).not.toHaveBeenCalled();
    });

    it('should use first artist when multiple artists present', async () => {
      const { importConcert } = await import('./importConcerts');
      const { processArtistString } = await import('./shared/artistCleaner');
      const { findOrCreateArtist, findOrCreateVenue } = await import(
        './shared/payloadClient'
      );

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (processArtistString as Mock).mockReturnValue({
        artistNames: ['Artist One', 'Artist Two', 'Artist Three'],
        customTitle: null,
      });
      (findOrCreateArtist as Mock).mockResolvedValue('artist-id-123');
      (findOrCreateVenue as Mock).mockResolvedValue('venue-id-456');
      (mockPayload.create as Mock).mockResolvedValue({ id: 'concert-id-789' });

      const concert: Concert = {
        id: 1,
        date: '2024-01-15',
        artist: 'Artist One, Artist Two, Artist Three',
        band_pic_url: '',
        band_url: '',
        venue: 'Test Venue',
        ticketinfo: '',
        ticketurl: '',
        featured: 'No',
        deleted: 'N',
      };

      const result = await importConcert(mockPayload as Payload, concert);

      expect(result).toBe(true);
      expect(findOrCreateArtist).toHaveBeenCalledWith(mockPayload, 'Artist One');
    });

    it('should handle empty ticket info and URL', async () => {
      const { importConcert } = await import('./importConcerts');
      const { processArtistString } = await import('./shared/artistCleaner');
      const { findOrCreateArtist, findOrCreateVenue } = await import(
        './shared/payloadClient'
      );

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (processArtistString as Mock).mockReturnValue({
        artistNames: ['Test Artist'],
        customTitle: null,
      });
      (findOrCreateArtist as Mock).mockResolvedValue('artist-id-123');
      (findOrCreateVenue as Mock).mockResolvedValue('venue-id-456');
      (mockPayload.create as Mock).mockResolvedValue({ id: 'concert-id-789' });

      const concert: Concert = {
        id: 1,
        date: '2024-01-15',
        artist: 'Test Artist',
        band_pic_url: '',
        band_url: '',
        venue: 'Test Venue',
        ticketinfo: '',
        ticketurl: '',
        featured: 'No',
        deleted: 'N',
      };

      const result = await importConcert(mockPayload as Payload, concert);

      expect(result).toBe(true);
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'concerts',
        data: expect.objectContaining({
          ticketInfo: undefined,
          ticketUrl: undefined,
        }),
      });
    });
  });
});
