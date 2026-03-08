import { describe, it, expect } from 'vitest';
import {
  parseArgs,
  getArtistName,
  emptyReport,
  classifyMatch,
  type MatchResult,
  type CollectionReport,
} from './musicbrainz-bulk-match-utils';

describe('musicbrainz-bulk-match-utils', () => {
  describe('parseArgs', () => {
    it('should return defaults with no arguments', () => {
      const result = parseArgs(['node', 'script']);
      expect(result).toEqual({
        collection: 'all',
        fix: false,
        verify: false,
        limit: 0,
      });
    });

    it('should parse --fix flag', () => {
      const result = parseArgs(['node', 'script', '--fix']);
      expect(result.fix).toBe(true);
    });

    it('should parse --verify flag', () => {
      const result = parseArgs(['node', 'script', '--verify']);
      expect(result.verify).toBe(true);
    });

    it('should parse --collection artists', () => {
      const result = parseArgs(['node', 'script', '--collection', 'artists']);
      expect(result.collection).toBe('artists');
    });

    it('should parse --collection records', () => {
      const result = parseArgs(['node', 'script', '--collection', 'records']);
      expect(result.collection).toBe('records');
    });

    it('should parse --collection songs', () => {
      const result = parseArgs(['node', 'script', '--collection', 'songs']);
      expect(result.collection).toBe('songs');
    });

    it('should parse --collection all', () => {
      const result = parseArgs(['node', 'script', '--collection', 'all']);
      expect(result.collection).toBe('all');
    });

    it('should parse --limit with a valid number', () => {
      const result = parseArgs(['node', 'script', '--limit', '25']);
      expect(result.limit).toBe(25);
    });

    it('should parse combined flags', () => {
      const result = parseArgs([
        'node',
        'script',
        '--collection',
        'songs',
        '--fix',
        '--verify',
        '--limit',
        '10',
      ]);
      expect(result).toEqual({
        collection: 'songs',
        fix: true,
        verify: true,
        limit: 10,
      });
    });

    it('should throw for invalid collection', () => {
      expect(() => parseArgs(['node', 'script', '--collection', 'invalid'])).toThrow(
        'Invalid collection "invalid"',
      );
    });

    it('should throw for invalid limit', () => {
      expect(() => parseArgs(['node', 'script', '--limit', 'abc'])).toThrow('Invalid limit "abc"');
    });

    it('should throw for zero limit', () => {
      expect(() => parseArgs(['node', 'script', '--limit', '0'])).toThrow('Invalid limit "0"');
    });

    it('should throw for negative limit', () => {
      expect(() => parseArgs(['node', 'script', '--limit', '-5'])).toThrow('Invalid limit "-5"');
    });

    it('should throw for unknown arguments', () => {
      expect(() => parseArgs(['node', 'script', '--unknown'])).toThrow(
        'Unknown argument: --unknown',
      );
    });
  });

  describe('getArtistName', () => {
    it('should return null for null input', () => {
      expect(getArtistName(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(getArtistName(undefined)).toBeNull();
    });

    it('should return null for a plain string ID', () => {
      expect(getArtistName('abc-123')).toBeNull();
    });

    it('should return name from a populated object', () => {
      expect(getArtistName({ id: '1', name: 'Radiohead' })).toBe('Radiohead');
    });

    it('should return null for an object without name', () => {
      expect(getArtistName({ id: '1' })).toBeNull();
    });
  });

  describe('emptyReport', () => {
    it('should return a zeroed report for a given collection', () => {
      const report = emptyReport('artists');
      expect(report).toEqual({
        collection: 'artists',
        total: 0,
        processed: 0,
        missing: 0,
        matched: 0,
        mismatched: 0,
        notFound: 0,
        verified: 0,
        updated: 0,
        results: [],
      });
    });
  });

  describe('classifyMatch', () => {
    it('should return skipped when MBID exists and not verifying', () => {
      const report = emptyReport('artists');
      const status = classifyMatch('existing-mbid', null, false, report);
      expect(status).toBe('skipped');
    });

    it('should return matched when no current MBID and found one', () => {
      const report = emptyReport('artists');
      const status = classifyMatch(null, 'new-mbid', false, report);
      expect(status).toBe('matched');
      expect(report.matched).toBe(1);
      expect(report.missing).toBe(1);
    });

    it('should return not-found when no current MBID and none found', () => {
      const report = emptyReport('artists');
      const status = classifyMatch(null, null, false, report);
      expect(status).toBe('not-found');
      expect(report.notFound).toBe(1);
      expect(report.missing).toBe(1);
    });

    it('should return mismatch when MBIDs differ during verification', () => {
      const report = emptyReport('artists');
      const status = classifyMatch('old-mbid', 'new-mbid', true, report);
      expect(status).toBe('mismatch');
      expect(report.mismatched).toBe(1);
    });

    it('should return not-found when existing MBID but API finds nothing during verification', () => {
      const report = emptyReport('artists');
      const status = classifyMatch('old-mbid', null, true, report);
      expect(status).toBe('not-found');
      expect(report.notFound).toBe(1);
    });

    it('should return verified when existing MBID matches during verification', () => {
      const report = emptyReport('artists');
      const status = classifyMatch('same-mbid', 'same-mbid', true, report);
      expect(status).toBe('verified');
      expect(report.verified).toBe(1);
    });
  });

  describe('type shapes', () => {
    it('should accept valid MatchResult shapes', () => {
      const result: MatchResult = {
        id: '123',
        name: 'The Beatles',
        currentMbid: null,
        foundMbid: 'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d',
        status: 'matched',
        updated: false,
      };
      expect(result.status).toBe('matched');
    });

    it('should accept numeric ids', () => {
      const result: MatchResult = {
        id: 42,
        name: 'Radiohead',
        currentMbid: 'abc-123',
        foundMbid: 'def-456',
        status: 'mismatch',
        updated: false,
      };
      expect(result.id).toBe(42);
    });

    it('should accept valid CollectionReport shapes', () => {
      const report: CollectionReport = {
        collection: 'artists',
        total: 100,
        processed: 50,
        missing: 30,
        matched: 20,
        mismatched: 2,
        notFound: 8,
        verified: 0,
        updated: 0,
        results: [],
      };
      expect(report.collection).toBe('artists');
      expect(report.processed).toBe(50);
    });
  });
});
