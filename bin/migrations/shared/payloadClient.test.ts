/**
 * Unit tests for Payload client utilities
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { Payload } from 'payload';

// Mock the payload module
vi.mock('payload', () => ({
  getPayload: vi.fn(),
}));

// Mock payload.config (needed for getPayloadClient dynamic import)
vi.mock('../../../payload.config', () => ({
  default: {},
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
    vi.unstubAllEnvs();
    const musicbrainz = await import('./musicbrainz');
    mockGetArtistMbid = musicbrainz.getArtistMbid as Mock;

    mockPayload = {
      find: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
  });

  describe('getPayloadClient', () => {
    it('should throw when prod NEON database URL is missing', async () => {
      const { getPayloadClient } = await import('./payloadClient');
      vi.stubEnv('NEON_PROD_DATABASE_URL', '');

      await expect(getPayloadClient('prod-neon')).rejects.toThrow(
        'Database URI not found for target "prod-neon"',
      );
    });

    it('should throw when local-postgres database URLs are all missing', async () => {
      const { getPayloadClient } = await import('./payloadClient');
      vi.stubEnv('NEON_DEV_DATABASE_URL', '');
      vi.stubEnv('DATABASE_URI', '');

      await expect(getPayloadClient('local-postgres')).rejects.toThrow(
        'Database URI not found for target "local-postgres"',
      );
    });

    it('should connect with NEON_PROD_DATABASE_URL for prod-neon target', async () => {
      const { getPayloadClient } = await import('./payloadClient');
      const { getPayload } = await import('payload');
      vi.stubEnv('NEON_PROD_DATABASE_URL', 'postgresql://prod-test');
      (getPayload as Mock).mockResolvedValueOnce(mockPayload);

      const result = await getPayloadClient('prod-neon');

      expect(result).toBe(mockPayload);
      expect(process.env.DATABASE_URI).toBe('postgresql://prod-test');
    });

    it('should connect with NEON_DEV_DATABASE_URL for local-postgres target', async () => {
      const { getPayloadClient } = await import('./payloadClient');
      const { getPayload } = await import('payload');
      vi.stubEnv('NEON_DEV_DATABASE_URL', 'postgresql://dev-test');
      (getPayload as Mock).mockResolvedValueOnce(mockPayload);

      const result = await getPayloadClient('local-postgres');

      expect(result).toBe(mockPayload);
    });

    it('should fall back to DATABASE_URI when NEON_DEV_DATABASE_URL is missing', async () => {
      const { getPayloadClient } = await import('./payloadClient');
      const { getPayload } = await import('payload');
      vi.stubEnv('NEON_DEV_DATABASE_URL', '');
      vi.stubEnv('DATABASE_URI', 'postgresql://fallback-test');
      (getPayload as Mock).mockResolvedValueOnce(mockPayload);

      const result = await getPayloadClient('local-postgres');

      expect(result).toBe(mockPayload);
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

    it('should return existing artist ID without updating when MusicBrainz ID already set', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({
        docs: [{ id: 'existing-with-mbid', musicbrainzId: 'existing-mbid-value' }],
      });

      const artistId = await findOrCreateArtist(mockPayload as Payload, 'Test Artist');

      expect(artistId).toBe('existing-with-mbid');
      expect(mockPayload.update).not.toHaveBeenCalled();
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

      await expect(
        findOrCreateArtist(mockPayload as Payload, 'Test Artist'),
      ).rejects.toEqual(otherError);
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

      await expect(
        findOrCreateArtist(mockPayload as Payload, 'Test Artist'),
      ).rejects.toEqual(slugError);
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

    it('should handle name conflict (race condition) by finding existing artist', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] }) // Initial find by name — not found
        .mockResolvedValueOnce({ docs: [{ id: 'race-artist-99' }] }); // Retry find — found
      mockGetArtistMbid.mockResolvedValueOnce(null);

      const nameError = {
        status: 400,
        data: { errors: [{ path: 'name', message: 'Value must be unique' }] },
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(nameError);

      const artistId = await findOrCreateArtist(mockPayload as Payload, 'Test Artist');

      expect(artistId).toBe('race-artist-99');
    });

    it('should rethrow name-conflict error when retry find also returns empty', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] }); // All finds return empty
      mockGetArtistMbid.mockResolvedValueOnce(null);

      const nameError = {
        status: 400,
        data: { errors: [{ path: 'name', message: 'Value must be unique' }] },
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(nameError);

      await expect(
        findOrCreateArtist(mockPayload as Payload, 'Test Artist'),
      ).rejects.toEqual(nameError);
    });

    it('should find artist by slug after MBID retry also hits slug conflict', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] }) // Initial find by name
        .mockResolvedValueOnce({ docs: [{ id: 'slug-artist-77' }] }); // Slug find after MBID retry
      mockGetArtistMbid.mockResolvedValueOnce('duplicate-mbid');

      const mbidError = {
        status: 400,
        data: { errors: [{ path: 'musicbrainzId', message: 'Value must be unique' }] },
      };
      const slugError = {
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Must be unique' }] },
      };
      (mockPayload.create as Mock)
        .mockRejectedValueOnce(mbidError) // First create fails with MBID conflict
        .mockRejectedValueOnce(slugError); // Retry create fails with slug conflict

      const artistId = await findOrCreateArtist(mockPayload as Payload, 'Test Artist');

      expect(artistId).toBe('slug-artist-77');
    });

    it('should rethrow when MBID retry slug conflict finds no existing artist', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] }); // All finds return empty
      mockGetArtistMbid.mockResolvedValueOnce('duplicate-mbid');

      const mbidError = {
        status: 400,
        data: { errors: [{ path: 'musicbrainzId', message: 'Value must be unique' }] },
      };
      const slugError = {
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Must be unique' }] },
      };
      (mockPayload.create as Mock)
        .mockRejectedValueOnce(mbidError)
        .mockRejectedValueOnce(slugError);

      await expect(
        findOrCreateArtist(mockPayload as Payload, 'Test Artist'),
      ).rejects.toEqual(slugError);
    });

    it('should rethrow MBID retry non-slug error', async () => {
      const { findOrCreateArtist } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      mockGetArtistMbid.mockResolvedValueOnce('duplicate-mbid');

      const mbidError = {
        status: 400,
        data: { errors: [{ path: 'musicbrainzId', message: 'Value must be unique' }] },
      };
      const dbError = { status: 500, message: 'Database error' };
      (mockPayload.create as Mock)
        .mockRejectedValueOnce(mbidError)
        .mockRejectedValueOnce(dbError);

      await expect(
        findOrCreateArtist(mockPayload as Payload, 'Test Artist'),
      ).rejects.toEqual(dbError);
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

      await expect(
        findOrCreateSong(mockPayload as Payload, ''),
      ).rejects.toThrow('Song title is required');
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

  describe('findOrCreateVenue (error paths)', () => {
    it('should handle slug validation error by finding existing venue by slug', async () => {
      const { findOrCreateVenue } = await import('./payloadClient');

      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] }) // name lookup — not found
        .mockResolvedValueOnce({ docs: [{ id: 'venue-by-slug-123' }] }); // slug lookup — found
      (mockPayload.create as Mock).mockRejectedValueOnce({
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Must be unique' }] },
      });

      const venueId = await findOrCreateVenue(mockPayload as Payload, 'The Paradise Rock Club');

      expect(venueId).toBe('venue-by-slug-123');
    });

    it('should rethrow non-slug errors from create venue', async () => {
      const { findOrCreateVenue } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      const networkError = new Error('Network failure');
      (mockPayload.create as Mock).mockRejectedValueOnce(networkError);

      await expect(
        findOrCreateVenue(mockPayload as Payload, 'Venue Name'),
      ).rejects.toThrow('Network failure');
    });

    it('should rethrow slug error when no existing venue found by slug', async () => {
      const { findOrCreateVenue } = await import('./payloadClient');

      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] }) // name lookup — not found
        .mockResolvedValueOnce({ docs: [] }); // slug lookup — also not found
      const slugError = {
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Must be unique' }] },
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(slugError);

      await expect(
        findOrCreateVenue(mockPayload as Payload, 'Test Venue'),
      ).rejects.toEqual(slugError);
    });
  });

  describe('findOrCreatePerson', () => {
    it('should return existing person ID when found by legacy ID', async () => {
      const { findOrCreatePerson } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'person-legacy-42' }] });

      const personId = await findOrCreatePerson(mockPayload as Payload, 'Jane Doe', 42);

      expect(personId).toBe('person-legacy-42');
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'people',
        where: { legacyId: { equals: 42 } },
        limit: 1,
      });
    });

    it('should fall through to name lookup when legacy ID not found', async () => {
      const { findOrCreatePerson } = await import('./payloadClient');

      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] }) // legacyId lookup — not found
        .mockResolvedValueOnce({ docs: [{ id: 'person-by-name-99' }] }); // name lookup — found

      const personId = await findOrCreatePerson(mockPayload as Payload, 'Jane Doe', 42);

      expect(personId).toBe('person-by-name-99');
    });

    it('should return existing person ID when found by name (no legacy ID)', async () => {
      const { findOrCreatePerson } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'person-name-77' }] });

      const personId = await findOrCreatePerson(mockPayload as Payload, 'Jane Doe');

      expect(personId).toBe('person-name-77');
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'people',
        where: { name: { equals: 'Jane Doe' } },
        limit: 1,
      });
    });

    it('should create new person when not found', async () => {
      const { findOrCreatePerson } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'new-person-55' });

      const personId = await findOrCreatePerson(mockPayload as Payload, 'New Person', 55);

      expect(personId).toBe('new-person-55');
      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'people',
          data: expect.objectContaining({
            name: 'New Person',
            slug: 'new-person',
            legacyId: 55,
          }),
        }),
      );
    });

    it('should handle slug validation error by finding existing person by slug', async () => {
      const { findOrCreatePerson } = await import('./payloadClient');

      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] }) // name lookup — not found
        .mockResolvedValueOnce({ docs: [{ id: 'person-by-slug-88' }] }); // slug lookup — found
      (mockPayload.create as Mock).mockRejectedValueOnce({
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Must be unique' }] },
      });

      const personId = await findOrCreatePerson(mockPayload as Payload, 'New Person');

      expect(personId).toBe('person-by-slug-88');
    });

    it('should rethrow non-slug errors from create person', async () => {
      const { findOrCreatePerson } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockRejectedValueOnce({ status: 500, message: 'DB error' });

      await expect(
        findOrCreatePerson(mockPayload as Payload, 'Fail Person'),
      ).rejects.toMatchObject({ status: 500 });
    });

    it('should rethrow slug error when no existing person found by slug', async () => {
      const { findOrCreatePerson } = await import('./payloadClient');

      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] }) // name lookup — not found
        .mockResolvedValueOnce({ docs: [] }); // slug lookup — also not found
      const slugError = {
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Must be unique' }] },
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(slugError);

      await expect(
        findOrCreatePerson(mockPayload as Payload, 'Test Person'),
      ).rejects.toEqual(slugError);
    });
  });

  describe('findDJByLegacyId', () => {
    it('should return DJ ID when found by legacy ID', async () => {
      const { findDJByLegacyId } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'dj-legacy-7' }] });

      const djId = await findDJByLegacyId(mockPayload as Payload, 7);

      expect(djId).toBe('dj-legacy-7');
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'djs',
        where: { legacyId: { equals: 7 } },
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

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [{ id: 'record-legacy-10' }] });

      const recordId = await findOrCreateRecord(mockPayload as Payload, 'Album Title', 1, 10);

      expect(recordId).toBe('record-legacy-10');
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'records',
        where: { legacyId: { equals: 10 } },
        limit: 1,
      });
    });

    it('should return existing record ID when found by title and artist', async () => {
      const { findOrCreateRecord } = await import('./payloadClient');

      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] }) // legacyId lookup — not found
        .mockResolvedValueOnce({ docs: [{ id: 'record-match-20' }] }); // title+artist found

      const recordId = await findOrCreateRecord(mockPayload as Payload, 'My Album', 5, 10);

      expect(recordId).toBe('record-match-20');
    });

    it('should create new record when not found', async () => {
      const { findOrCreateRecord } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'new-record-30' });

      const recordId = await findOrCreateRecord(mockPayload as Payload, 'Fresh Album', 3);

      expect(recordId).toBe('new-record-30');
      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'records',
          data: expect.objectContaining({
            title: 'Fresh Album',
            slug: 'fresh-album',
            artist: 3,
          }),
        }),
      );
    });

    it('should handle slug validation error by finding existing record by slug', async () => {
      const { findOrCreateRecord } = await import('./payloadClient');

      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] }) // title+artist lookup — not found
        .mockResolvedValueOnce({ docs: [{ id: 'record-by-slug-40' }] }); // slug lookup — found
      (mockPayload.create as Mock).mockRejectedValueOnce({
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Must be unique' }] },
      });

      const recordId = await findOrCreateRecord(mockPayload as Payload, 'Duplicate Album', 3);

      expect(recordId).toBe('record-by-slug-40');
    });

    it('should rethrow non-slug errors from create record', async () => {
      const { findOrCreateRecord } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockRejectedValueOnce({ status: 500, message: 'DB error' });

      await expect(
        findOrCreateRecord(mockPayload as Payload, 'Bad Album', 3),
      ).rejects.toMatchObject({ status: 500 });
    });

    it('should rethrow slug error when no existing record found by slug', async () => {
      const { findOrCreateRecord } = await import('./payloadClient');

      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] }) // legacyId lookup — not found
        .mockResolvedValueOnce({ docs: [] }) // title+artist lookup — not found
        .mockResolvedValueOnce({ docs: [] }); // slug lookup — also not found
      const slugError = {
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Must be unique' }] },
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(slugError);

      await expect(
        findOrCreateRecord(mockPayload as Payload, 'Test Album', 3, 10),
      ).rejects.toEqual(slugError);
    });
  });

  describe('findOrCreateSong (slug error path)', () => {
    it('should handle slug validation error by finding existing song by slug', async () => {
      const { findOrCreateSong } = await import('./payloadClient');

      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] }) // title lookup — not found
        .mockResolvedValueOnce({ docs: [{ id: 'song-by-slug-50' }] }); // slug lookup — found
      (mockPayload.create as Mock).mockRejectedValueOnce({
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Must be unique' }] },
      });

      const songId = await findOrCreateSong(mockPayload as Payload, 'Duplicate Song');

      expect(songId).toBe('song-by-slug-50');
    });

    it('should rethrow non-slug errors from create song', async () => {
      const { findOrCreateSong } = await import('./payloadClient');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockRejectedValueOnce({ status: 500, message: 'DB error' });

      await expect(
        findOrCreateSong(mockPayload as Payload, 'Failing Song'),
      ).rejects.toMatchObject({ status: 500 });
    });

    it('should rethrow slug error when no existing song found by slug', async () => {
      const { findOrCreateSong } = await import('./payloadClient');

      (mockPayload.find as Mock)
        .mockResolvedValueOnce({ docs: [] }) // title lookup — not found
        .mockResolvedValueOnce({ docs: [] }); // slug lookup — also not found
      const slugError = {
        status: 400,
        data: { errors: [{ path: 'slug', message: 'Must be unique' }] },
      };
      (mockPayload.create as Mock).mockRejectedValueOnce(slugError);

      await expect(
        findOrCreateSong(mockPayload as Payload, 'Unique Song'),
      ).rejects.toEqual(slugError);
    });
  });
});
