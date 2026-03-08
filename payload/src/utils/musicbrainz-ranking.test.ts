import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchReleases, searchRecordings } from './musicbrainz-api';

// Helper to create a mock release with common defaults
const release = (
  id: string,
  artist: string,
  type?: string,
  score = 100,
) => ({
  id,
  title: 'Test',
  score,
  'artist-credit': [{ name: artist, artist: { id: `a-${id}`, name: artist } }],
  ...(type ? { 'release-group': { 'primary-type': type } } : {}),
});

// Helper to create a mock recording with common defaults
const recording = (
  id: string,
  artist: string,
  score = 100,
  disambiguation?: string,
) => ({
  id,
  title: 'Test',
  score,
  'artist-credit': [{ name: artist, artist: { id: `a-${id}`, name: artist } }],
  ...(disambiguation ? { disambiguation } : {}),
});

const mockFetchResp = (data: object) => ({ ok: true, json: async () => data });

describe('MusicBrainz result re-ranking', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => { vi.restoreAllMocks(); });

  describe('searchReleases artist and type weighting', () => {
    it('ranks artist matches above non-matches', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResp({
        releases: [
          release('1', 'Jez Lowe', 'Album'),
          release('2', 'LOST TALK', 'Album'),
          release('3', 'Silversun Pickups', 'Album'),
        ],
      }));
      const result = await searchReleases('Tenterhooks', 'Silversun Pickups');
      expect(result[0].id).toBe('3');
    });

    it('defaults to preferring Album type within same artist', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResp({
        releases: [
          release('1', 'Silversun Pickups', 'Single'),
          release('2', 'Silversun Pickups', 'Album'),
        ],
      }));
      const result = await searchReleases('Tenterhooks', 'Silversun Pickups');
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('1');
    });

    it('prefers Single type when preferredType is Single', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResp({
        releases: [
          release('1', 'Radiohead', 'Album'),
          release('2', 'Radiohead', 'Single'),
        ],
      }));
      const result = await searchReleases('Creep', 'Radiohead', 'Single');
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('1');
    });

    it('ranks types in order: preferred > Album > EP > Single > Compilation', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResp({
        releases: [
          release('1', 'Artist', 'Compilation'),
          release('2', 'Artist', 'Single'),
          release('3', 'Artist', 'EP'),
          release('4', 'Artist', 'Album'),
        ],
      }));
      const result = await searchReleases('Test', 'Artist');
      expect(result.map((r) => r.id)).toEqual(['4', '3', '2', '1']);
    });

    it('artist match takes priority over type match', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResp({
        releases: [
          release('1', 'Other Artist', 'Album'),
          release('2', 'Silversun Pickups', 'Single', 95),
        ],
      }));
      const result = await searchReleases('Tenterhooks', 'Silversun Pickups');
      expect(result[0].id).toBe('2');
    });

    it('performs case-insensitive artist matching', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResp({
        releases: [
          release('1', 'Other', undefined, 100),
          release('2', 'silversun pickups', undefined, 90),
        ],
      }));
      const result = await searchReleases('Test Album', 'Silversun Pickups');
      expect(result[0].id).toBe('2');
    });

    it('does not re-rank when no artist name is provided', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResp({
        releases: [
          { id: '1', title: 'A', score: 100 },
          { id: '2', title: 'B', score: 95 },
        ],
      }));
      const result = await searchReleases('Album');
      expect(result[0].id).toBe('1');
    });

    it('handles releases with no artist-credit gracefully', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResp({
        releases: [
          { id: '1', title: 'Test', score: 100 },
          release('2', 'Target Artist', undefined, 90),
        ],
      }));
      const result = await searchReleases('Test', 'Target Artist');
      expect(result[0].id).toBe('2');
    });
  });

  describe('searchRecordings artist weighting', () => {
    it('ranks artist matches above non-matches', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResp({
        recordings: [
          recording('1', 'Other Artist'),
          recording('2', 'LOST TALK'),
          recording('3', 'Silversun Pickups', 90),
        ],
      }));
      const result = await searchRecordings('Tenterhooks', 'Silversun Pickups');
      expect(result[0].id).toBe('3');
    });

    it('artist match takes priority over live deprioritization', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResp({
        recordings: [
          recording('1', 'Other Artist', 100, 'studio version'),
          recording('2', 'Correct Artist', 90, 'live'),
        ],
      }));
      const result = await searchRecordings('Test Song', 'Correct Artist');
      expect(result[0].id).toBe('2');
    });

    it('performs case-insensitive artist matching', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResp({
        recordings: [
          recording('1', 'Wrong Artist'),
          recording('2', 'queen', 90),
        ],
      }));
      const result = await searchRecordings('Test Song', 'Queen');
      expect(result[0].id).toBe('2');
    });

    it('does not re-rank by artist when no artist name is provided', async () => {
      fetchMock.mockResolvedValueOnce(mockFetchResp({
        recordings: [
          recording('1', 'Artist B'),
          recording('2', 'Artist A', 95),
        ],
      }));
      const result = await searchRecordings('Test Song');
      expect(result[0].id).toBe('1');
    });
  });
});
