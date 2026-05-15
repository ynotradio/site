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

vi.mock('./shared/enhancedHtmlToLexical', () => ({
  convertHtmlToLexicalEnhanced: vi.fn((html) => ({ root: { children: [{ text: html }] } })),
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
    it('should default to prod-neon target', async () => {
      const { parseArgs } = await import('./importPosts');

      process.argv = ['node', 'script.ts'];
      const options = parseArgs();

      expect(options.to).toBe('prod-neon');
    });

    it('should parse --to prod-neon argument', async () => {
      const { parseArgs } = await import('./importPosts');

      process.argv = ['node', 'script.ts', '--to', 'prod-neon'];
      const options = parseArgs();

      expect(options.to).toBe('prod-neon');
    });

    it('should parse --to local-postgres argument', async () => {
      const { parseArgs } = await import('./importPosts');

      process.argv = ['node', 'script.ts', '--to', 'local-postgres'];
      const options = parseArgs();

      expect(options.to).toBe('local-postgres');
    });

    it('should throw error for invalid --to value', async () => {
      const { parseArgs } = await import('./importPosts');

      process.argv = ['node', 'script.ts', '--to', 'invalid'];

      expect(() => parseArgs()).toThrow('--to must be "prod-neon" or "local-postgres"');
    });

    it('should parse separate story and custom text start IDs', async () => {
      const { parseArgs } = await import('./importPosts');

      process.argv = [
        'node',
        'script.ts',
        '--stories-start-id',
        '700',
        '--custom-texts-start-id',
        '220',
      ];
      const options = parseArgs();

      expect(options.storiesStartId).toBe(700);
      expect(options.customTextsStartId).toBe(220);
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

    it('should set showOnFrontPage=true for non-deleted stories', async () => {
      const { importPost } = await import('./importPosts');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'post-id-123' });

      const post: Post = {
        id: 1,
        headline: 'Active Story',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        content: '<p>content</p>',
        image_url: '',
        priority: 0,
        deleted: 'n',
        source: 'story',
      };

      await importPost(mockPayload as Payload, post);

      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'posts',
        data: expect.objectContaining({
          showOnFrontPage: true,
        }),
      });
    });

    it('should set showOnFrontPage=false for deleted stories', async () => {
      const { importPost } = await import('./importPosts');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'post-id-123' });

      const post: Post = {
        id: 1,
        headline: 'Deleted Story',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        content: '<p>content</p>',
        image_url: '',
        priority: 0,
        deleted: 'y',
        source: 'story',
      };

      await importPost(mockPayload as Payload, post);

      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'posts',
        data: expect.objectContaining({
          showOnFrontPage: false,
          _status: 'published',
        }),
      });
    });

    it('should set showOnFrontPage=false for uppercase-deleted stories', async () => {
      const { importPost } = await import('./importPosts');

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'post-id-123' });

      const post: Post = {
        id: 1,
        headline: 'Deleted Story',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        content: '<p>content</p>',
        image_url: '',
        priority: 0,
        deleted: 'Y',
        source: 'story',
      };

      await importPost(mockPayload as Payload, post);

      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'posts',
        data: expect.objectContaining({
          showOnFrontPage: false,
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

  describe('parseArgs --sync-active', () => {
    it('should parse --sync-active flag', async () => {
      const { parseArgs } = await import('./importPosts');

      process.argv = ['node', 'script.ts', '--sync-active'];
      const options = parseArgs();

      expect(options.syncActive).toBe(true);
    });

    it('should default syncActive to undefined', async () => {
      const { parseArgs } = await import('./importPosts');

      process.argv = ['node', 'script.ts'];
      const options = parseArgs();

      expect(options.syncActive).toBeUndefined();
    });

    it('should combine --sync-active with --to and --start-id', async () => {
      const { parseArgs } = await import('./importPosts');

      process.argv = [
        'node', 'script.ts',
        '--to', 'local-postgres',
        '--start-id', '100',
        '--sync-active',
      ];
      const options = parseArgs();

      expect(options.to).toBe('local-postgres');
      expect(options.startId).toBe(100);
      expect(options.syncActive).toBe(true);
    });
  });

  describe('storyHash', () => {
    it('should produce consistent hash for same inputs', async () => {
      const { storyHash } = await import('./importPosts');

      const hash1 = storyHash('headline', 'content', 5, '2025-01-01', '2025-12-31', 'img.jpg', 'link.com');
      const hash2 = storyHash('headline', 'content', 5, '2025-01-01', '2025-12-31', 'img.jpg', 'link.com');

      expect(hash1).toBe(hash2);
    });

    it('should produce different hash when headline changes', async () => {
      const { storyHash } = await import('./importPosts');

      const hash1 = storyHash('headline A', 'content', 5, '2025-01-01', '2025-12-31', '', '');
      const hash2 = storyHash('headline B', 'content', 5, '2025-01-01', '2025-12-31', '', '');

      expect(hash1).not.toBe(hash2);
    });

    it('should produce different hash when priority changes', async () => {
      const { storyHash } = await import('./importPosts');

      const hash1 = storyHash('headline', 'content', 5, '2025-01-01', '2025-12-31', '', '');
      const hash2 = storyHash('headline', 'content', 10, '2025-01-01', '2025-12-31', '', '');

      expect(hash1).not.toBe(hash2);
    });

    it('should produce different hash when dates change', async () => {
      const { storyHash } = await import('./importPosts');

      const hash1 = storyHash('headline', 'content', 5, '2025-01-01', '2025-12-31', '', '');
      const hash2 = storyHash('headline', 'content', 5, '2025-02-01', '2025-12-31', '', '');

      expect(hash1).not.toBe(hash2);
    });

    it('should produce different hash when image or link changes', async () => {
      const { storyHash } = await import('./importPosts');

      const hash1 = storyHash('headline', 'content', 5, '2025-01-01', '2025-12-31', 'old.jpg', '');
      const hash2 = storyHash('headline', 'content', 5, '2025-01-01', '2025-12-31', 'new.jpg', '');

      expect(hash1).not.toBe(hash2);
    });

    it('should return a 32-char hex string', async () => {
      const { storyHash } = await import('./importPosts');

      const hash = storyHash('test', '', 0, '', '', '', '');

      expect(hash).toMatch(/^[a-f0-9]{32}$/);
    });
  });

  describe('syncActiveStories', () => {
    it('should skip stories not yet in PG', async () => {
      const { syncActiveStories } = await import('./importPosts');

      const mockMysql = {
        query: vi.fn().mockResolvedValue([[
          {
            id: 999,
            headline: 'New Story',
            story: '<p>content</p>',
            priority: 5,
            start_date: '2025-01-01',
            end_date: '2025-12-31',
            pic: '',
            pic_url: '',
            deleted: 'n',
          },
        ]]),
      };

      (mockPayload.find as Mock).mockResolvedValue({ docs: [] });

      const stats = await syncActiveStories(mockMysql, mockPayload as Payload);

      expect(stats.refreshed).toBe(0);
      expect(stats.unchanged).toBe(0);
      expect(stats.errors).toBe(0);
    });

    it('should mark unchanged stories as unchanged', async () => {
      const { syncActiveStories, storyHash } = await import('./importPosts');

      const mysqlRow = {
        id: 42,
        headline: 'Test Story',
        story: '<p>content</p>',
        priority: 5,
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        pic: 'img.jpg',
        pic_url: 'https://example.com',
        deleted: 'n',
      };

      const mockMysql = {
        query: vi.fn().mockResolvedValue([[mysqlRow]]),
      };

      // PG record with matching fields
      (mockPayload.find as Mock).mockResolvedValue({
        docs: [{
          id: 'pg-id-42',
          headline: 'Test Story',
          priority: 5,
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          imageUrl: 'img.jpg',
          linkUrl: 'https://example.com',
        }],
      });

      const stats = await syncActiveStories(mockMysql, mockPayload as Payload);

      expect(stats.unchanged).toBe(1);
      expect(stats.refreshed).toBe(0);
    });

    it('should refresh stories with changed headline', async () => {
      const { syncActiveStories } = await import('./importPosts');

      const mockMysql = {
        query: vi.fn().mockResolvedValue([[{
          id: 42,
          headline: 'Updated Headline',
          story: '<p>content</p>',
          priority: 5,
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          pic: '',
          pic_url: '',
          deleted: 'n',
        }]]),
      };

      mockPayload.delete = vi.fn().mockResolvedValue({});
      // First find: syncActiveStories looks up existing PG record
      // Second find: importPost's postExists check (after delete, record gone)
      (mockPayload.find as Mock)
        .mockResolvedValueOnce({
          docs: [{
            id: 'pg-id-42',
            headline: 'Old Headline',
            priority: 5,
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            imageUrl: '',
            linkUrl: '',
          }],
        })
        .mockResolvedValueOnce({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'new-pg-id' });

      const stats = await syncActiveStories(mockMysql, mockPayload as Payload);

      expect(stats.refreshed).toBe(1);
      expect(mockPayload.delete).toHaveBeenCalledWith({
        collection: 'posts',
        id: 'pg-id-42',
      });
      expect(mockPayload.create).toHaveBeenCalled();
    });

    it('should refresh stories with changed priority', async () => {
      const { syncActiveStories } = await import('./importPosts');

      const mockMysql = {
        query: vi.fn().mockResolvedValue([[{
          id: 42,
          headline: 'Same Headline',
          story: '<p>content</p>',
          priority: 10,
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          pic: '',
          pic_url: '',
          deleted: 'n',
        }]]),
      };

      mockPayload.delete = vi.fn().mockResolvedValue({});
      // First find: syncActiveStories lookup; Second find: importPost dedup
      (mockPayload.find as Mock)
        .mockResolvedValueOnce({
          docs: [{
            id: 'pg-id-42',
            headline: 'Same Headline',
            priority: 5,
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            imageUrl: '',
            linkUrl: '',
          }],
        })
        .mockResolvedValueOnce({ docs: [] });
      (mockPayload.create as Mock).mockResolvedValue({ id: 'new-pg-id' });

      const stats = await syncActiveStories(mockMysql, mockPayload as Payload);

      expect(stats.refreshed).toBe(1);
    });

    it('should count errors when re-import fails', async () => {
      const { syncActiveStories } = await import('./importPosts');

      const mockMysql = {
        query: vi.fn().mockResolvedValue([[{
          id: 42,
          headline: 'Changed Headline',
          story: '<p>content</p>',
          priority: 5,
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          pic: '',
          pic_url: '',
          deleted: 'n',
        }]]),
      };

      mockPayload.delete = vi.fn().mockRejectedValue(new Error('DB error'));
      (mockPayload.find as Mock).mockResolvedValue({
        docs: [{
          id: 'pg-id-42',
          headline: 'Old Headline',
          priority: 5,
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          imageUrl: '',
          linkUrl: '',
        }],
      });

      const stats = await syncActiveStories(mockMysql, mockPayload as Payload);

      expect(stats.errors).toBe(1);
      expect(stats.refreshed).toBe(0);
    });
  });

  describe('syncDeletedFromFrontPage', () => {
    it('should remove posts not active in MySQL from Postgres front page', async () => {
      const { syncDeletedFromFrontPage } = await import('./importPosts');

      mockPayload.update = vi.fn().mockResolvedValue({});
      // Front-page posts: legacyIds 10, 20, 30
      (mockPayload.find as Mock).mockResolvedValueOnce({
        docs: [
          { id: 'pg-1', legacyId: 10 },
          { id: 'pg-2', legacyId: 20 },
          { id: 'pg-3', legacyId: 30 },
        ],
        hasNextPage: false,
      });

      const mockMysql = {
        // Only legacyId 10 is active in MySQL (20, 30 are missing/deleted)
        query: vi.fn().mockResolvedValue([[{ id: 10 }]]),
      };

      const stats = await syncDeletedFromFrontPage(mockMysql, mockPayload as Payload);

      expect(stats.fixed).toBe(2);
      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'posts',
        id: 'pg-2',
        data: { showOnFrontPage: false },
      });
      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'posts',
        id: 'pg-3',
        data: { showOnFrontPage: false },
      });
    });

    it('should do nothing when no front-page posts exist', async () => {
      const { syncDeletedFromFrontPage } = await import('./importPosts');

      (mockPayload.find as Mock).mockResolvedValueOnce({
        docs: [],
        hasNextPage: false,
      });

      const mockMysql = { query: vi.fn() };

      const stats = await syncDeletedFromFrontPage(mockMysql, mockPayload as Payload);

      expect(stats.fixed).toBe(0);
      expect(mockMysql.query).not.toHaveBeenCalled();
    });

    it('should do nothing when all stories are active in MySQL', async () => {
      const { syncDeletedFromFrontPage } = await import('./importPosts');

      (mockPayload.find as Mock).mockResolvedValueOnce({
        docs: [{ id: 'pg-1', legacyId: 10 }],
        hasNextPage: false,
      });

      const mockMysql = {
        // legacyId 10 is active
        query: vi.fn().mockResolvedValue([[{ id: 10 }]]),
      };

      const stats = await syncDeletedFromFrontPage(mockMysql, mockPayload as Payload);

      expect(stats.fixed).toBe(0);
    });

    it('should paginate through all front-page posts', async () => {
      const { syncDeletedFromFrontPage } = await import('./importPosts');

      mockPayload.update = vi.fn().mockResolvedValue({});
      // Page 1
      (mockPayload.find as Mock).mockResolvedValueOnce({
        docs: [{ id: 'pg-1', legacyId: 10 }],
        hasNextPage: true,
      });
      // Page 2
      (mockPayload.find as Mock).mockResolvedValueOnce({
        docs: [{ id: 'pg-2', legacyId: 20 }],
        hasNextPage: false,
      });

      const mockMysql = {
        // Neither is active in MySQL
        query: vi.fn().mockResolvedValue([[]]),
      };

      const stats = await syncDeletedFromFrontPage(mockMysql, mockPayload as Payload);

      expect(stats.fixed).toBe(2);
      expect(mockPayload.find).toHaveBeenCalledTimes(2);
    });

    it('should handle custom texts with offset IDs (>= 10000)', async () => {
      const { syncDeletedFromFrontPage } = await import('./importPosts');

      mockPayload.update = vi.fn().mockResolvedValue({});
      (mockPayload.find as Mock).mockResolvedValueOnce({
        docs: [
          { id: 'pg-1', legacyId: 788 },   // real story
          { id: 'pg-2', legacyId: 10001 },  // custom text (offset ID)
        ],
        hasNextPage: false,
      });

      const mockMysql = {
        // Only legacyId 788 exists in stories table; 10001 doesn't exist
        query: vi.fn().mockResolvedValue([[{ id: 788 }]]),
      };

      const stats = await syncDeletedFromFrontPage(mockMysql, mockPayload as Payload);

      expect(stats.fixed).toBe(1);
      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'posts',
        id: 'pg-2',
        data: { showOnFrontPage: false },
      });
    });
  });
});
