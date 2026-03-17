import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getMbEntityType,
  getArtistMbid,
  getReleaseMbid,
  getRecordingMbid,
} from './migrations/shared/musicbrainz';
import {
  parseMbArgs,
  checkEntityType,
  checkBestMatch,
} from './integrity-check-musicbrainz-utils';

// Mock the musicbrainz module
vi.mock('./migrations/shared/musicbrainz', () => ({
  getMbEntityType: vi.fn(),
  getArtistMbid: vi.fn(),
  getReleaseMbid: vi.fn(),
  getRecordingMbid: vi.fn(),
}));

const mockedGetMbEntityType = vi.mocked(getMbEntityType);
const mockedGetArtistMbid = vi.mocked(getArtistMbid);
const mockedGetReleaseMbid = vi.mocked(getReleaseMbid);
const mockedGetRecordingMbid = vi.mocked(getRecordingMbid);

describe('integrity-check-musicbrainz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // CLI parsing
  // -----------------------------------------------------------------------

  describe('parseMbArgs', () => {
    it('should return defaults with no arguments', () => {
      const result = parseMbArgs(['node', 'script']);
      expect(result.skipTypeCheck).toBe(false);
      expect(result.typeCheckOnly).toBe(false);
      expect(result.fix).toBe(false);
      expect(result.verbose).toBe(false);
      expect(result.limit).toBe(0);
    });

    it('should parse --skip-type-check', () => {
      const result = parseMbArgs(['node', 'script', '--skip-type-check']);
      expect(result.skipTypeCheck).toBe(true);
      expect(result.typeCheckOnly).toBe(false);
    });

    it('should parse --type-check-only', () => {
      const result = parseMbArgs(['node', 'script', '--type-check-only']);
      expect(result.typeCheckOnly).toBe(true);
      expect(result.skipTypeCheck).toBe(false);
    });

    it('should throw if both flags are used', () => {
      expect(() => parseMbArgs([
        'node', 'script', '--skip-type-check', '--type-check-only',
      ])).toThrow('Cannot use --skip-type-check and --type-check-only together');
    });

    it('should pass through base flags', () => {
      const result = parseMbArgs([
        'node', 'script',
        '--fix', '--verbose', '--limit', '5', '--skip-type-check',
      ]);
      expect(result.fix).toBe(true);
      expect(result.verbose).toBe(true);
      expect(result.limit).toBe(5);
      expect(result.skipTypeCheck).toBe(true);
    });

    it('should pass through --output', () => {
      const result = parseMbArgs([
        'node', 'script', '--output', 'report.md',
      ]);
      expect(result.output).toBe('report.md');
    });

    it('should handle flags in any order', () => {
      const result = parseMbArgs([
        'node', 'script',
        '--limit', '20', '--type-check-only', '--verbose',
      ]);
      expect(result.limit).toBe(20);
      expect(result.typeCheckOnly).toBe(true);
      expect(result.verbose).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Type check logic
  // -----------------------------------------------------------------------

  describe('checkEntityType', () => {
    it('should return isCorrect=true when type matches', async () => {
      mockedGetMbEntityType.mockResolvedValue('artist');
      const result = await checkEntityType({
        mbid: 'abc-123',
        expectedType: 'artist',
      });
      expect(result.isCorrect).toBe(true);
      expect(result.actualType).toBe('artist');
    });

    it('should return isCorrect=false for type mismatch', async () => {
      mockedGetMbEntityType.mockResolvedValue('release');
      const result = await checkEntityType({
        mbid: 'abc-123',
        expectedType: 'artist',
      });
      expect(result.isCorrect).toBe(false);
      expect(result.actualType).toBe('release');
      expect(result.detail).toContain('Type mismatch');
      expect(result.detail).toContain('expected artist');
      expect(result.detail).toContain('got release');
    });

    it('should return isCorrect=false when MBID not found', async () => {
      mockedGetMbEntityType.mockResolvedValue(null);
      const result = await checkEntityType({
        mbid: 'nonexistent',
        expectedType: 'recording',
      });
      expect(result.isCorrect).toBe(false);
      expect(result.actualType).toBeNull();
      expect(result.detail).toContain('not found');
    });

    it('should work for recording type', async () => {
      mockedGetMbEntityType.mockResolvedValue('recording');
      const result = await checkEntityType({
        mbid: 'rec-123',
        expectedType: 'recording',
      });
      expect(result.isCorrect).toBe(true);
    });

    it('should work for release type', async () => {
      mockedGetMbEntityType.mockResolvedValue('release');
      const result = await checkEntityType({
        mbid: 'rel-123',
        expectedType: 'release',
      });
      expect(result.isCorrect).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Best-match check logic
  // -----------------------------------------------------------------------

  describe('checkBestMatch', () => {
    describe('artists', () => {
      it('should confirm match when search returns same MBID', async () => {
        mockedGetArtistMbid.mockResolvedValue('abc-123');
        const result = await checkBestMatch({
          collection: 'artists',
          currentMbid: 'abc-123',
          name: 'Radiohead',
          artistName: null,
        });
        expect(result.matches).toBe(true);
        expect(result.foundMbid).toBe('abc-123');
        expect(result.detail).toContain('confirmed');
      });

      it('should report mismatch when search returns different MBID', async () => {
        mockedGetArtistMbid.mockResolvedValue('def-456');
        const result = await checkBestMatch({
          collection: 'artists',
          currentMbid: 'abc-123',
          name: 'Radiohead',
          artistName: null,
        });
        expect(result.matches).toBe(false);
        expect(result.foundMbid).toBe('def-456');
        expect(result.detail).toContain('Better match available');
        expect(result.detail).toContain('abc-123');
        expect(result.detail).toContain('def-456');
      });

      it('should return matches=true when search finds nothing', async () => {
        mockedGetArtistMbid.mockResolvedValue(null);
        const result = await checkBestMatch({
          collection: 'artists',
          currentMbid: 'abc-123',
          name: 'Obscure Artist',
          artistName: null,
        });
        expect(result.matches).toBe(true);
        expect(result.foundMbid).toBeNull();
      });
    });

    describe('songs', () => {
      it('should search with artist name and confirm match', async () => {
        mockedGetRecordingMbid.mockResolvedValue('rec-123');
        const result = await checkBestMatch({
          collection: 'songs',
          currentMbid: 'rec-123',
          name: 'Creep',
          artistName: 'Radiohead',
        });
        expect(result.matches).toBe(true);
        expect(mockedGetRecordingMbid).toHaveBeenCalledWith(
          'Creep',
          'Radiohead',
        );
      });

      it('should fallback to title-only search if artist search fails', async () => {
        mockedGetRecordingMbid
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce('rec-456');
        const result = await checkBestMatch({
          collection: 'songs',
          currentMbid: 'rec-123',
          name: 'Creep',
          artistName: 'Radiohead',
        });
        expect(result.matches).toBe(false);
        expect(result.foundMbid).toBe('rec-456');
        expect(mockedGetRecordingMbid).toHaveBeenCalledTimes(2);
        expect(mockedGetRecordingMbid).toHaveBeenNthCalledWith(2, 'Creep');
      });
    });

    describe('records', () => {
      it('should search with artist name and confirm match', async () => {
        mockedGetReleaseMbid.mockResolvedValue('rel-123');
        const result = await checkBestMatch({
          collection: 'records',
          currentMbid: 'rel-123',
          name: 'OK Computer',
          artistName: 'Radiohead',
        });
        expect(result.matches).toBe(true);
        expect(mockedGetReleaseMbid).toHaveBeenCalledWith(
          'OK Computer',
          'Radiohead',
        );
      });

      it('should fallback to title-only search for records', async () => {
        mockedGetReleaseMbid
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce('rel-789');
        const result = await checkBestMatch({
          collection: 'records',
          currentMbid: 'rel-123',
          name: 'OK Computer',
          artistName: 'Radiohead',
        });
        expect(result.matches).toBe(false);
        expect(result.foundMbid).toBe('rel-789');
        expect(mockedGetReleaseMbid).toHaveBeenCalledTimes(2);
      });

      it('should report mismatch for records with different MBID', async () => {
        mockedGetReleaseMbid.mockResolvedValue('different-id');
        const result = await checkBestMatch({
          collection: 'records',
          currentMbid: 'original-id',
          name: 'OK Computer',
          artistName: 'Radiohead',
        });
        expect(result.matches).toBe(false);
        expect(result.detail).toContain('Better match available');
      });
    });
  });
});
