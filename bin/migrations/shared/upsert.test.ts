import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateDocumentId, createSlug, createUpsertHandler } from './upsert';
import { SanityClient } from '@sanity/client';

describe('upsert', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateDocumentId', () => {
    it('should generate ID from type and legacyId', () => {
      expect(generateDocumentId('artist', 123)).toBe('artist-123');
    });

    it('should handle different types', () => {
      expect(generateDocumentId('venue', 456)).toBe('venue-456');
      expect(generateDocumentId('concert', 789)).toBe('concert-789');
    });

    it('should handle zero legacyId', () => {
      expect(generateDocumentId('test', 0)).toBe('test-0');
    });
  });

  describe('createSlug', () => {
    it('should create slug from simple name', () => {
      const result = createSlug('Hello World');
      expect(result._type).toBe('slug');
      expect(result.current).toBe('hello-world');
    });

    it('should convert to lowercase', () => {
      const result = createSlug('UPPERCASE');
      expect(result.current).toBe('uppercase');
    });

    it('should replace special characters with hyphens', () => {
      const result = createSlug('Hello! World@2024');
      expect(result.current).toBe('hello-world-2024');
    });

    it('should remove leading hyphens', () => {
      const result = createSlug('!Hello');
      expect(result.current).toBe('hello');
    });

    it('should remove trailing hyphens', () => {
      const result = createSlug('Hello!');
      expect(result.current).toBe('hello');
    });

    it('should handle multiple special characters', () => {
      const result = createSlug('Hello---World');
      expect(result.current).toBe('hello-world');
    });

    it('should handle numbers', () => {
      const result = createSlug('Band 2024');
      expect(result.current).toBe('band-2024');
    });

    it('should handle accented characters by removing them', () => {
      const result = createSlug('Café Münich');
      expect(result.current).toBe('caf-m-nich');
    });

    it('should handle empty string', () => {
      const result = createSlug('');
      expect(result.current).toBe('');
    });

    it('should handle string with only special characters', () => {
      const result = createSlug('!!!');
      expect(result.current).toBe('');
    });
  });

  describe('createUpsertHandler', () => {
    let mockClient: Partial<SanityClient>;

    beforeEach(() => {
      mockClient = {
        fetch: vi.fn(),
        createOrReplace: vi.fn(),
        delete: vi.fn(),
      } as any;
    });

    describe('findByLegacyId', () => {
      it('should find document by legacy ID', async () => {
        const mockDoc = { _id: 'artist-123', _type: 'artist', legacyId: 123 };
        (mockClient.fetch as any).mockResolvedValue(mockDoc);

        const handler = createUpsertHandler(mockClient as SanityClient);
        const result = await handler.findByLegacyId('artist', 123);

        expect(result).toEqual(mockDoc);
        expect(mockClient.fetch).toHaveBeenCalledWith(
          '*[_type == $type && legacyId == $legacyId][0]',
          { type: 'artist', legacyId: 123 },
        );
      });

      it('should return null if document not found', async () => {
        (mockClient.fetch as any).mockResolvedValue(null);

        const handler = createUpsertHandler(mockClient as SanityClient);
        const result = await handler.findByLegacyId('artist', 999);

        expect(result).toBeNull();
      });

      it('should return null on error', async () => {
        (mockClient.fetch as any).mockRejectedValue(new Error('Network error'));

        const handler = createUpsertHandler(mockClient as SanityClient);
        const result = await handler.findByLegacyId('artist', 123);

        expect(result).toBeNull();
      });
    });

    describe('upsert', () => {
      it('should create new document if not exists', async () => {
        const newDoc = { _id: 'artist-123', _type: 'artist', legacyId: 123, name: 'Test Band' };
        (mockClient.fetch as any).mockResolvedValue(null); // Not found
        (mockClient.createOrReplace as any).mockResolvedValue({ _id: 'artist-123' });

        const handler = createUpsertHandler(mockClient as SanityClient);
        const result = await handler.upsert(newDoc as any);

        expect(result.success).toBe(true);
        expect(result.action).toBe('created');
        expect(result.documentId).toBe('artist-123');
        expect(mockClient.createOrReplace).toHaveBeenCalled();
      });

      it('should update existing document', async () => {
        const existingDoc = { _id: 'artist-123', _type: 'artist', legacyId: 123, name: 'Old Name' };
        const updatedDoc = { _id: 'artist-123', _type: 'artist', legacyId: 123, name: 'New Name' };

        (mockClient.fetch as any).mockResolvedValue(existingDoc);
        (mockClient.createOrReplace as any).mockResolvedValue({ _id: 'artist-123' });

        const handler = createUpsertHandler(mockClient as SanityClient);
        const result = await handler.upsert(updatedDoc as any);

        expect(result.success).toBe(true);
        expect(result.action).toBe('updated');
        expect(result.documentId).toBe('artist-123');
      });

      it('should skip if document exists and skipIfExists is true', async () => {
        const existingDoc = { _id: 'artist-123', _type: 'artist', legacyId: 123 };
        (mockClient.fetch as any).mockResolvedValue(existingDoc);

        const handler = createUpsertHandler(mockClient as SanityClient);
        const result = await handler.upsert(existingDoc as any, { skipIfExists: true });

        expect(result.success).toBe(true);
        expect(result.action).toBe('skipped');
        expect(result.documentId).toBe('artist-123');
        expect(mockClient.createOrReplace).not.toHaveBeenCalled();
      });

      it('should skip if document already migrated and forceUpdate is false', async () => {
        const existingDoc = {
          _id: 'artist-123',
          _type: 'artist',
          legacyId: 123,
          migratedAt: '2024-01-01T00:00:00.000Z',
        };
        (mockClient.fetch as any).mockResolvedValue(existingDoc);

        const handler = createUpsertHandler(mockClient as SanityClient);
        const result = await handler.upsert(existingDoc as any);

        expect(result.success).toBe(true);
        expect(result.action).toBe('skipped');
        expect(mockClient.createOrReplace).not.toHaveBeenCalled();
      });

      it('should update if document already migrated and forceUpdate is true', async () => {
        const existingDoc = {
          _id: 'artist-123',
          _type: 'artist',
          legacyId: 123,
          migratedAt: '2024-01-01T00:00:00.000Z',
        };
        (mockClient.fetch as any).mockResolvedValue(existingDoc);
        (mockClient.createOrReplace as any).mockResolvedValue({ _id: 'artist-123' });

        const handler = createUpsertHandler(mockClient as SanityClient);
        const result = await handler.upsert(existingDoc as any, { forceUpdate: true });

        expect(result.success).toBe(true);
        expect(result.action).toBe('updated');
        expect(mockClient.createOrReplace).toHaveBeenCalled();
      });

      it('should create document without legacyId', async () => {
        const newDoc = { _id: 'custom-id', _type: 'artist', name: 'Test Band' };
        (mockClient.createOrReplace as any).mockResolvedValue({ _id: 'custom-id' });

        const handler = createUpsertHandler(mockClient as SanityClient);
        const result = await handler.upsert(newDoc as any);

        expect(result.success).toBe(true);
        expect(result.action).toBe('created');
      });

      it('should handle upsert errors', async () => {
        const newDoc = { _id: 'artist-123', _type: 'artist', legacyId: 123 };
        (mockClient.fetch as any).mockResolvedValue(null);
        (mockClient.createOrReplace as any).mockRejectedValue(new Error('Create failed'));

        const handler = createUpsertHandler(mockClient as SanityClient);
        const result = await handler.upsert(newDoc as any);

        expect(result.success).toBe(false);
        expect(result.action).toBe('skipped');
        expect(result.error).toContain('Create failed');
      });

      it('should handle non-Error exceptions', async () => {
        const newDoc = { _id: 'artist-123', _type: 'artist', legacyId: 123 };
        (mockClient.fetch as any).mockResolvedValue(null);
        (mockClient.createOrReplace as any).mockRejectedValue('String error');

        const handler = createUpsertHandler(mockClient as SanityClient);
        const result = await handler.upsert(newDoc as any);

        expect(result.success).toBe(false);
        expect(result.error).toBe('String error');
      });
    });

    describe('batchUpsert', () => {
      it('should process multiple documents', async () => {
        const docs = [
          { _id: 'artist-1', _type: 'artist', legacyId: 1 },
          { _id: 'artist-2', _type: 'artist', legacyId: 2 },
          { _id: 'artist-3', _type: 'artist', legacyId: 3 },
        ];

        (mockClient.fetch as any).mockResolvedValue(null);
        (mockClient.createOrReplace as any)
          .mockResolvedValueOnce({ _id: 'artist-1' })
          .mockResolvedValueOnce({ _id: 'artist-2' })
          .mockResolvedValueOnce({ _id: 'artist-3' });

        const handler = createUpsertHandler(mockClient as SanityClient);
        const result = await handler.batchUpsert(docs as any);

        expect(result.total).toBe(3);
        expect(result.created).toBe(3);
        expect(result.updated).toBe(0);
        expect(result.skipped).toBe(0);
        expect(result.errors).toBe(0);
        expect(result.results).toHaveLength(3);
      });

      it('should track progress with callback', async () => {
        const docs = [
          { _id: 'artist-1', _type: 'artist', legacyId: 1 },
          { _id: 'artist-2', _type: 'artist', legacyId: 2 },
        ];

        (mockClient.fetch as any).mockResolvedValue(null);
        (mockClient.createOrReplace as any).mockResolvedValue({ _id: 'artist-1' });

        const progressCallback = vi.fn();
        const handler = createUpsertHandler(mockClient as SanityClient);
        await handler.batchUpsert(docs as any, { onProgress: progressCallback });

        expect(progressCallback).toHaveBeenCalledTimes(2);
        expect(progressCallback).toHaveBeenCalledWith(1, 2, expect.any(Object));
        expect(progressCallback).toHaveBeenCalledWith(2, 2, expect.any(Object));
      });

      it('should count created, updated, and skipped correctly', async () => {
        const docs = [
          { _id: 'artist-1', _type: 'artist', legacyId: 1 },
          { _id: 'artist-2', _type: 'artist', legacyId: 2 },
          { _id: 'artist-3', _type: 'artist', legacyId: 3 },
        ];

        // First: not found (create), Second: found without _migratedAt (update), Third: found with _migratedAt (skip)
        (mockClient.fetch as any)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ _id: 'artist-2', _type: 'artist', legacyId: 2 })
          .mockResolvedValueOnce({ _id: 'artist-3', _type: 'artist', legacyId: 3, migratedAt: '2024-01-01' });

        (mockClient.createOrReplace as any)
          .mockResolvedValueOnce({ _id: 'artist-1' })
          .mockResolvedValueOnce({ _id: 'artist-2' });

        const handler = createUpsertHandler(mockClient as SanityClient);
        const result = await handler.batchUpsert(docs as any);

        expect(result.total).toBe(3);
        expect(result.created).toBe(1);
        expect(result.updated).toBe(1);
        expect(result.skipped).toBe(1);
        expect(result.errors).toBe(0);
      });

      it('should count errors correctly', async () => {
        const docs = [
          { _id: 'artist-1', _type: 'artist', legacyId: 1 },
          { _id: 'artist-2', _type: 'artist', legacyId: 2 },
        ];

        (mockClient.fetch as any).mockResolvedValue(null);
        (mockClient.createOrReplace as any)
          .mockResolvedValueOnce({ _id: 'artist-1' })
          .mockRejectedValueOnce(new Error('Create failed'));

        const handler = createUpsertHandler(mockClient as SanityClient);
        const result = await handler.batchUpsert(docs as any);

        expect(result.created).toBe(1);
        expect(result.errors).toBe(1);
      });

      it('should handle empty array', async () => {
        const handler = createUpsertHandler(mockClient as SanityClient);
        const result = await handler.batchUpsert([]);

        expect(result.total).toBe(0);
        expect(result.created).toBe(0);
      });
    });

    describe('deleteByLegacyId', () => {
      it('should delete existing document', async () => {
        const existingDoc = { _id: 'artist-123', _type: 'artist', legacyId: 123 };
        (mockClient.fetch as any).mockResolvedValue(existingDoc);
        (mockClient.delete as any).mockResolvedValue(undefined);

        const handler = createUpsertHandler(mockClient as SanityClient);
        const result = await handler.deleteByLegacyId('artist', 123);

        expect(result).toBe(true);
        expect(mockClient.delete).toHaveBeenCalledWith('artist-123');
      });

      it('should return false if document not found', async () => {
        (mockClient.fetch as any).mockResolvedValue(null);

        const handler = createUpsertHandler(mockClient as SanityClient);
        const result = await handler.deleteByLegacyId('artist', 999);

        expect(result).toBe(false);
        expect(mockClient.delete).not.toHaveBeenCalled();
      });

      it('should return false on delete error', async () => {
        const existingDoc = { _id: 'artist-123', _type: 'artist', legacyId: 123 };
        (mockClient.fetch as any).mockResolvedValue(existingDoc);
        (mockClient.delete as any).mockRejectedValue(new Error('Delete failed'));

        const handler = createUpsertHandler(mockClient as SanityClient);
        const result = await handler.deleteByLegacyId('artist', 123);

        expect(result).toBe(false);
      });
    });
  });
});
