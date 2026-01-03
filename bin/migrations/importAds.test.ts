/**
 * Unit tests for ads import script
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { Payload } from 'payload';
import type { Ad } from './database';

// Mock modules
vi.mock('./database', () => ({
  connectToDatabase: vi.fn(),
  getActiveAds: vi.fn(),
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

describe('importAds', () => {
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
      const { parseArgs } = await import('./importAds');

      process.argv = ['node', 'script.ts', '--env', 'dev'];
      const options = parseArgs();

      expect(options.env).toBe('dev');
      expect(options.startId).toBeUndefined();
    });

    it('should parse --env prod argument', async () => {
      const { parseArgs } = await import('./importAds');

      process.argv = ['node', 'script.ts', '--env', 'prod'];
      const options = parseArgs();

      expect(options.env).toBe('prod');
    });

    it('should parse --start-id argument', async () => {
      const { parseArgs } = await import('./importAds');

      process.argv = ['node', 'script.ts', '--start-id', '100'];
      const options = parseArgs();

      expect(options.startId).toBe(100);
    });

    it('should default to dev environment', async () => {
      const { parseArgs } = await import('./importAds');

      process.argv = ['node', 'script.ts'];
      const options = parseArgs();

      expect(options.env).toBe('dev');
    });

    it('should throw error for invalid --env value', async () => {
      const { parseArgs } = await import('./importAds');

      process.argv = ['node', 'script.ts', '--env', 'invalid'];

      expect(() => parseArgs()).toThrow('--env must be either "dev" or "prod"');
    });

    it('should throw error for invalid --start-id value', async () => {
      const { parseArgs } = await import('./importAds');

      process.argv = ['node', 'script.ts', '--start-id', 'abc'];

      expect(() => parseArgs()).toThrow('--start-id must be a positive number');
    });
  });

  describe('importAd', () => {
    it('should skip already imported ad', async () => {
      const { importAd } = await import('./importAds');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [{ id: 'existing-ad' }] });

      const ad: Ad = {
        id: 1,
        name: 'Test Sponsor',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        image_url: 'https://example.com/image.jpg',
        web_url: 'https://example.com',
        priority: 5,
        deleted: 'n',
      };

      const result = await importAd(mockPayload as Payload, ad);

      expect(result).toBe(false);
      expect(mockPayload.create).not.toHaveBeenCalled();
    });

    it('should import new ad successfully', async () => {
      const { importAd } = await import('./importAds');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'ad-id-123' });

      const ad: Ad = {
        id: 1,
        name: 'Test Sponsor',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        image_url: 'https://example.com/image.jpg',
        web_url: 'https://example.com',
        priority: 5,
        deleted: 'n',
      };

      const result = await importAd(mockPayload as Payload, ad);

      expect(result).toBe(true);
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'ads',
        data: {
          name: 'Test Sponsor',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          image: undefined,
          webUrl: 'https://example.com',
          priority: 5,
          legacyId: 1,
          migratedAt: expect.any(String),
        },
      });
    });

    it('should handle empty image and web URLs', async () => {
      const { importAd } = await import('./importAds');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'ad-id-123' });

      const ad: Ad = {
        id: 1,
        name: 'Test Sponsor',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        image_url: '',
        web_url: '',
        priority: 0,
        deleted: 'n',
      };

      const result = await importAd(mockPayload as Payload, ad);

      expect(result).toBe(true);
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'ads',
        data: expect.objectContaining({
          image: undefined,
          webUrl: undefined,
          priority: 0,
        }),
      });
    });

    it('should handle default priority of 0', async () => {
      const { importAd } = await import('./importAds');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'ad-id-123' });

      const ad: Ad = {
        id: 1,
        name: 'Test Sponsor',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        image_url: 'https://example.com/image.jpg',
        web_url: 'https://example.com',
        priority: 0,
        deleted: 'n',
      };

      const result = await importAd(mockPayload as Payload, ad);

      expect(result).toBe(true);
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'ads',
        data: expect.objectContaining({
          priority: 0,
        }),
      });
    });
  });
});
