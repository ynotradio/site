import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDuration,
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

      it('returns empty array on API error', async () => {
        fetchMock.mockResolvedValueOnce({
          ok: false,
        });

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
        expect(result[0].id).toBe('2'); // Studio version first
        expect(result[1].id).toBe('3'); // No disambiguation second
        expect(result[2].id).toBe('1'); // Live version last
      });

      it('returns empty array on API error', async () => {
        fetchMock.mockResolvedValueOnce({
          ok: false,
        });

        const result = await searchRecordings('Test Song');
        expect(result).toEqual([]);
      });
    });
  });
});
