/**
 * Unit tests for Posts import script
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { Payload } from 'payload';
import type { Post } from './database';

// Mock modules
vi.mock('./database', () => ({
  connectToDatabase: vi.fn(),
  getActivePosts: vi.fn(),
}));

vi.mock('./shared/payloadClient', () => ({
  getPayloadClient: vi.fn(),
}));

vi.mock('./shared/importUtils', () => ({
  convertHtmlToLexical: vi.fn((html) => ({ root: { children: [{ text: html }] } })),
}));

vi.mock('./shared/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
  logProgress: vi.fn(),
  logSummary: vi.fn(),
}));

describe('importPosts', () => {
  let mockPayload: Partial<Payload>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPayload = {
      find: vi.fn(),
      create: vi.fn(),
    };
  });

  describe('parseArgs', () => {
    it('should parse --env dev argument', async () => {
      const { parseArgs } = await import('./importPosts');

      process.argv = ['node', 'script.ts', '--env', 'dev'];
      const options = parseArgs();

      expect(options.env).toBe('dev');
    });

    it('should throw error for invalid --env value', async () => {
      const { parseArgs } = await import('./importPosts');

      process.argv = ['node', 'script.ts', '--env', 'invalid'];

      expect(() => parseArgs()).toThrow('--env must be either "dev" or "prod"');
    });
  });

  describe('importPost', () => {
    it('should skip already imported post', async () => {
      const { importPost } = await import('./importPosts');

      (mockPayload.find as Mock).mockResolvedValue({
        docs: [{ id: 'existing-post' }],
      });

      const post: Post = {
        id: 1,
        headline: 'Test Story',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        content: '<p>Story content</p>',
        image_url: 'https://example.com/image.jpg',
        priority: 5,
        deleted: 'n',
      };

      const result = await importPost(mockPayload as Payload, post);

      expect(result).toBe('skipped');
      expect(mockPayload.create).not.toHaveBeenCalled();
    });

    it('should import new post successfully', async () => {
      const { importPost } = await import('./importPosts');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'post-id-123' });

      const post: Post = {
        id: 1,
        headline: 'Breaking News',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        content: '<p>Important announcement!</p>',
        image_url: 'https://example.com/news.jpg',
        priority: 10,
        deleted: 'n',
      };

      const result = await importPost(mockPayload as Payload, post);

      expect(result).toBe('success');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'posts',
        data: expect.objectContaining({
          headline: 'Breaking News',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          content: expect.any(Object),
          image: undefined,
          priority: 10,
          legacyId: 1,
          migratedAt: expect.any(String),
        }),
      });
    });

    it('should convert HTML content to Lexical', async () => {
      const { importPost } = await import('./importPosts');
      const { convertHtmlToLexical } = await import('./shared/importUtils');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'post-id-123' });

      const post: Post = {
        id: 1,
        headline: 'Test Post',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        content: '<p>HTML content</p>',
        image_url: '',
        priority: 0,
        deleted: 'n',
      };

      await importPost(mockPayload as Payload, post);

      expect(convertHtmlToLexical).toHaveBeenCalledWith('<p>HTML content</p>');
    });

    it('should handle empty optional fields', async () => {
      const { importPost } = await import('./importPosts');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'post-id-123' });

      const post: Post = {
        id: 1,
        headline: 'Minimal Post',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        content: 'Simple text',
        image_url: '',
        priority: 0,
        deleted: 'n',
      };

      const result = await importPost(mockPayload as Payload, post);

      expect(result).toBe('success');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'posts',
        data: expect.objectContaining({
          image: undefined,
          priority: 0,
        }),
      });
    });

    it('should preserve priority value', async () => {
      const { importPost } = await import('./importPosts');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'post-id-123' });

      const post: Post = {
        id: 1,
        headline: 'High Priority',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        content: 'Important content',
        image_url: '',
        priority: 99,
        deleted: 'n',
      };

      const result = await importPost(mockPayload as Payload, post);

      expect(result).toBe('success');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'posts',
        data: expect.objectContaining({
          priority: 99,
        }),
      });
    });

    it('should preserve all date fields', async () => {
      const { importPost } = await import('./importPosts');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'post-id-123' });

      const post: Post = {
        id: 1,
        headline: 'Dated Post',
        start_date: '2024-03-01',
        end_date: '2024-03-31',
        content: 'March content',
        image_url: '',
        priority: 0,
        deleted: 'n',
      };

      const result = await importPost(mockPayload as Payload, post);

      expect(result).toBe('success');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'posts',
        data: expect.objectContaining({
          startDate: '2024-03-01',
          endDate: '2024-03-31',
        }),
      });
    });

    it('should generate slug with date prefix for stories', async () => {
      const { importPost } = await import('./importPosts');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'post-id-123' });

      const post: Post = {
        id: 1,
        headline: 'Top 11 Giveaway',
        start_date: '2025-01-31',
        end_date: '2025-02-28',
        content: 'Story content',
        image_url: '',
        priority: 0,
        deleted: 'n',
        source: 'story',
      };

      const result = await importPost(mockPayload as Payload, post);

      expect(result).toBe('success');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'posts',
        data: expect.objectContaining({
          headline: 'Top 11 Giveaway',
          slug: '2025-01-31--top-11-giveaway',
        }),
      });
    });

    it('should preserve permalink slug for custom texts', async () => {
      const { importPost } = await import('./importPosts');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'post-id-123' });

      const post: Post = {
        id: 10001,
        headline: 'About Us',
        start_date: '2000-01-01',
        end_date: '2099-12-31',
        content: 'About page content',
        image_url: '',
        priority: 0,
        deleted: 'n',
        source: 'custom_text',
        permalink: 'about',
      };

      const result = await importPost(mockPayload as Payload, post);

      expect(result).toBe('success');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'posts',
        data: expect.objectContaining({
          headline: 'About Us',
          slug: 'about',
        }),
      });
    });

    it('should handle HTML in headline for slug generation', async () => {
      const { importPost } = await import('./importPosts');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'post-id-123' });

      const post: Post = {
        id: 1,
        headline: 'Win <b>Free</b> Tickets!',
        start_date: '2025-01-15',
        end_date: '2025-01-31',
        content: 'Contest details',
        image_url: '',
        priority: 0,
        deleted: 'n',
        source: 'story',
      };

      const result = await importPost(mockPayload as Payload, post);

      expect(result).toBe('success');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'posts',
        data: expect.objectContaining({
          headline: 'Win Free Tickets!',
          slug: '2025-01-15--win-free-tickets',
        }),
      });
    });
  });
});
