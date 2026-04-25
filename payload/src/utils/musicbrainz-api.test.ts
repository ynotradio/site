import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDuration,
  getArtistCreditName,
  searchArtists,
  searchReleases,
  searchRecordings,
} from './musicbrainz-api';

describe('MusicBrainz API Utils', () => {
  describe('formatDuration', () => {
    it('formats duration in milliseconds to MM:SS', () => {
      expect(formatDuration(180000)).toBe('3:00');
      expect(formatDuration(65000)).toBe('1:05');
      expect(formatDuration(3661000)).toBe('61:01');
    });

    it('pads seconds with zero when less than 10', () => {
      expect(formatDuration(61000)).toBe('1:01');
      expect(formatDuration(125000)).toBe('2:05');
    });

    it('handles zero duration', () => {
      expect(formatDuration(0)).toBe('0:00');
    });

    it('returns empty string for undefined', () => {
      expect(formatDuration(undefined)).toBe('');
    });

    it('handles durations less than a minute', () => {
      expect(formatDuration(5000)).toBe('0:05');
      expect(formatDuration(45000)).toBe('0:45');
    });

    it('handles very long durations', () => {
      expect(formatDuration(3600000)).toBe('60:00'); // 1 hour
      expect(formatDuration(7200000)).toBe('120:00'); // 2 hours
    });
  });

  describe('API search functions', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      // Mock global fetch
      fetchMock = vi.fn();
      global.fetch = fetchMock;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('searchArtists', () => {
      it('returns empty array for empty query', async () => {
        const result = await searchArtists('');
        expect(result).toEqual([]);
        expect(fetchMock).not.toHaveBeenCalled();
      });

      it('returns empty array for whitespace-only query', async () => {
        const result = await searchArtists('   ');
        expect(result).toEqual([]);
        expect(fetchMock).not.toHaveBeenCalled();
      });

      it('fetches artists from MusicBrainz API', async () => {
        const mockArtists = [
          {
            id: '123',
            name: 'Test Artist',
            type: 'Person',
            score: 100,
          },
        ];

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ artists: mockArtists }),
        });

        const result = await searchArtists('Test Artist');
        expect(result).toEqual(mockArtists);
      });

      it('returns empty array when API response has no artists field', async () => {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

        const result = await searchArtists('Test Artist');
        expect(result).toEqual([]);
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('https://musicbrainz.org/ws/2/artist?query='),
          expect.objectContaining({
            headers: expect.objectContaining({
              'User-Agent': expect.any(String),
            }),
          }),
        );
      });

      it('escapes Lucene special characters in query', async () => {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ artists: [] }),
        });

        await searchArtists('AC/DC & Queen');
        const callUrl = fetchMock.mock.calls[0][0];
        expect(callUrl).toContain('%5C'); // Escaped backslash
      });

      it('returns empty array on API error', async () => {
        fetchMock.mockResolvedValueOnce({
          ok: false,
        });

        const result = await searchArtists('Test Artist');
        expect(result).toEqual([]);
      });

      it('returns empty array on fetch exception', async () => {
        fetchMock.mockRejectedValueOnce(new Error('Network error'));

        const result = await searchArtists('Test Artist');
        expect(result).toEqual([]);
      });

      it('uses custom limit parameter', async () => {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ artists: [] }),
        });

        await searchArtists('Test', 25);
        const callUrl = fetchMock.mock.calls[0][0];
        expect(callUrl).toContain('limit=25');
      });

      it('serializes concurrent requests via busy-wait when first holds the rate-limit lock', async () => {
        vi.useFakeTimers();

        // Prime the rate limiter: call once so lastRequestTime gets set to "now"
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ artists: [] }) });
        const prime = searchArtists('prime');
        await vi.runAllTimersAsync();
        await prime;

        // Advance time by 500ms — less than MIN_REQUEST_INTERVAL (1000ms)
        // so the next waitForRateLimit call will hold the lock while waiting
        vi.advanceTimersByTime(500);

        // Start two concurrent calls.
        // p1: acquires lock, finds 500ms remaining, awaits setTimeout(500ms) → suspends
        // p2: tries to acquire lock, sees requestInProgress=true, enters while-loop (lines 95-96)
        fetchMock
          .mockResolvedValueOnce({ ok: true, json: async () => ({ artists: [{ id: '1' }] }) })
          .mockResolvedValueOnce({ ok: true, json: async () => ({ artists: [{ id: '2' }] }) });
        const p1 = searchArtists('query1');
        const p2 = searchArtists('query2');

        await vi.runAllTimersAsync();
        const [r1, r2] = await Promise.all([p1, p2]);

        expect(r1).toEqual([{ id: '1' }]);
        expect(r2).toEqual([{ id: '2' }]);
        expect(fetchMock).toHaveBeenCalledTimes(3); // prime + 2 concurrent

        vi.useRealTimers();
      });
    });

    describe('searchReleases', () => {
      it('returns empty array for empty title', async () => {
        const result = await searchReleases('');
        expect(result).toEqual([]);
        expect(fetchMock).not.toHaveBeenCalled();
      });

      it('fetches releases from MusicBrainz API', async () => {
        const mockReleases = [
          {
            id: '456',
            title: 'Test Album',
            date: '2024-01-15',
            score: 100,
          },
        ];

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ releases: mockReleases }),
        });

        const result = await searchReleases('Test Album');
        expect(result).toEqual(mockReleases);
      });

      it('returns empty array when API response has no releases field', async () => {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

        const result = await searchReleases('Test Album');
        expect(result).toEqual([]);
      });

      it('includes artist name in query when provided', async () => {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ releases: [] }),
        });

        await searchReleases('Test Album', 'Test Artist');
        const callUrl = fetchMock.mock.calls[0][0];
        expect(callUrl).toContain('artist%3A'); // 'artist:' encoded
      });

      it('escapes Lucene special characters in title and artist', async () => {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ releases: [] }),
        });

        await searchReleases('Album (Deluxe)', 'AC/DC');
        const callUrl = fetchMock.mock.calls[0][0];
        expect(callUrl).toContain('%5C'); // Escaped backslash
      });

      it('sorts artist-matching releases before non-matching when artist name provided', async () => {
        const releases = [
          {
            id: 'no-match',
            title: 'Test Album',
            score: 100,
            'artist-credit': [{ name: 'Other Artist', artist: { id: 'x', name: 'Other Artist' } }],
            'release-group': { 'primary-type': 'Album' },
          },
          {
            id: 'match',
            title: 'Test Album',
            score: 80,
            'artist-credit': [{ name: 'Test Artist', artist: { id: 'y', name: 'Test Artist' } }],
            'release-group': { 'primary-type': 'Album' },
          },
        ];

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ releases }),
        });

        const result = await searchReleases('Test Album', 'Test Artist');
        expect(result[0].id).toBe('match');
        expect(result[1].id).toBe('no-match');
      });

      it('ranks by release type when artist match is equal', async () => {
        const releases = [
          {
            id: 'single',
            title: 'Test',
            score: 100,
            'artist-credit': [{ name: 'Test Artist', artist: { id: 'a', name: 'Test Artist' } }],
            'release-group': { 'primary-type': 'Single' },
          },
          {
            id: 'album',
            title: 'Test',
            score: 90,
            'artist-credit': [{ name: 'Test Artist', artist: { id: 'b', name: 'Test Artist' } }],
            'release-group': { 'primary-type': 'Album' },
          },
        ];

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ releases }),
        });

        const result = await searchReleases('Test', 'Test Artist', 'Album');
        expect(result[0].id).toBe('album');
        expect(result[1].id).toBe('single');
      });

      it('ranks preferred release type first (rank 0) above all other types', async () => {
        const releases = [
          {
            id: 'ep',
            title: 'Test',
            score: 100,
            'artist-credit': [{ name: 'Test Artist', artist: { id: 'a', name: 'Test Artist' } }],
            'release-group': { 'primary-type': 'EP' },
          },
          {
            id: 'preferred',
            title: 'Test',
            score: 80,
            'artist-credit': [{ name: 'Test Artist', artist: { id: 'b', name: 'Test Artist' } }],
            'release-group': { 'primary-type': 'EP' },
          },
        ];

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ releases }),
        });

        // When preferredType is 'EP', both have same type rank, falls through to score
        const result = await searchReleases('Test', 'Test Artist', 'EP');
        expect(result[0].id).toBe('ep'); // higher score
      });

      it('falls through to score comparison when artist match and type rank are equal', async () => {
        const releases = [
          {
            id: 'low-score',
            title: 'Test Album',
            score: 75,
            'artist-credit': [{ name: 'Test Artist', artist: { id: 'a', name: 'Test Artist' } }],
            'release-group': { 'primary-type': 'Album' },
          },
          {
            id: 'high-score',
            title: 'Test Album',
            score: 95,
            'artist-credit': [{ name: 'Test Artist', artist: { id: 'b', name: 'Test Artist' } }],
            'release-group': { 'primary-type': 'Album' },
          },
        ];

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ releases }),
        });

        const result = await searchReleases('Test Album', 'Test Artist', 'Album');
        expect(result[0].id).toBe('high-score');
        expect(result[1].id).toBe('low-score');
      });

      it('handles releases with no artist-credit field when sorting', async () => {
        const releases = [
          {
            id: 'no-credit',
            title: 'Test Album',
            score: 100,
            'release-group': { 'primary-type': 'Album' },
          },
          {
            id: 'with-credit',
            title: 'Test Album',
            score: 90,
            'artist-credit': [{ name: 'Test Artist', artist: { id: 'a', name: 'Test Artist' } }],
            'release-group': { 'primary-type': 'Album' },
          },
        ];

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ releases }),
        });

        const result = await searchReleases('Test Album', 'Test Artist');
        expect(result[0].id).toBe('with-credit'); // artist match comes first
      });

      it('handles releases with no release-group field (undefined type rank)', async () => {
        const releases = [
          {
            id: 'no-group',
            title: 'Test Album',
            score: 100,
            'artist-credit': [{ name: 'Test Artist', artist: { id: 'a', name: 'Test Artist' } }],
          },
          {
            id: 'with-album-type',
            title: 'Test Album',
            score: 80,
            'artist-credit': [{ name: 'Test Artist', artist: { id: 'b', name: 'Test Artist' } }],
            'release-group': { 'primary-type': 'Album' },
          },
        ];

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ releases }),
        });

        // Album (rank 1) comes before undefined type (DEFAULT_TYPE_RANK = 4)
        const result = await searchReleases('Test Album', 'Test Artist', 'Album');
        expect(result[0].id).toBe('with-album-type');
      });

      it('handles releases with unknown release type (falls back to default rank)', async () => {
        const releases = [
          {
            id: 'unknown-type',
            title: 'Test Album',
            score: 100,
            'artist-credit': [{ name: 'Test Artist', artist: { id: 'a', name: 'Test Artist' } }],
            'release-group': { 'primary-type': 'UnknownType' },
          },
          {
            id: 'album-type',
            title: 'Test Album',
            score: 80,
            'artist-credit': [{ name: 'Test Artist', artist: { id: 'b', name: 'Test Artist' } }],
            'release-group': { 'primary-type': 'Album' },
          },
        ];

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ releases }),
        });

        // Album (rank 1) before UnknownType (DEFAULT_TYPE_RANK = 4)
        const result = await searchReleases('Test Album', 'Test Artist', 'Album');
        expect(result[0].id).toBe('album-type');
      });

      it('returns releases unsorted when no artist name provided', async () => {
        const releases = [
          { id: 'first', title: 'Test', score: 50 },
          { id: 'second', title: 'Test', score: 100 },
        ];

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ releases }),
        });

        const result = await searchReleases('Test');
        expect(result[0].id).toBe('first'); // original order preserved
      });

      it('uses 0 as score fallback when score is missing during score comparison', async () => {
        const releases = [
          {
            id: 'no-score',
            title: 'Test Album',
            'artist-credit': [{ name: 'Test Artist', artist: { id: 'a', name: 'Test Artist' } }],
            'release-group': { 'primary-type': 'Album' },
          },
          {
            id: 'has-score',
            title: 'Test Album',
            score: 80,
            'artist-credit': [{ name: 'Test Artist', artist: { id: 'b', name: 'Test Artist' } }],
            'release-group': { 'primary-type': 'Album' },
          },
        ];

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ releases }),
        });

        const result = await searchReleases('Test Album', 'Test Artist', 'Album');
        // 80 (has-score) > 0 (no-score fallback) → has-score first
        expect(result[0].id).toBe('has-score');
        expect(result[1].id).toBe('no-score');
      });

      it('returns empty array on API error', async () => {
        fetchMock.mockResolvedValueOnce({
          ok: false,
        });

        const result = await searchReleases('Test Album');
        expect(result).toEqual([]);
      });

      it('returns empty array on fetch exception', async () => {
        fetchMock.mockRejectedValueOnce(new Error('Network error'));

        const result = await searchReleases('Test Album');
        expect(result).toEqual([]);
      });
    });

    describe('searchRecordings', () => {
      it('returns empty array for empty title', async () => {
        const result = await searchRecordings('');
        expect(result).toEqual([]);
        expect(fetchMock).not.toHaveBeenCalled();
      });

      it('returns empty array when API response has no recordings field', async () => {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

        const result = await searchRecordings('Test Song');
        expect(result).toEqual([]);
      });

      it('fetches recordings from MusicBrainz API', async () => {
        const mockRecordings = [
          {
            id: '789',
            title: 'Test Song',
            length: 180000,
            score: 100,
          },
        ];

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recordings: mockRecordings }),
        });

        const result = await searchRecordings('Test Song');
        expect(result).toEqual(mockRecordings);
      });

      it('includes artist name in query when provided', async () => {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recordings: [] }),
        });

        await searchRecordings('Test Song', 'Test Artist');
        const callUrl = fetchMock.mock.calls[0][0];
        expect(callUrl).toContain('artist%3A'); // 'artist:' encoded
      });

      it('filters out video recordings in query', async () => {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recordings: [] }),
        });

        await searchRecordings('Test Song');
        const callUrl = fetchMock.mock.calls[0][0];
        expect(callUrl).toContain('NOT%20video%3Atrue');
      });

      it('sorts artist-matching recordings first when artist name provided', async () => {
        const recordings = [
          {
            id: 'no-match',
            title: 'Test Song',
            score: 100,
            'artist-credit': [{ name: 'Other Artist', artist: { id: 'x', name: 'Other Artist' } }],
          },
          {
            id: 'match',
            title: 'Test Song',
            score: 80,
            'artist-credit': [{ name: 'Test Artist', artist: { id: 'y', name: 'Test Artist' } }],
          },
        ];

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recordings }),
        });

        const result = await searchRecordings('Test Song', 'Test Artist');
        expect(result[0].id).toBe('match');
        expect(result[1].id).toBe('no-match');
      });

      it('uses score as tiebreaker when artist matches and live status are equal', async () => {
        const recordings = [
          {
            id: 'low-score',
            title: 'Test Song',
            score: 70,
            'artist-credit': [{ name: 'Test Artist', artist: { id: 'a', name: 'Test Artist' } }],
          },
          {
            id: 'high-score',
            title: 'Test Song',
            score: 95,
            'artist-credit': [{ name: 'Test Artist', artist: { id: 'b', name: 'Test Artist' } }],
          },
        ];

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recordings }),
        });

        const result = await searchRecordings('Test Song', 'Test Artist');
        expect(result[0].id).toBe('high-score');
        expect(result[1].id).toBe('low-score');
      });

      it('sorts live recordings to the bottom', async () => {
        const mockRecordings = [
          {
            id: '1',
            title: 'Test Song',
            disambiguation: 'live at Stadium',
            score: 100,
          },
          {
            id: '2',
            title: 'Test Song',
            disambiguation: 'studio version',
            score: 90,
          },
          {
            id: '3',
            title: 'Test Song',
            score: 95,
          },
        ];

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recordings: mockRecordings }),
        });

        const result = await searchRecordings('Test Song');
        // Non-live recordings come first, sorted by score descending
        expect(result[0].id).toBe('3'); // score 95, no disambiguation
        expect(result[1].id).toBe('2'); // score 90, studio version
        expect(result[2].id).toBe('1'); // Live version last (despite highest score)
      });

      it('uses 0 as score fallback when score is missing during score comparison', async () => {
        const recordings = [
          {
            id: 'no-score',
            title: 'Test Song',
            // no score field - should fall back to 0 in (b.score || 0) - (a.score || 0)
          },
          {
            id: 'has-score',
            title: 'Test Song',
            score: 70,
          },
        ];

        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ recordings }),
        });

        const result = await searchRecordings('Test Song');
        // 70 (has-score) > 0 (no-score fallback) → has-score first
        expect(result[0].id).toBe('has-score');
        expect(result[1].id).toBe('no-score');
      });

      it('returns empty array on API error', async () => {
        fetchMock.mockResolvedValueOnce({
          ok: false,
        });

        const result = await searchRecordings('Test Song');
        expect(result).toEqual([]);
      });

      it('returns empty array on fetch exception', async () => {
        fetchMock.mockRejectedValueOnce(new Error('Network error'));

        const result = await searchRecordings('Test Song');
        expect(result).toEqual([]);
      });
    });
  });

  describe('getArtistCreditName', () => {
    it('returns Unknown Artist when credits is undefined', () => {
      expect(getArtistCreditName(undefined)).toBe('Unknown Artist');
    });

    it('returns Unknown Artist when credits is an empty array', () => {
      expect(getArtistCreditName([])).toBe('Unknown Artist');
    });

    it('returns the single artist name for a one-element array', () => {
      expect(getArtistCreditName([{ name: 'Radiohead' }])).toBe('Radiohead');
    });

    it('joins multiple artist names with a comma and space', () => {
      expect(
        getArtistCreditName([{ name: 'Tom Petty' }, { name: 'The Heartbreakers' }]),
      ).toBe('Tom Petty, The Heartbreakers');
    });

    it('joins three or more artist names', () => {
      expect(
        getArtistCreditName([{ name: 'A' }, { name: 'B' }, { name: 'C' }]),
      ).toBe('A, B, C');
    });
  });
});
