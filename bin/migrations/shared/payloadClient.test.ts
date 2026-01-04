/**
 * Unit tests for Payload client utilities
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
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
}));

// Mock musicbrainz
vi.mock('./musicbrainz', () => ({
  getArtistMbid: vi.fn(),
}));

describe('payloadClient', () => {
  let mockPayload: Partial<Payload>;
  let mockGetArtistMbid: Mock;

  beforeEach(async () => {
    vi.clearAllMocks();
    const musicbrainz = await import('./musicbrainz');
    mockGetArtistMbid = musicbrainz.getArtistMbid as Mock;

    mockPayload = {
      find: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
  });

  describe('findOrCreateArtist', () => {
    it('should return existing artist ID when found by legacy ID', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({
        docs: [{ id: 'existing-artist-123' }],
      });

      const artistId = await findOrCreateArtist(mockPayload as Payload, 'Test Artist', 42);

      expect(artistId).toBe('existing-artist-123');
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'artists',
        where: {
          legacyId: {
            equals: 42,
          },
        },
        limit: 1,
      });
    });

    it('should return existing artist ID when found by name', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      // Mock to return existing artist when searched by name
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
      (mockPayload.create as Mock).mockResolvedValue({ id: 'new-artist-789' });

      const artistId = await findOrCreateArtist(mockPayload as Payload, 'New Artist', 99);

      expect(artistId).toBe('new-artist-789');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'artists',
        data: expect.objectContaining({
          name: 'New Artist',
          legacyId: 99,
          migratedAt: expect.any(String),
        }),
      });
    });

    it('should search by name only when legacy ID not provided', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'artist-123' }] });

      const artistId = await findOrCreateArtist(mockPayload as Payload, 'Test Artist');

      expect(artistId).toBe('artist-123');
      expect(mockPayload.find).toHaveBeenCalledTimes(1);
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

    it('should add MusicBrainz ID to existing artist without one (legacy ID path)', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({
        docs: [{ id: 'existing-123', musicbrainzId: null }],
      });
      mockGetArtistMbid.mockResolvedValueOnce('mbid-456');

      const artistId = await findOrCreateArtist(mockPayload as Payload, 'Test Artist', 42);

      expect(artistId).toBe('existing-123');
      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'artists',
        id: 'existing-123',
        data: {
          musicbrainzId: 'mbid-456',
        },
      });
    });

    it('should add MusicBrainz ID to existing artist without one (name path)', async () => {
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

      const artistId = await findOrCreateArtist(mockPayload as Payload, 'Test Artist', 42);

      expect(artistId).toBe('existing-123');
    });

    it('should create artist with MusicBrainz ID when not found (no legacy ID)', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      mockGetArtistMbid.mockResolvedValueOnce('mbid-new');
      (mockPayload.create as Mock).mockResolvedValueOnce({ id: 'new-artist-999' });

      const artistId = await findOrCreateArtist(mockPayload as Payload, 'New Artist');

      expect(artistId).toBe('new-artist-999');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'artists',
        data: expect.objectContaining({
          name: 'New Artist',
          slug: 'new-artist',
          musicbrainzId: 'mbid-new',
          migratedAt: expect.any(String),
        }),
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
        data: expect.objectContaining({
          name: 'New Artist',
          musicbrainzId: undefined,
        }),
      });
    });

    it('should skip MusicBrainz lookup when creating with legacy ID', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValueOnce({ id: 'new-artist-777' });

      const artistId = await findOrCreateArtist(mockPayload as Payload, 'New Artist', 99);

      expect(artistId).toBe('new-artist-777');
      expect(mockGetArtistMbid).not.toHaveBeenCalled();
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'artists',
        data: expect.objectContaining({
          name: 'New Artist',
          legacyId: 99,
          musicbrainzId: undefined,
        }),
      });
    });

    it('should handle slug validation error by finding existing artist', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] }) // Find by legacy ID returns empty
        .mockResolvedValueOnce({ docs: [] }) // Find by name returns empty
        .mockResolvedValueOnce({ docs: [{ id: 'existing-by-slug-123' }] }); // Then find by slug succeeds

      const slugError = {
        status: 400,
        data: {
          errors: [{ path: 'slug', message: 'Slug must be unique' }],
        },
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(slugError);

      const artistId = await findOrCreateArtist(mockPayload as Payload, 'Test Artist', 99);

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

      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] }) // Find by legacy ID
        .mockResolvedValueOnce({ docs: [] }); // Find by name

      const otherError = {
        status: 500,
        data: { errors: [{ path: 'name', message: 'Database error' }] },
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(otherError);

      await expect(
        findOrCreateArtist(mockPayload as Payload, 'Test Artist', 99),
      ).rejects.toEqual(otherError);
    });

    it('should rethrow error if slug validation fails and no existing artist found', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] }) // Find by legacy ID
        .mockResolvedValueOnce({ docs: [] }) // Find by name
        .mockResolvedValueOnce({ docs: [] }); // Find by slug also returns empty

      const slugError = {
        status: 400,
        data: {
          errors: [{ path: 'slug', message: 'Slug must be unique' }],
        },
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(slugError);

      await expect(
        findOrCreateArtist(mockPayload as Payload, 'Test Artist', 99),
      ).rejects.toEqual(slugError);
    });
  });

  describe('findOrCreateVenue', () => {
    it('should return existing venue ID when found by legacy ID', async () => {
      const { findOrCreateVenue } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({
        docs: [{ id: 'existing-venue-123' }],
      });

      const venueId = await findOrCreateVenue(mockPayload as Payload, 'Test Venue', 42);

      expect(venueId).toBe('existing-venue-123');
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'venues',
        where: {
          legacyId: {
            equals: 42,
          },
        },
        limit: 1,
      });
    });

    it('should return existing venue ID when found by name', async () => {
      const { findOrCreateVenue } = await import('./payloadClient');

      // Mock to return existing venue when searched by name
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

      const venueId = await findOrCreateVenue(mockPayload as Payload, 'New Venue', 99);

      expect(venueId).toBe('new-venue-789');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'venues',
        data: expect.objectContaining({
          name: 'New Venue',
          legacyId: 99,
          migratedAt: expect.any(String),
        }),
      });
    });
  });
});
