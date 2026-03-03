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
  config: vi.fn(),
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
      (mockPayload.create as Mock).mockResolvedValue({ id: 'new-song-789' });

      const songId = await findOrCreateSong(mockPayload as Payload, 'New Song', 42);

      expect(songId).toBe('new-song-789');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'songs',
        data: {
          title: 'New Song',
          slug: 'new-song',
          artist: 42,
        },
      });
    });

    it('should create song without artist if artistId not provided', async () => {
      const { findOrCreateSong } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'new-song-999' });

      const songId = await findOrCreateSong(mockPayload as Payload, 'Orphan Song');

      expect(songId).toBe('new-song-999');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'songs',
        data: {
          title: 'Orphan Song',
          slug: 'orphan-song',
        },
      });
    });

    it('should throw error for empty title', async () => {
      const { findOrCreateSong } = await import('./payloadClient');

      await expect(findOrCreateSong(mockPayload as Payload, '')).rejects.toThrow(
        'Song title is required',
      );
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
});
