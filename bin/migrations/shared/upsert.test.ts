import { describe, it, expect } from 'vitest';
import { generateDocumentId, createSlug } from './upsert';

// Note: createUpsertHandler requires a SanityClient which is complex to mock
// We test the pure utility functions directly

describe('upsert', () => {
  describe('generateDocumentId', () => {
    it('should generate ID from type and legacyId', () => {
      expect(generateDocumentId('artist', 123)).toBe('artist-123');
    });

    it('should handle different types', () => {
      expect(generateDocumentId('venue', 456)).toBe('venue-456');
      expect(generateDocumentId('concert', 789)).toBe('concert-789');
    });

    it('should handle zero legacyId', () => {
      expect(generateDocumentId('test', 0)).toBe('test-0');
    });
  });

  describe('createSlug', () => {
    it('should create slug from simple name', () => {
      const result = createSlug('Hello World');
      expect(result._type).toBe('slug');
      expect(result.current).toBe('hello-world');
    });

    it('should convert to lowercase', () => {
      const result = createSlug('UPPERCASE');
      expect(result.current).toBe('uppercase');
    });

    it('should replace special characters with hyphens', () => {
      const result = createSlug('Hello! World@2024');
      expect(result.current).toBe('hello-world-2024');
    });

    it('should remove leading hyphens', () => {
      const result = createSlug('!Hello');
      expect(result.current).toBe('hello');
    });

    it('should remove trailing hyphens', () => {
      const result = createSlug('Hello!');
      expect(result.current).toBe('hello');
    });

    it('should handle multiple special characters', () => {
      const result = createSlug('Hello---World');
      expect(result.current).toBe('hello-world');
    });

    it('should handle numbers', () => {
      const result = createSlug('Band 2024');
      expect(result.current).toBe('band-2024');
    });

    it('should handle accented characters by removing them', () => {
      const result = createSlug('Café Münich');
      expect(result.current).toBe('caf-m-nich');
    });

    it('should handle empty string', () => {
      const result = createSlug('');
      expect(result.current).toBe('');
    });

    it('should handle string with only special characters', () => {
      const result = createSlug('!!!');
      expect(result.current).toBe('');
    });
  });
});
