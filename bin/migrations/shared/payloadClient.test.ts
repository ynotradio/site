/**
 * Unit tests for Payload client utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import type { Payload } from 'payload';

// Mock the payload module
vi.mock('payload', () => ({
  getPayload: vi.fn(),
}));

// Mock logger
vi.mock('./logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Mock dotenv
vi.mock('dotenv', () => ({
  default: {
    config: vi.fn(),
  },
  config: vi.fn(),
}));

// Mock musicbrainz
vi.mock('./musicbrainz', () => ({
  getArtistMbid: vi.fn(),
  getRecordingMbid: vi.fn(),
}));

// Mock payload.config for getPayloadClient success path
vi.mock('../../../payload.config', () => ({
  default: { db: {}, collections: [] },
}));

describe('payloadClient', () => {
  let mockPayload: Partial<Payload>;
  let mockGetArtistMbid: Mock;
  let mockGetRecordingMbid: Mock;

  beforeEach(async () => {
    vi.clearAllMocks();
    const musicbrainz = await import('./musicbrainz');
    mockGetArtistMbid = musicbrainz.getArtistMbid as Mock;
    mockGetRecordingMbid = musicbrainz.getRecordingMbid as Mock;

    mockPayload = {
      find: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findByID: vi.fn(),
    };
  });

  describe('getPayloadClient', () => {
    const savedEnv: Record<string, string | undefined> = {};

    beforeEach(() => {
      savedEnv.NEON_PROD_DATABASE_URL = process.env.NEON_PROD_DATABASE_URL;
      savedEnv.NEON_DEV_DATABASE_URL = process.env.NEON_DEV_DATABASE_URL;
      savedEnv.DATABASE_URI = process.env.DATABASE_URI;
      delete process.env.NEON_PROD_DATABASE_URL;
      delete process.env.NEON_DEV_DATABASE_URL;
      delete process.env.DATABASE_URI;
    });

    afterEach(() => {
      process.env.NEON_PROD_DATABASE_URL = savedEnv.NEON_PROD_DATABASE_URL;
      process.env.NEON_DEV_DATABASE_URL = savedEnv.NEON_DEV_DATABASE_URL;
      process.env.DATABASE_URI = savedEnv.DATABASE_URI;
    });

    it('should throw when NEON_PROD_DATABASE_URL is not set for prod-neon target', async () => {
      process.env.YES_I_MEAN_PROD = 'true';
      const { getPayloadClient } = await import('./payloadClient');
      await expect(getPayloadClient('prod-neon')).rejects.toThrow(
        'Database URI not found for target "prod-neon"',
      );
      delete process.env.YES_I_MEAN_PROD;
    });

    it('should throw when neither NEON_DEV_DATABASE_URL nor DATABASE_URI is set for local-postgres', async () => {
      const { getPayloadClient } = await import('./payloadClient');
      await expect(getPayloadClient('local-postgres')).rejects.toThrow(
        'Database URI not found for target "local-postgres"',
      );
    });

    it('should throw when NEON_DEV_DATABASE_URL is not set for dev-neon target', async () => {
      const { getPayloadClient } = await import('./payloadClient');
      await expect(getPayloadClient('dev-neon')).rejects.toThrow(
        'Database URI not found for target "dev-neon"',
      );
    });

    it('should use DATABASE_URI fallback when NEON_DEV_DATABASE_URL is not set for local-postgres', async () => {
      process.env.DATABASE_URI = 'postgresql://local/fallback';
      const { getPayload } = await import('payload');
      const mockFallback = { find: vi.fn() };
      (getPayload as Mock).mockResolvedValueOnce(mockFallback);

      const { getPayloadClient } = await import('./payloadClient');
      const result = await getPayloadClient('local-postgres');

      expect(result).toBe(mockFallback);
      expect(process.env.DATABASE_URI).toBe('postgresql://local/fallback');
    });

    it('should prefer DATABASE_URI over NEON_DEV_DATABASE_URL for local-postgres target', async () => {
      process.env.DATABASE_URI = 'postgresql://local/actual';
      process.env.NEON_DEV_DATABASE_URL = 'postgresql://dev/should-not-be-used';
      const { getPayload } = await import('payload');
      const mockLocal = { find: vi.fn() };
      (getPayload as Mock).mockResolvedValueOnce(mockLocal);

      const { getPayloadClient } = await import('./payloadClient');
      await getPayloadClient('local-postgres');

      expect(process.env.DATABASE_URI).toBe('postgresql://local/actual');
    });

    it('should default to local-postgres when no target is given', async () => {
      process.env.DATABASE_URI = 'postgresql://local/default';
      const { getPayload } = await import('payload');
      const mockDefault = { find: vi.fn() };
      (getPayload as Mock).mockResolvedValueOnce(mockDefault);

      const { getPayloadClient } = await import('./payloadClient');
      const result = await getPayloadClient();

      expect(result).toBe(mockDefault);
    });

    it('should refuse prod-neon target without YES_I_MEAN_PROD=true', async () => {
      process.env.NEON_PROD_DATABASE_URL = 'postgresql://prod/db';
      delete process.env.YES_I_MEAN_PROD;

      const { getPayloadClient } = await import('./payloadClient');
      await expect(getPayloadClient('prod-neon')).rejects.toThrow(
        'Refusing to connect to production database',
      );
    });

    it('should return uri for prod-neon when NEON_PROD_DATABASE_URL is set and YES_I_MEAN_PROD=true', async () => {
      process.env.NEON_PROD_DATABASE_URL = 'postgresql://prod/db';
      process.env.YES_I_MEAN_PROD = 'true';
      const { getPayload } = await import('payload');
      const mockProd = { find: vi.fn(), create: vi.fn() };
      (getPayload as Mock).mockResolvedValueOnce(mockProd);

      const { getPayloadClient } = await import('./payloadClient');
      const result = await getPayloadClient('prod-neon');

      expect(result).toBe(mockProd);
      expect(process.env.DATABASE_URI).toBe('postgresql://prod/db');

      delete process.env.YES_I_MEAN_PROD;
    });

    it('should return uri for dev-neon when NEON_DEV_DATABASE_URL is set', async () => {
      process.env.NEON_DEV_DATABASE_URL = 'postgresql://dev/db';
      const { getPayload } = await import('payload');
      const mockDev = { find: vi.fn(), create: vi.fn() };
      (getPayload as Mock).mockResolvedValueOnce(mockDev);

      const { getPayloadClient } = await import('./payloadClient');
      const result = await getPayloadClient('dev-neon');

      expect(result).toBe(mockDev);
      expect(process.env.DATABASE_URI).toBe('postgresql://dev/db');
    });

    it('should connect successfully for local-postgres when NEON_DEV_DATABASE_URL is set', async () => {
      process.env.NEON_DEV_DATABASE_URL = 'postgresql://local/dev';
      const { getPayload } = await import('payload');
      const mockLocal = { find: vi.fn(), create: vi.fn() };
      (getPayload as Mock).mockResolvedValueOnce(mockLocal);

      const { getPayloadClient } = await import('./payloadClient');
      const result = await getPayloadClient('local-postgres');

      expect(result).toBe(mockLocal);
    });
  });

  describe('prod-write guard', () => {
    const savedEnv: Record<string, string | undefined> = {};

    beforeEach(() => {
      savedEnv.NEON_PROD_DATABASE_URL = process.env.NEON_PROD_DATABASE_URL;
      savedEnv.DATABASE_URI = process.env.DATABASE_URI;
      savedEnv.YES_I_MEAN_PROD = process.env.YES_I_MEAN_PROD;
      delete process.env.NEON_PROD_DATABASE_URL;
      delete process.env.DATABASE_URI;
      delete process.env.YES_I_MEAN_PROD;
    });

    afterEach(() => {
      process.env.NEON_PROD_DATABASE_URL = savedEnv.NEON_PROD_DATABASE_URL;
      process.env.DATABASE_URI = savedEnv.DATABASE_URI;
      process.env.YES_I_MEAN_PROD = savedEnv.YES_I_MEAN_PROD;
    });

    describe('isProdTarget', () => {
      it('is true for prod and prod-neon', async () => {
        const { isProdTarget } = await import('./payloadClient');
        expect(isProdTarget('prod')).toBe(true);
        expect(isProdTarget('prod-neon')).toBe(true);
      });

      it('is false for non-prod targets', async () => {
        const { isProdTarget } = await import('./payloadClient');
        expect(isProdTarget('dev')).toBe(false);
        expect(isProdTarget('dev-neon')).toBe(false);
        expect(isProdTarget('local-postgres')).toBe(false);
      });
    });

    describe('assertProdWriteAllowed', () => {
      it('does not throw for non-prod targets', async () => {
        const { assertProdWriteAllowed } = await import('./payloadClient');
        expect(() => assertProdWriteAllowed('local-postgres')).not.toThrow();
        expect(() => assertProdWriteAllowed('dev-neon')).not.toThrow();
      });

      it('throws for prod targets without YES_I_MEAN_PROD=true', async () => {
        const { assertProdWriteAllowed } = await import('./payloadClient');
        expect(() => assertProdWriteAllowed('prod-neon')).toThrow(
          'Refusing to connect to production database',
        );
      });

      it('does not throw for prod targets when YES_I_MEAN_PROD=true', async () => {
        process.env.YES_I_MEAN_PROD = 'true';
        const { assertProdWriteAllowed } = await import('./payloadClient');
        expect(() => assertProdWriteAllowed('prod-neon')).not.toThrow();
      });
    });

    describe('assertNotConnectedToProd', () => {
      it('does not throw when DATABASE_URI is unset', async () => {
        process.env.NEON_PROD_DATABASE_URL = 'postgresql://prod/db';
        const { assertNotConnectedToProd } = await import('./payloadClient');
        expect(() => assertNotConnectedToProd()).not.toThrow();
      });

      it('does not throw when DATABASE_URI differs from prod', async () => {
        process.env.NEON_PROD_DATABASE_URL = 'postgresql://prod/db';
        process.env.DATABASE_URI = 'postgresql://dev/db';
        const { assertNotConnectedToProd } = await import('./payloadClient');
        expect(() => assertNotConnectedToProd()).not.toThrow();
      });

      it('throws when DATABASE_URI matches prod without YES_I_MEAN_PROD=true', async () => {
        process.env.NEON_PROD_DATABASE_URL = 'postgresql://prod/db';
        process.env.DATABASE_URI = 'postgresql://prod/db';
        const { assertNotConnectedToProd } = await import('./payloadClient');
        expect(() => assertNotConnectedToProd()).toThrow(
          'DATABASE_URI is currently set to the production database',
        );
      });

      it('does not throw when DATABASE_URI matches prod and YES_I_MEAN_PROD=true', async () => {
        process.env.NEON_PROD_DATABASE_URL = 'postgresql://prod/db';
        process.env.DATABASE_URI = 'postgresql://prod/db';
        process.env.YES_I_MEAN_PROD = 'true';
        const { assertNotConnectedToProd } = await import('./payloadClient');
        expect(() => assertNotConnectedToProd()).not.toThrow();
      });
    });
  });

  describe('findOrCreateArtist', () => {
    it('should return existing artist ID when found by name', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'existing-artist-456' }] });

      const artistId = await findOrCreateArtist(mockPayload as Payload, 'Test Artist');

      expect(artistId).toBe('existing-artist-456');
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'artists',
        where: {
          name: {
            equals: 'Test Artist',
          },
        },
        limit: 1,
      });
    });

    it('should create new artist when not found', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      mockGetArtistMbid.mockResolvedValueOnce(null);
      (mockPayload.create as Mock).mockResolvedValue({ id: 'new-artist-789' });

      const artistId = await findOrCreateArtist(mockPayload as Payload, 'New Artist');

      expect(artistId).toBe('new-artist-789');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'artists',
        data: {
          name: 'New Artist',
          slug: 'new-artist',
          musicbrainzId: undefined,
        },
      });
    });

    it('should add MusicBrainz ID to existing artist without one', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({
        docs: [{ id: 'existing-789', musicbrainzId: null }],
      });
      mockGetArtistMbid.mockResolvedValueOnce('mbid-999');

      const artistId = await findOrCreateArtist(mockPayload as Payload, 'Test Artist');

      expect(artistId).toBe('existing-789');
      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'artists',
        id: 'existing-789',
        data: {
          musicbrainzId: 'mbid-999',
        },
      });
    });

    it('should not fail if MusicBrainz update fails for existing artist', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({
        docs: [{ id: 'existing-123', musicbrainzId: null }],
      });
      mockGetArtistMbid.mockRejectedValueOnce(new Error('MB API error'));

      const artistId = await findOrCreateArtist(mockPayload as Payload, 'Test Artist');

      expect(artistId).toBe('existing-123');
    });

    it('should create artist with MusicBrainz ID when not found', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      mockGetArtistMbid.mockResolvedValueOnce('mbid-new');
      (mockPayload.create as Mock).mockResolvedValueOnce({ id: 'new-artist-999' });

      const artistId = await findOrCreateArtist(mockPayload as Payload, 'New Artist');

      expect(artistId).toBe('new-artist-999');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'artists',
        data: {
          name: 'New Artist',
          slug: 'new-artist',
          musicbrainzId: 'mbid-new',
        },
      });
    });

    it('should create artist without MusicBrainz ID if lookup fails', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      mockGetArtistMbid.mockRejectedValueOnce(new Error('MB API error'));
      (mockPayload.create as Mock).mockResolvedValueOnce({ id: 'new-artist-888' });

      const artistId = await findOrCreateArtist(mockPayload as Payload, 'New Artist');

      expect(artistId).toBe('new-artist-888');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'artists',
        data: {
          name: 'New Artist',
          slug: 'new-artist',
          musicbrainzId: undefined,
        },
      });
    });

    it('should skip MusicBrainz update when existing artist already has musicbrainzId', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({
        docs: [{ id: 'existing-with-mbid', musicbrainzId: 'mbid-already-set' }],
      });

      const artistId = await findOrCreateArtist(mockPayload as Payload, 'Known Artist');

      expect(artistId).toBe('existing-with-mbid');
      expect(mockPayload.update).not.toHaveBeenCalled();
      expect(mockGetArtistMbid).not.toHaveBeenCalled();
    });

    it('should handle slug validation error by finding existing artist', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] }) // Find by name returns empty
        .mockResolvedValueOnce({ docs: [{ id: 'existing-by-slug-123' }] }); // Then find by slug succeeds

      mockGetArtistMbid.mockResolvedValueOnce(null);

      const slugError = {
        status: 400,
        data: {
          errors: [{ path: 'slug', message: 'Slug must be unique' }],
        },
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(slugError);

      const artistId = await findOrCreateArtist(mockPayload as Payload, 'Test Artist');

      expect(artistId).toBe('existing-by-slug-123');
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'artists',
        where: {
          slug: {
            equals: 'test-artist',
          },
        },
        limit: 1,
      });
    });

    it('should rethrow error if not a slug validation error', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] }); // Find by name
      mockGetArtistMbid.mockResolvedValueOnce(null);

      const otherError = {
        status: 500,
        data: { errors: [{ path: 'name', message: 'Database error' }] },
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(otherError);

      await expect(findOrCreateArtist(mockPayload as Payload, 'Test Artist')).rejects.toEqual(
        otherError,
      );
    });

    it('should rethrow error if slug validation fails and no existing artist found', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] }) // Find by name
        .mockResolvedValueOnce({ docs: [] }); // Find by slug also returns empty

      mockGetArtistMbid.mockResolvedValueOnce(null);

      const slugError = {
        status: 400,
        data: {
          errors: [{ path: 'slug', message: 'Slug must be unique' }],
        },
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(slugError);

      await expect(findOrCreateArtist(mockPayload as Payload, 'Test Artist')).rejects.toEqual(
        slugError,
      );
    });

    it('should handle MusicBrainz ID duplicate by retrying without MBID', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      mockGetArtistMbid.mockResolvedValueOnce('duplicate-mbid');

      const mbidError = {
        status: 400,
        data: {
          errors: [{ path: 'musicbrainzId', message: 'Value must be unique' }],
        },
      };
      // First create fails with MBID duplicate
      (mockPayload.create as Mock)
        .mockRejectedValueOnce(mbidError)
        .mockResolvedValueOnce({ id: 'new-artist-no-mbid' }); // Retry succeeds

      const artistId = await findOrCreateArtist(mockPayload as Payload, 'Test Artist');

      expect(artistId).toBe('new-artist-no-mbid');
      expect(mockPayload.create).toHaveBeenCalledTimes(2);
    });

    it('should rethrow non-slug error from MBID retry failure', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      mockGetArtistMbid.mockResolvedValueOnce('duplicate-mbid');

      const mbidError = {
        status: 400,
        data: { errors: [{ path: 'musicbrainzId', message: 'Value must be unique' }] },
      };
      const retryError = { status: 500, message: 'Server error during retry' };

      (mockPayload.create as Mock)
        .mockRejectedValueOnce(mbidError)
        .mockRejectedValueOnce(retryError);

      await expect(findOrCreateArtist(mockPayload as Payload, 'Test Artist')).rejects.toEqual(
        retryError,
      );
    });

    it('should rethrow slug error from MBID retry when no artist found by slug', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] }) // Initial find by name
        .mockResolvedValueOnce({ docs: [] }); // findDocBySlug returns empty

      mockGetArtistMbid.mockResolvedValueOnce('duplicate-mbid');

      const mbidError = {
        status: 400,
        data: { errors: [{ path: 'musicbrainzId', message: 'Value must be unique' }] },
      };
      const retrySlugError = {
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Slug must be unique' }] },
      };

      (mockPayload.create as Mock)
        .mockRejectedValueOnce(mbidError)
        .mockRejectedValueOnce(retrySlugError);

      await expect(findOrCreateArtist(mockPayload as Payload, 'Test Artist')).rejects.toEqual(
        retrySlugError,
      );
    });
  });

  describe('findOrCreateVenue', () => {
    it('should return existing venue ID when found by name', async () => {
      const { findOrCreateVenue } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'existing-venue-456' }] });

      const venueId = await findOrCreateVenue(mockPayload as Payload, 'Test Venue');

      expect(venueId).toBe('existing-venue-456');
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'venues',
        where: {
          name: {
            equals: 'Test Venue',
          },
        },
        limit: 1,
      });
    });

    it('should create new venue when not found', async () => {
      const { findOrCreateVenue } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'new-venue-789' });

      const venueId = await findOrCreateVenue(mockPayload as Payload, 'New Venue');

      expect(venueId).toBe('new-venue-789');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'venues',
        data: {
          name: 'New Venue',
          slug: 'new-venue',
        },
      });
    });
  });

  describe('findDJByDisplayName', () => {
    it('should return DJ ID when found by exact match', async () => {
      const { findDJByDisplayName } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'dj-123' }] });

      const djId = await findDJByDisplayName(mockPayload as Payload, 'Shana');

      expect(djId).toBe('dj-123');
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'djs',
        where: {
          displayName: {
            equals: 'Shana',
          },
        },
        limit: 1,
      });
    });

    it('should return DJ ID when found by contains match', async () => {
      const { findDJByDisplayName } = await import('./payloadClient');

      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] }) // Exact match fails
        .mockResolvedValueOnce({ docs: [{ id: 'dj-456' }] }); // Contains match succeeds

      const djId = await findDJByDisplayName(mockPayload as Payload, 'Shana');

      expect(djId).toBe('dj-456');
    });

    it('should return null when DJ not found', async () => {
      const { findDJByDisplayName } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });

      const djId = await findDJByDisplayName(mockPayload as Payload, 'Unknown DJ');

      expect(djId).toBeNull();
    });

    it('should return null for empty name', async () => {
      const { findDJByDisplayName } = await import('./payloadClient');

      const djId = await findDJByDisplayName(mockPayload as Payload, '');

      expect(djId).toBeNull();
      expect(mockPayload.find).not.toHaveBeenCalled();
    });
  });

  describe('findOrCreateSong', () => {
    it('should return existing song ID when found', async () => {
      const { findOrCreateSong } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'song-123' }] });

      const songId = await findOrCreateSong(mockPayload as Payload, 'Test Song', 42);

      expect(songId).toBe('song-123');
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'songs',
        where: {
          title: { equals: 'Test Song' },
          artist: { equals: 42 },
        },
        limit: 1,
      });
    });

    it('should create new song when not found', async () => {
      const { findOrCreateSong } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.findByID as Mock).mockResolvedValue({ name: 'New Song Artist' });
      mockGetRecordingMbid.mockResolvedValue('recording-mbid-123');
      (mockPayload.create as Mock).mockResolvedValue({ id: 'new-song-789' });

      const songId = await findOrCreateSong(mockPayload as Payload, 'New Song', 42);

      expect(songId).toBe('new-song-789');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'songs',
        data: {
          title: 'New Song',
          artist: 42,
          musicbrainzId: 'recording-mbid-123',
        },
      });
    });

    it('should create song without artist if artistId not provided', async () => {
      const { findOrCreateSong } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      mockGetRecordingMbid.mockResolvedValue(null);
      (mockPayload.create as Mock).mockResolvedValue({ id: 'new-song-999' });

      const songId = await findOrCreateSong(mockPayload as Payload, 'Orphan Song');

      expect(songId).toBe('new-song-999');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'songs',
        data: {
          title: 'Orphan Song',
        },
      });
    });

    it('should throw error for empty title', async () => {
      const { findOrCreateSong } = await import('./payloadClient');

      await expect(findOrCreateSong(mockPayload as Payload, '')).rejects.toThrow(
        'Song title is required',
      );
    });

    it('retries song creation without MBID on musicbrainzId conflict', async () => {
      const { findOrCreateSong } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      (mockPayload.findByID as Mock).mockResolvedValueOnce({ name: 'Conflict Artist' });
      mockGetRecordingMbid.mockResolvedValueOnce('duplicate-mbid');
      const mbidError = {
        status: 400,
        data: { errors: [{ path: 'musicbrainzId', message: 'Value must be unique' }] },
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(mbidError);
      (mockPayload.create as Mock).mockResolvedValueOnce({ id: 'song-without-mbid' });

      const songId = await findOrCreateSong(mockPayload as Payload, 'Conflict Song', 99);

      expect(songId).toBe('song-without-mbid');
      expect(mockPayload.create).toHaveBeenNthCalledWith(2, {
        collection: 'songs',
        data: {
          title: 'Conflict Song',
          artist: 99,
        },
      });
    });
  });

  describe('parseOnDemandHeadline', () => {
    it('should extract DJ names from "with" pattern', async () => {
      const { parseOnDemandHeadline } = await import('./payloadClient');

      const result = parseOnDemandHeadline('Aussie Unlocked with Shana');

      expect(result.djNames).toContain('Shana');
    });

    it('should extract artist names from "featuring" pattern', async () => {
      const { parseOnDemandHeadline } = await import('./payloadClient');

      const result = parseOnDemandHeadline('Live Session featuring The Strokes');

      expect(result.artistNames).toContain('The Strokes');
    });

    it('should handle headlines with no special patterns', async () => {
      const { parseOnDemandHeadline } = await import('./payloadClient');

      const result = parseOnDemandHeadline('Simple Show Title');

      expect(result.djNames).toHaveLength(0);
      expect(result.artistNames).toHaveLength(0);
      expect(result.cleanTitle).toBe('Simple Show Title');
    });
  });

  describe('findOrCreateArtist - error edge cases', () => {
    it('should handle name conflict (race condition) by retrying find', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      mockGetArtistMbid.mockResolvedValueOnce(null);
      const nameError = {
        status: 400,
        data: { errors: [{ path: 'name', message: 'Duplicate name' }] },
        message: 'Duplicate name',
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(nameError);
      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'race-condition-artist' }] });

      const artistId = await findOrCreateArtist(mockPayload as Payload, 'Race Condition Artist');

      expect(artistId).toBe('race-condition-artist');
    });

    it('should rethrow when name conflict retry finds nothing', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      mockGetArtistMbid.mockResolvedValueOnce(null);
      const nameError = {
        status: 400,
        data: { errors: [{ path: 'name', message: 'Duplicate name' }] },
        message: 'Duplicate name',
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(nameError);
      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });

      await expect(
        findOrCreateArtist(mockPayload as Payload, 'Race Condition Artist'),
      ).rejects.toEqual(nameError);
    });

    it('should handle MBID conflict when retry also hits slug conflict', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      mockGetArtistMbid.mockResolvedValueOnce('some-mbid');
      const mbidError = {
        status: 400,
        data: { errors: [{ path: 'musicbrainzId', message: 'Duplicate MBID' }] },
        message: 'Duplicate MBID',
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(mbidError);
      const slugError = {
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Duplicate slug' }] },
        message: 'Duplicate slug',
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(slugError);
      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'slug-fallback-artist' }] });

      const artistId = await findOrCreateArtist(mockPayload as Payload, 'Duplicate Artist');

      expect(artistId).toBe('slug-fallback-artist');
    });
  });

  describe('findOrCreateVenue - error handling', () => {
    it('should handle slug conflict by finding venue by slug', async () => {
      const { findOrCreateVenue } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      const slugError = {
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Duplicate slug' }] },
        message: 'Duplicate slug',
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(slugError);
      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'existing-venue-by-slug' }] });

      const venueId = await findOrCreateVenue(mockPayload as Payload, 'The Venue');

      expect(venueId).toBe('existing-venue-by-slug');
    });

    it('should rethrow non-slug errors', async () => {
      const { findOrCreateVenue } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      const genericError = { status: 500, message: 'Database error' };
      (mockPayload.create as Mock).mockRejectedValueOnce(genericError);

      await expect(
        findOrCreateVenue(mockPayload as Payload, 'Bad Venue'),
      ).rejects.toEqual(genericError);
    });

    it('should rethrow slug error when no existing venue found by slug', async () => {
      const { findOrCreateVenue } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      const slugError = {
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Duplicate slug' }] },
        message: 'Duplicate slug',
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(slugError);
      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });

      await expect(
        findOrCreateVenue(mockPayload as Payload, 'Ghost Venue'),
      ).rejects.toEqual(slugError);
    });
  });

  describe('findOrCreatePerson', () => {
    it('should return existing person ID when found by legacy ID', async () => {
      const { findOrCreatePerson } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'person-by-legacy' }] });

      const personId = await findOrCreatePerson(mockPayload as Payload, 'John Doe', 42);

      expect(personId).toBe('person-by-legacy');
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'people',
        where: { legacyId: { equals: 42 } },
        limit: 1,
      });
    });

    it('should fallback to name search when legacy ID not found', async () => {
      const { findOrCreatePerson } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'person-by-name' }] });

      const personId = await findOrCreatePerson(mockPayload as Payload, 'John Doe', 99);

      expect(personId).toBe('person-by-name');
    });

    it('should return existing person ID when found by name (no legacy ID)', async () => {
      const { findOrCreatePerson } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'person-123' }] });

      const personId = await findOrCreatePerson(mockPayload as Payload, 'Jane Smith');

      expect(personId).toBe('person-123');
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'people',
        where: { name: { equals: 'Jane Smith' } },
        limit: 1,
      });
    });

    it('should create new person when not found', async () => {
      const { findOrCreatePerson } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValueOnce({ id: 'new-person-456' });

      const personId = await findOrCreatePerson(mockPayload as Payload, 'New Person');

      expect(personId).toBe('new-person-456');
      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'people',
          data: expect.objectContaining({
            name: 'New Person',
            slug: 'new-person',
          }),
        }),
      );
    });

    it('should create person with legacyId when provided', async () => {
      const { findOrCreatePerson } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValueOnce({ id: 'new-person-789' });

      const personId = await findOrCreatePerson(mockPayload as Payload, 'Legacy Person', 7);

      expect(personId).toBe('new-person-789');
      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'people',
          data: expect.objectContaining({
            legacyId: 7,
          }),
        }),
      );
    });

    it('should handle slug conflict by finding person by slug', async () => {
      const { findOrCreatePerson } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      const slugError = {
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Duplicate slug' }] },
        message: 'Duplicate slug',
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(slugError);
      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'person-by-slug' }] });

      const personId = await findOrCreatePerson(mockPayload as Payload, 'Duplicate Person');

      expect(personId).toBe('person-by-slug');
    });

    it('should rethrow non-slug errors', async () => {
      const { findOrCreatePerson } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      const genericError = { status: 500, message: 'Database error' };
      (mockPayload.create as Mock).mockRejectedValueOnce(genericError);

      await expect(
        findOrCreatePerson(mockPayload as Payload, 'Error Person'),
      ).rejects.toEqual(genericError);
    });

    it('should rethrow slug error when no existing person found by slug', async () => {
      const { findOrCreatePerson } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      const slugError = {
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Duplicate slug' }] },
        message: 'Duplicate slug',
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(slugError);
      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });

      await expect(
        findOrCreatePerson(mockPayload as Payload, 'Ghost Person'),
      ).rejects.toEqual(slugError);
    });
  });

  describe('findDJByLegacyId', () => {
    it('should return DJ ID when found by legacy ID', async () => {
      const { findDJByLegacyId } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'dj-legacy-123' }] });

      const djId = await findDJByLegacyId(mockPayload as Payload, 42);

      expect(djId).toBe('dj-legacy-123');
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'djs',
        where: { legacyId: { equals: 42 } },
        limit: 1,
      });
    });

    it('should return null when DJ not found by legacy ID', async () => {
      const { findDJByLegacyId } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });

      const djId = await findDJByLegacyId(mockPayload as Payload, 999);

      expect(djId).toBeNull();
    });
  });

  describe('findOrCreateRecord', () => {
    it('should return existing record ID when found by legacy ID', async () => {
      const { findOrCreateRecord } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'record-by-legacy' }] });

      const recordId = await findOrCreateRecord(mockPayload as Payload, 'Test Album', 1, 42);

      expect(recordId).toBe('record-by-legacy');
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'records',
        where: { legacyId: { equals: 42 } },
        limit: 1,
      });
    });

    it('should fallback to title+artist search when legacy ID not found', async () => {
      const { findOrCreateRecord } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'record-by-title-artist' }] });

      const recordId = await findOrCreateRecord(mockPayload as Payload, 'Known Album', 5, 99);

      expect(recordId).toBe('record-by-title-artist');
    });

    it('should return existing record ID when found by title and artist', async () => {
      const { findOrCreateRecord } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'record-123' }] });

      const recordId = await findOrCreateRecord(mockPayload as Payload, 'Test Album', 1);

      expect(recordId).toBe('record-123');
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'records',
        where: {
          and: [
            { title: { equals: 'Test Album' } },
            { artist: { equals: 1 } },
          ],
        },
        limit: 1,
      });
    });

    it('should create new record when not found', async () => {
      const { findOrCreateRecord } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValueOnce({ id: 'new-record-456' });

      const recordId = await findOrCreateRecord(mockPayload as Payload, 'New Album', 2);

      expect(recordId).toBe('new-record-456');
      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'records',
          data: expect.objectContaining({
            title: 'New Album',
            artist: 2,
          }),
        }),
      );
    });

    it('should handle slug conflict by looking up artist name and finding by slug', async () => {
      const { findOrCreateRecord } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      const slugError = {
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Duplicate slug' }] },
        message: 'Duplicate slug',
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(slugError);
      (mockPayload.findByID as Mock).mockResolvedValueOnce({ name: 'The Artist' });
      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'record-by-slug' }] });

      const recordId = await findOrCreateRecord(mockPayload as Payload, 'Duplicate Album', 3);

      expect(recordId).toBe('record-by-slug');
      expect(mockPayload.findByID).toHaveBeenCalledWith({ collection: 'artists', id: 3 });
    });

    it('should handle slug conflict when artist lookup fails', async () => {
      const { findOrCreateRecord } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      const slugError = {
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Duplicate slug' }] },
        message: 'Duplicate slug',
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(slugError);
      (mockPayload.findByID as Mock).mockRejectedValueOnce(new Error('Not found'));
      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'record-no-artist' }] });

      const recordId = await findOrCreateRecord(mockPayload as Payload, 'Orphan Album', 4);

      expect(recordId).toBe('record-no-artist');
    });

    it('should handle slug conflict when artist has no name', async () => {
      const { findOrCreateRecord } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      const slugError = {
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Duplicate slug' }] },
        message: 'Duplicate slug',
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(slugError);
      (mockPayload.findByID as Mock).mockResolvedValueOnce({ id: 5 }); // no name field
      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'record-nameless-artist' }] });

      const recordId = await findOrCreateRecord(mockPayload as Payload, 'Nameless Artist Album', 5);

      expect(recordId).toBe('record-nameless-artist');
    });

    it('should rethrow non-slug errors', async () => {
      const { findOrCreateRecord } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      const genericError = { status: 500, message: 'Database error' };
      (mockPayload.create as Mock).mockRejectedValueOnce(genericError);

      await expect(
        findOrCreateRecord(mockPayload as Payload, 'Error Album', 5),
      ).rejects.toEqual(genericError);
    });

    it('should rethrow slug error when no existing record found by slug', async () => {
      const { findOrCreateRecord } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      const slugError = {
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Duplicate slug' }] },
        message: 'Duplicate slug',
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(slugError);
      (mockPayload.findByID as Mock).mockResolvedValueOnce({ name: 'Some Artist' });
      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });

      await expect(
        findOrCreateRecord(mockPayload as Payload, 'Ghost Album', 6),
      ).rejects.toEqual(slugError);
    });
  });

  describe('findOrCreateSong - slug error handling', () => {
    it('should handle slug conflict by looking up artist name and finding by slug', async () => {
      const { findOrCreateSong } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      (mockPayload.findByID as Mock).mockResolvedValueOnce({ name: 'Song Artist' });
      mockGetRecordingMbid.mockResolvedValueOnce(null);
      const slugError = {
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Duplicate slug' }] },
        message: 'Duplicate slug',
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(slugError);
      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'song-by-slug' }] });

      const songId = await findOrCreateSong(mockPayload as Payload, 'Duplicate Song', 10);

      expect(songId).toBe('song-by-slug');
      expect(mockPayload.findByID).toHaveBeenCalledWith({ collection: 'artists', id: 10 });
    });

    it('should handle slug conflict with no artist ID', async () => {
      const { findOrCreateSong } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      mockGetRecordingMbid.mockResolvedValueOnce(null);
      const slugError = {
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Duplicate slug' }] },
        message: 'Duplicate slug',
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(slugError);
      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'song-no-artist' }] });

      const songId = await findOrCreateSong(mockPayload as Payload, 'No Artist Song');

      expect(songId).toBe('song-no-artist');
      expect(mockPayload.findByID).not.toHaveBeenCalled();
    });

    it('should handle slug conflict when artist has no name', async () => {
      const { findOrCreateSong } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      (mockPayload.findByID as Mock).mockResolvedValueOnce({ id: 10 }); // no name field
      mockGetRecordingMbid.mockResolvedValueOnce(null);
      const slugError = {
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Duplicate slug' }] },
        message: 'Duplicate slug',
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(slugError);
      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'song-nameless-artist' }] });

      const songId = await findOrCreateSong(mockPayload as Payload, 'Nameless Artist Song', 10);

      expect(songId).toBe('song-nameless-artist');
    });

    it('should rethrow non-slug errors in song creation', async () => {
      const { findOrCreateSong } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      (mockPayload.findByID as Mock).mockResolvedValueOnce({ name: 'Some Artist' });
      mockGetRecordingMbid.mockResolvedValueOnce(null);
      const genericError = { status: 500, message: 'Database error' };
      (mockPayload.create as Mock).mockRejectedValueOnce(genericError);

      await expect(
        findOrCreateSong(mockPayload as Payload, 'Error Song', 11),
      ).rejects.toEqual(genericError);
    });

    it('should rethrow slug error when no existing song found by slug', async () => {
      const { findOrCreateSong } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      (mockPayload.findByID as Mock).mockResolvedValueOnce({ name: 'Artist Name' });
      mockGetRecordingMbid.mockResolvedValueOnce(null);
      const slugError = {
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Duplicate slug' }] },
        message: 'Duplicate slug',
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(slugError);
      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });

      await expect(
        findOrCreateSong(mockPayload as Payload, 'Ghost Song', 12),
      ).rejects.toEqual(slugError);
    });

    it('should resolve slug conflict when artist name fetch fails before create', async () => {
      const { findOrCreateSong } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      // pre-create artist fetch throws — artistName stays ''
      (mockPayload.findByID as Mock).mockRejectedValueOnce(new Error('DB timeout'));
      mockGetRecordingMbid.mockResolvedValueOnce(null);
      const slugError = {
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Duplicate slug' }] },
        message: 'Duplicate slug',
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(slugError);
      // retry fetch inside slug handler succeeds
      (mockPayload.findByID as Mock).mockResolvedValueOnce({ name: 'Recovered Artist' });
      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'song-recovered' }] });

      const songId = await findOrCreateSong(mockPayload as Payload, 'Recovered Song', 20);

      expect(songId).toBe('song-recovered');
    });
  });
});
