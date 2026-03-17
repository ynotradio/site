import { describe, it, expect } from 'vitest';
import { parseArgs, parseSinceValue, withSinceFilter } from './content-integrity-utils';

describe('content-integrity --since support', () => {
  describe('parseArgs --since', () => {
    it('should parse --since with a relative duration', () => {
      const result = parseArgs(['node', 'script', '--since', '24h']);
      expect(result.since).toBeTruthy();
      const sinceDate = new Date(result.since);
      const diff = Date.now() - sinceDate.getTime();
      expect(diff).toBeGreaterThan(23 * 60 * 60 * 1000);
      expect(diff).toBeLessThan(25 * 60 * 60 * 1000);
    });

    it('should parse --since with an ISO date', () => {
      const result = parseArgs(['node', 'script', '--since', '2025-01-15T00:00:00Z']);
      expect(result.since).toBe('2025-01-15T00:00:00.000Z');
    });

    it('should throw for --since without a value', () => {
      expect(() => parseArgs(['node', 'script', '--since'])).toThrow('--since requires');
    });

    it('should throw for --since with invalid value', () => {
      expect(() => parseArgs(['node', 'script', '--since', 'foobar'])).toThrow('Invalid --since');
    });
  });

  describe('parseSinceValue', () => {
    it('should return empty string for empty input', () => {
      expect(parseSinceValue('')).toBe('');
    });

    it('should parse hours (24h)', () => {
      const result = parseSinceValue('24h');
      const diff = Date.now() - new Date(result).getTime();
      expect(diff).toBeGreaterThan(23 * 60 * 60 * 1000);
      expect(diff).toBeLessThan(25 * 60 * 60 * 1000);
    });

    it('should parse days (7d)', () => {
      const result = parseSinceValue('7d');
      const diff = Date.now() - new Date(result).getTime();
      expect(diff).toBeGreaterThan(6.9 * 24 * 60 * 60 * 1000);
      expect(diff).toBeLessThan(7.1 * 24 * 60 * 60 * 1000);
    });

    it('should parse minutes (30m)', () => {
      const result = parseSinceValue('30m');
      const diff = Date.now() - new Date(result).getTime();
      expect(diff).toBeGreaterThan(29 * 60 * 1000);
      expect(diff).toBeLessThan(31 * 60 * 1000);
    });

    it('should parse weeks (2w)', () => {
      const result = parseSinceValue('2w');
      const diff = Date.now() - new Date(result).getTime();
      expect(diff).toBeGreaterThan(13.9 * 24 * 60 * 60 * 1000);
      expect(diff).toBeLessThan(14.1 * 24 * 60 * 60 * 1000);
    });

    it('should parse ISO date strings', () => {
      expect(parseSinceValue('2025-06-01T12:00:00Z')).toBe('2025-06-01T12:00:00.000Z');
    });

    it('should throw for invalid values', () => {
      expect(() => parseSinceValue('foobar')).toThrow('Invalid --since');
      expect(() => parseSinceValue('abc123')).toThrow('Invalid --since');
    });
  });

  describe('withSinceFilter', () => {
    it('should return undefined when sinceDate is empty and where is undefined', () => {
      expect(withSinceFilter(undefined, '')).toBeUndefined();
    });

    it('should return original where when sinceDate is empty', () => {
      const where = { legacyId: { exists: true } };
      expect(withSinceFilter(where, '')).toBe(where);
    });

    it('should return sinceCondition alone when where is undefined', () => {
      const result = withSinceFilter(undefined, '2025-01-01T00:00:00Z');
      expect(result).toEqual({ updatedAt: { greater_than_equal: '2025-01-01T00:00:00Z' } });
    });

    it('should return sinceCondition alone when where is empty object', () => {
      const result = withSinceFilter({}, '2025-01-01T00:00:00Z');
      expect(result).toEqual({ updatedAt: { greater_than_equal: '2025-01-01T00:00:00Z' } });
    });

    it('should merge where and sinceCondition with AND', () => {
      const where = { legacyId: { exists: true } };
      const result = withSinceFilter(where, '2025-01-01T00:00:00Z');
      expect(result).toEqual({
        and: [
          { legacyId: { exists: true } },
          { updatedAt: { greater_than_equal: '2025-01-01T00:00:00Z' } },
        ],
      });
    });
  });
});
