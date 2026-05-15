/**
 * Unit tests for DJs import script
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { Payload } from 'payload';
import type { Deejay } from './database';

// Mock modules
vi.mock('./database', () => ({
  connectToDatabase: vi.fn(),
  getActiveDeejays: vi.fn(),
}));

vi.mock('./shared/payloadClient', () => ({
  getPayloadClient: vi.fn(),
  findOrCreatePerson: vi.fn(),
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

describe('importDJs', () => {
  let mockPayload: Partial<Payload>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPayload = {
      find: vi.fn(),
      create: vi.fn(),
    };
  });

  describe('parseDJNames', () => {
    it('should parse single name', async () => {
      const { parseDJNames } = await import('./importDJs');
      expect(parseDJNames('John Doe')).toEqual(['John Doe']);
    });

    it('should parse names separated by &', async () => {
      const { parseDJNames } = await import('./importDJs');
      expect(parseDJNames('M.J. & Patria')).toEqual(['M.J.', 'Patria']);
    });

    it('should parse names separated by and', async () => {
      const { parseDJNames } = await import('./importDJs');
      expect(parseDJNames('John and Jane')).toEqual(['John', 'Jane']);
    });

    it('should handle whitespace properly', async () => {
      const { parseDJNames } = await import('./importDJs');
      expect(parseDJNames('Bob  &  Alice')).toEqual(['Bob', 'Alice']);
    });
  });

  describe('parseArgs', () => {
    it('should default to production-db target', async () => {
      const { parseArgs } = await import('./importDJs');

      process.argv = ['node', 'script.ts'];
      const options = parseArgs();

      expect(options.to).toBe('production-db');
      expect(options.startId).toBeUndefined();
    });

    it('should normalize legacy --to prod-neon argument', async () => {
      const { parseArgs } = await import('./importDJs');

      process.argv = ['node', 'script.ts', '--to', 'prod-neon'];
      const options = parseArgs();

      expect(options.to).toBe('production-db');
    });

    it('should parse --to local-postgres argument', async () => {
      const { parseArgs } = await import('./importDJs');

      process.argv = ['node', 'script.ts', '--to', 'local-postgres'];
      const options = parseArgs();

      expect(options.to).toBe('local-postgres');
    });

    it('should parse --start-id argument', async () => {
      const { parseArgs } = await import('./importDJs');

      process.argv = ['node', 'script.ts', '--start-id', '100'];
      const options = parseArgs();

      expect(options.startId).toBe(100);
    });

    it('should throw error for invalid --to value', async () => {
      const { parseArgs } = await import('./importDJs');

      process.argv = ['node', 'script.ts', '--to', 'invalid'];

      expect(() => parseArgs()).toThrow('--to must be "production-db", "preview-db", or "local-postgres"');
    });
  });

  describe('importDJ', () => {
    it('should skip already imported DJ', async () => {
      const { importDJ } = await import('./importDJs');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [{ id: 'existing-dj' }] });

      const dj: Deejay = {
        id: 1,
        name: 'John Doe',
        show: 'The Morning Show',
        email: 'john@example.com',
        external_connect_text: 'Follow on Twitter',
        external_connect_url: 'https://twitter.com/johndoe',
        pic: 'john.jpg',
        sort: 1,
        deleted: 'No',
      };

      const result = await importDJ(mockPayload as Payload, dj);

      expect(result).toBe(false);
      expect(mockPayload.create).not.toHaveBeenCalled();
    });

    it('should import new DJ successfully and create person', async () => {
      const { importDJ } = await import('./importDJs');
      const { findOrCreatePerson } = await import('./shared/payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (findOrCreatePerson as Mock).mockResolvedValue('person-id-123');
      (mockPayload.create as Mock).mockResolvedValue({ id: 'dj-id-456' });

      const dj: Deejay = {
        id: 1,
        name: 'John Doe',
        show: 'The Morning Show',
        email: 'john@example.com',
        external_connect_text: 'Follow on Twitter',
        external_connect_url: 'https://twitter.com/johndoe',
        pic: 'john.jpg',
        sort: 1,
        deleted: 'No',
      };

      const result = await importDJ(mockPayload as Payload, dj);

      expect(result).toBe(true);
      expect(findOrCreatePerson).toHaveBeenCalledWith(mockPayload, 'John Doe');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'djs',
        data: {
          person: ['person-id-123'],
          description: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: 'The Morning Show',
                    },
                  ],
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              version: 1,
            },
          },
          email: 'john@example.com',
          externalConnectText: 'Follow on Twitter',
          externalConnectUrl: 'https://twitter.com/johndoe',
          onAir: true,
          sortOrder: 1,
          legacyId: 1,
          migratedAt: expect.any(String),
          _status: 'published',
        },
      });
    });

    it('should handle multi-person DJs (e.g., "M.J. & Patria")', async () => {
      const { importDJ } = await import('./importDJs');
      const { findOrCreatePerson } = await import('./shared/payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (findOrCreatePerson as Mock)
        .mockResolvedValueOnce('person-id-mj')
        .mockResolvedValueOnce('person-id-patria');
      (mockPayload.create as Mock).mockResolvedValue({ id: 'dj-id-789' });

      const dj: Deejay = {
        id: 34,
        name: 'M.J. & Patria',
        show: 'Women CRUSH Wednesdays',
        email: 'mjpatria@example.com',
        external_connect_text: '',
        external_connect_url: '',
        pic: 'mjpatria.jpg',
        sort: 10,
        deleted: 'No',
      };

      const result = await importDJ(mockPayload as Payload, dj);

      expect(result).toBe(true);
      expect(findOrCreatePerson).toHaveBeenCalledTimes(2);
      expect(findOrCreatePerson).toHaveBeenCalledWith(mockPayload, 'M.J.');
      expect(findOrCreatePerson).toHaveBeenCalledWith(mockPayload, 'Patria');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'djs',
        data: {
          person: ['person-id-mj', 'person-id-patria'],
          description: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: 'Women CRUSH Wednesdays',
                    },
                  ],
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              version: 1,
            },
          },
          email: 'mjpatria@example.com',
          onAir: true,
          sortOrder: 10,
          legacyId: 34,
          migratedAt: expect.any(String),
          _status: 'published',
        },
      });
    });

    it('should handle empty email and external connect fields', async () => {
      const { importDJ } = await import('./importDJs');
      const { findOrCreatePerson } = await import('./shared/payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (findOrCreatePerson as Mock).mockResolvedValue('person-id-123');
      (mockPayload.create as Mock).mockResolvedValue({ id: 'dj-id-456' });

      const dj: Deejay = {
        id: 1,
        name: 'Jane Smith',
        show: 'Afternoon Drive',
        email: '',
        external_connect_text: '',
        external_connect_url: '',
        pic: '',
        sort: 2,
        deleted: 'No',
      };

      const result = await importDJ(mockPayload as Payload, dj);

      expect(result).toBe(true);
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'djs',
        data: expect.objectContaining({
          email: undefined,
          externalConnectText: undefined,
          externalConnectUrl: undefined,
        }),
      });
    });

    it('should set onAir to false when deleted is Yes', async () => {
      const { importDJ } = await import('./importDJs');
      const { findOrCreatePerson } = await import('./shared/payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (findOrCreatePerson as Mock).mockResolvedValue('person-id-123');
      (mockPayload.create as Mock).mockResolvedValue({ id: 'dj-id-456' });

      const dj: Deejay = {
        id: 1,
        name: 'Former DJ',
        show: 'Old Show',
        email: 'former@example.com',
        external_connect_text: '',
        external_connect_url: '',
        pic: '',
        sort: 99,
        deleted: 'Yes',
      };

      const result = await importDJ(mockPayload as Payload, dj);

      expect(result).toBe(true);
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'djs',
        data: expect.objectContaining({
          onAir: false,
        }),
      });
    });

    it('should preserve sort order', async () => {
      const { importDJ } = await import('./importDJs');
      const { findOrCreatePerson } = await import('./shared/payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (findOrCreatePerson as Mock).mockResolvedValue('person-id-123');
      (mockPayload.create as Mock).mockResolvedValue({ id: 'dj-id-456' });

      const dj: Deejay = {
        id: 1,
        name: 'DJ Name',
        show: 'Show Name',
        email: 'dj@example.com',
        external_connect_text: '',
        external_connect_url: '',
        pic: '',
        sort: 5,
        deleted: 'No',
      };

      const result = await importDJ(mockPayload as Payload, dj);

      expect(result).toBe(true);
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'djs',
        data: expect.objectContaining({
          sortOrder: 5,
        }),
      });
    });

    it('should strip HTML tags from DJ name field', async () => {
      const { importDJ } = await import('./importDJs');
      const { findOrCreatePerson } = await import('./shared/payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (findOrCreatePerson as Mock).mockResolvedValue('person-id-123');
      (mockPayload.create as Mock).mockResolvedValue({ id: 'dj-id-456' });

      const dj: Deejay = {
        id: 1,
        name: '<font color="blue">DJ Blue</font>',
        show: 'The <b>Bold</b> Show',
        email: 'dj@example.com',
        external_connect_text: '<i>Follow</i> me',
        external_connect_url: 'https://twitter.com',
        pic: '',
        sort: 1,
        deleted: 'No',
      };

      const result = await importDJ(mockPayload as Payload, dj);

      expect(result).toBe(true);
      expect(findOrCreatePerson).toHaveBeenCalledWith(mockPayload, 'DJ Blue');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'djs',
        data: expect.objectContaining({
          description: expect.objectContaining({
            root: expect.objectContaining({
              children: [
                expect.objectContaining({
                  children: [
                    expect.objectContaining({
                      text: 'The Bold Show',
                    }),
                  ],
                }),
              ],
            }),
          }),
          externalConnectText: 'Follow me',
          legacyId: 1,
        }),
      });
    });

    it('should preserve legacyId when importing DJ', async () => {
      const { importDJ } = await import('./importDJs');
      const { findOrCreatePerson } = await import('./shared/payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (findOrCreatePerson as Mock).mockResolvedValue('person-id-123');
      (mockPayload.create as Mock).mockResolvedValue({ id: 'dj-id-456' });

      const dj: Deejay = {
        id: 42,
        name: 'Test DJ',
        show: 'Test Show',
        email: 'test@example.com',
        external_connect_text: '',
        external_connect_url: '',
        pic: '',
        sort: 1,
        deleted: 'No',
      };

      const result = await importDJ(mockPayload as Payload, dj);

      expect(result).toBe(true);
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'djs',
        data: expect.objectContaining({
          legacyId: 42,
          migratedAt: expect.any(String),
          _status: 'published',
        }),
      });
    });
  });
});
