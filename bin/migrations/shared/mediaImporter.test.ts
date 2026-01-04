/**
 * Unit tests for Media Importer utility
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { Payload } from 'payload';
import { importImageFromUrl, batchImportImages } from './mediaImporter';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock logger
vi.mock('./logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('mediaImporter', () => {
  let mockPayload: Partial<Payload>;
  let mockAxios: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockAxios = (await import('axios')).default;

    mockPayload = {
      find: vi.fn(),
      create: vi.fn(),
    };
  });

  describe('importImageFromUrl', () => {
    const metadata = {
      alt: 'Test image',
      caption: 'Test caption',
      legacyUrl: 'https://example.com/image.jpg',
      legacyId: 123,
    };

    it('should return error for empty URL', async () => {
      const result = await importImageFromUrl(mockPayload as Payload, '', metadata);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Empty image URL');
    });

    it('should return existing media if already imported', async () => {
      (mockPayload.find as Mock).mockResolvedValueOnce({
        docs: [{
          id: 'existing-media-123',
          url: 'https://cloudinary.com/existing.jpg',
        }],
      });

      const result = await importImageFromUrl(
        mockPayload as Payload,
        'https://example.com/image.jpg',
        metadata,
      );

      expect(result.success).toBe(true);
      expect(result.mediaId).toBe('existing-media-123');
      expect(result.cloudinaryUrl).toBe('https://cloudinary.com/existing.jpg');
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'media',
        where: {
          legacyUrl: {
            equals: 'https://example.com/image.jpg',
          },
        },
        limit: 1,
      });
    });

    it('should download and upload new image', async () => {
      const mockImageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]); // JPEG magic numbers

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      mockAxios.get.mockResolvedValueOnce({
        data: mockImageBuffer,
      });
      (mockPayload.create as Mock).mockResolvedValueOnce({
        id: 'new-media-456',
        url: 'https://cloudinary.com/new.jpg',
      });

      const result = await importImageFromUrl(
        mockPayload as Payload,
        'https://example.com/test.jpg',
        metadata,
      );

      expect(result.success).toBe(true);
      expect(result.mediaId).toBe('new-media-456');
      expect(result.cloudinaryUrl).toBe('https://cloudinary.com/new.jpg');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'media',
        data: expect.objectContaining({
          alt: 'Test image',
          caption: 'Test caption',
          legacyUrl: metadata.legacyUrl,
          legacyId: 123,
        }),
        file: expect.objectContaining({
          data: expect.any(Buffer),
          mimetype: 'image/jpeg',
          name: 'test.jpg',
        }),
      });
    });

    it('should handle download failure', async () => {
      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      mockAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await importImageFromUrl(
        mockPayload as Payload,
        'https://example.com/test.jpg',
        metadata,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to download image');
    });

    it('should handle upload failure', async () => {
      const mockImageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      mockAxios.get.mockResolvedValueOnce({ data: mockImageBuffer });
      (mockPayload.create as Mock).mockRejectedValueOnce(new Error('Upload failed'));

      const result = await importImageFromUrl(
        mockPayload as Payload,
        'https://example.com/test.jpg',
        metadata,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Upload failed');
    });

    it('should handle Google Drive URLs', async () => {
      const mockImageBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG magic numbers

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      mockAxios.get.mockResolvedValueOnce({ data: mockImageBuffer });
      (mockPayload.create as Mock).mockResolvedValueOnce({
        id: 'gdrive-media',
        url: 'https://cloudinary.com/gdrive.png',
      });

      const result = await importImageFromUrl(
        mockPayload as Payload,
        'https://drive.google.com/file/d/abc123xyz/view',
        metadata,
      );

      expect(result.success).toBe(true);
      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://drive.google.com/uc?export=download&id=abc123xyz',
        expect.any(Object),
      );
    });

    it('should handle relative paths', async () => {
      const mockImageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      mockAxios.get.mockResolvedValueOnce({ data: mockImageBuffer });
      (mockPayload.create as Mock).mockResolvedValueOnce({
        id: 'relative-media',
        url: 'https://cloudinary.com/relative.jpg',
      });

      const result = await importImageFromUrl(
        mockPayload as Payload,
        'images/test.jpg',
        metadata,
      );

      expect(result.success).toBe(true);
      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://www.ynotradio.net/images/test.jpg',
        expect.any(Object),
      );
    });

    it('should detect PNG mime type from buffer', async () => {
      const mockImageBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      mockAxios.get.mockResolvedValueOnce({ data: mockImageBuffer });
      (mockPayload.create as Mock).mockResolvedValueOnce({
        id: 'png-media',
        url: 'https://cloudinary.com/test.png',
      });

      await importImageFromUrl(
        mockPayload as Payload,
        'https://example.com/test.png',
        metadata,
      );

      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          file: expect.objectContaining({
            mimetype: 'image/png',
          }),
        }),
      );
    });

    it('should detect GIF mime type from buffer', async () => {
      const mockImageBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      mockAxios.get.mockResolvedValueOnce({ data: mockImageBuffer });
      (mockPayload.create as Mock).mockResolvedValueOnce({
        id: 'gif-media',
        url: 'https://cloudinary.com/test.gif',
      });

      await importImageFromUrl(
        mockPayload as Payload,
        'https://example.com/test.gif',
        metadata,
      );

      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          file: expect.objectContaining({
            mimetype: 'image/gif',
          }),
        }),
      );
    });

    it('should detect WebP mime type from buffer', async () => {
      const mockImageBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00, // file size
        0x57, 0x45, 0x42, 0x50, // WEBP
      ]);

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      mockAxios.get.mockResolvedValueOnce({ data: mockImageBuffer });
      (mockPayload.create as Mock).mockResolvedValueOnce({
        id: 'webp-media',
        url: 'https://cloudinary.com/test.webp',
      });

      await importImageFromUrl(
        mockPayload as Payload,
        'https://example.com/test.webp',
        metadata,
      );

      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          file: expect.objectContaining({
            mimetype: 'image/webp',
          }),
        }),
      );
    });

    it('should handle backslash paths', async () => {
      const mockImageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

      (mockPayload.find as Mock).mockResolvedValueOnce({ docs: [] });
      mockAxios.get.mockResolvedValueOnce({ data: mockImageBuffer });
      (mockPayload.create as Mock).mockResolvedValueOnce({
        id: 'backslash-media',
        url: 'https://cloudinary.com/test.jpg',
      });

      await importImageFromUrl(
        mockPayload as Payload,
        'images\\test.jpg',
        metadata,
      );

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://www.ynotradio.net/images/test.jpg',
        expect.any(Object),
      );
    });
  });

  describe('batchImportImages', () => {
    const metadata = {
      alt: 'Test',
      legacyUrl: 'https://example.com/test.jpg',
    };

    it('should process multiple images in batches', async () => {
      const images = [
        { url: 'https://example.com/1.jpg', metadata },
        { url: 'https://example.com/2.jpg', metadata },
        { url: 'https://example.com/3.jpg', metadata },
      ];

      (mockPayload.find as Mock).mockResolvedValue({
        docs: [{ id: 'existing', url: 'https://cloudinary.com/test.jpg' }],
      });

      const results = await batchImportImages(mockPayload as Payload, images, {
        concurrency: 2,
      });

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('should call progress callback', async () => {
      const images = [
        { url: 'https://example.com/1.jpg', metadata },
        { url: 'https://example.com/2.jpg', metadata },
      ];

      (mockPayload.find as Mock).mockResolvedValue({
        docs: [{ id: 'existing', url: 'https://cloudinary.com/test.jpg' }],
      });

      const onProgress = vi.fn();
      await batchImportImages(mockPayload as Payload, images, {
        concurrency: 1,
        onProgress,
      });

      expect(onProgress).toHaveBeenCalledTimes(2);
      expect(onProgress).toHaveBeenCalledWith(1, 2, expect.any(Object));
      expect(onProgress).toHaveBeenCalledWith(2, 2, expect.any(Object));
    });

    it('should handle empty array', async () => {
      const results = await batchImportImages(mockPayload as Payload, []);
      expect(results).toEqual([]);
    });

    it('should continue processing on individual failures', async () => {
      const images = [
        { url: '', metadata }, // This will fail
        { url: 'https://example.com/valid.jpg', metadata },
      ];

      (mockPayload.find as Mock).mockResolvedValue({
        docs: [{ id: 'existing', url: 'https://cloudinary.com/test.jpg' }],
      });

      const results = await batchImportImages(mockPayload as Payload, images);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(true);
    });
  });
});
