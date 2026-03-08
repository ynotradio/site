import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchReleases, searchRecordings } from './musicbrainz-api';

describe('MusicBrainz result re-ranking', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchReleases artist and type weighting', () => {
    it('ranks artist matches above non-matches', async () => {
      const mockReleases = [
        {
          id: '1',
          title: 'Tenterhooks',
          score: 100,
          'artist-credit': [{ name: 'Jez Lowe', artist: { id: 'a1', name: 'Jez Lowe' } }],
          'release-group': { 'primary-type': 'Album' },
        },
        {
          id: '2',
          title: 'Tenterhooks',
          score: 100,
          'artist-credit': [{ name: 'LOST TALK', artist: { id: 'a2', name: 'LOST TALK' } }],
          'release-group': { 'primary-type': 'Album' },
        },
        {
          id: '3',
          title: 'Tenterhooks',
          score: 100,
          'artist-credit': [{ name: 'Silversun Pickups', artist: { id: 'a3', name: 'Silversun Pickups' } }],
          'release-group': { 'primary-type': 'Album' },
        },
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ releases: mockReleases }),
      });

      const result = await searchReleases('Tenterhooks', 'Silversun Pickups');
      expect(result[0].id).toBe('3'); // Silversun Pickups first
    });

    it('ranks Album type above other types within same artist', async () => {
      const mockReleases = [
        {
          id: '1',
          title: 'Tenterhooks',
          score: 100,
          'artist-credit': [{ name: 'Silversun Pickups', artist: { id: 'a1', name: 'Silversun Pickups' } }],
          'release-group': { 'primary-type': 'Single' },
        },
        {
          id: '2',
          title: 'Tenterhooks',
          score: 100,
          'artist-credit': [{ name: 'Silversun Pickups', artist: { id: 'a1', name: 'Silversun Pickups' } }],
          'release-group': { 'primary-type': 'Album' },
        },
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ releases: mockReleases }),
      });

      const result = await searchReleases('Tenterhooks', 'Silversun Pickups');
      expect(result[0].id).toBe('2'); // Album type first
      expect(result[1].id).toBe('1'); // Single second
    });

    it('artist match takes priority over type match', async () => {
      const mockReleases = [
        {
          id: '1',
          title: 'Tenterhooks',
          score: 100,
          'artist-credit': [{ name: 'Other Artist', artist: { id: 'a1', name: 'Other Artist' } }],
          'release-group': { 'primary-type': 'Album' },
        },
        {
          id: '2',
          title: 'Tenterhooks',
          score: 95,
          'artist-credit': [{ name: 'Silversun Pickups', artist: { id: 'a2', name: 'Silversun Pickups' } }],
          'release-group': { 'primary-type': 'Single' },
        },
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ releases: mockReleases }),
      });

      const result = await searchReleases('Tenterhooks', 'Silversun Pickups');
      expect(result[0].id).toBe('2'); // Correct artist (Single) beats wrong artist (Album)
      expect(result[1].id).toBe('1');
    });

    it('performs case-insensitive artist matching', async () => {
      const mockReleases = [
        {
          id: '1',
          title: 'Test Album',
          score: 100,
          'artist-credit': [{ name: 'Other', artist: { id: 'a1', name: 'Other' } }],
        },
        {
          id: '2',
          title: 'Test Album',
          score: 90,
          'artist-credit': [{ name: 'silversun pickups', artist: { id: 'a2', name: 'silversun pickups' } }],
        },
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ releases: mockReleases }),
      });

      const result = await searchReleases('Test Album', 'Silversun Pickups');
      expect(result[0].id).toBe('2'); // Case-insensitive match
    });

    it('does not re-rank when no artist name is provided', async () => {
      const mockReleases = [
        { id: '1', title: 'Album A', score: 100 },
        { id: '2', title: 'Album B', score: 95 },
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ releases: mockReleases }),
      });

      const result = await searchReleases('Album');
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });
  });

  describe('searchRecordings artist weighting', () => {
    it('ranks artist matches above non-matches', async () => {
      const mockRecordings = [
        {
          id: '1',
          title: 'Tenterhooks',
          score: 100,
          'artist-credit': [{ name: 'Other Artist', artist: { id: 'a1', name: 'Other Artist' } }],
        },
        {
          id: '2',
          title: 'Tenterhooks',
          score: 100,
          'artist-credit': [{ name: 'LOST TALK', artist: { id: 'a2', name: 'LOST TALK' } }],
        },
        {
          id: '3',
          title: 'Tenterhooks',
          score: 90,
          'artist-credit': [{ name: 'Silversun Pickups', artist: { id: 'a3', name: 'Silversun Pickups' } }],
        },
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ recordings: mockRecordings }),
      });

      const result = await searchRecordings('Tenterhooks', 'Silversun Pickups');
      expect(result[0].id).toBe('3'); // Silversun Pickups first despite lower score
    });

    it('artist match takes priority over live deprioritization', async () => {
      const mockRecordings = [
        {
          id: '1',
          title: 'Test Song',
          score: 100,
          disambiguation: 'studio version',
          'artist-credit': [{ name: 'Other Artist', artist: { id: 'a1', name: 'Other Artist' } }],
        },
        {
          id: '2',
          title: 'Test Song',
          score: 90,
          disambiguation: 'live',
          'artist-credit': [{ name: 'Correct Artist', artist: { id: 'a2', name: 'Correct Artist' } }],
        },
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ recordings: mockRecordings }),
      });

      const result = await searchRecordings('Test Song', 'Correct Artist');
      expect(result[0].id).toBe('2'); // Correct artist (even if live) comes first
      expect(result[1].id).toBe('1');
    });

    it('performs case-insensitive artist matching', async () => {
      const mockRecordings = [
        {
          id: '1',
          title: 'Test Song',
          score: 100,
          'artist-credit': [{ name: 'Wrong Artist', artist: { id: 'a1', name: 'Wrong Artist' } }],
        },
        {
          id: '2',
          title: 'Test Song',
          score: 90,
          'artist-credit': [{ name: 'queen', artist: { id: 'a2', name: 'queen' } }],
        },
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ recordings: mockRecordings }),
      });

      const result = await searchRecordings('Test Song', 'Queen');
      expect(result[0].id).toBe('2'); // Case-insensitive match
    });

    it('does not re-rank by artist when no artist name is provided', async () => {
      const mockRecordings = [
        {
          id: '1',
          title: 'Test Song',
          score: 100,
          'artist-credit': [{ name: 'Artist B', artist: { id: 'a1', name: 'Artist B' } }],
        },
        {
          id: '2',
          title: 'Test Song',
          score: 95,
          'artist-credit': [{ name: 'Artist A', artist: { id: 'a2', name: 'Artist A' } }],
        },
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ recordings: mockRecordings }),
      });

      const result = await searchRecordings('Test Song');
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });
  });
});
