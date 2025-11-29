import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fixImagePath, isImgurUrl, createImageUploader } from './imageUploader';
import { SanityClient } from '@sanity/client';

// Mock fs modules
vi.mock('fs', () => ({
  default: {
    createReadStream: vi.fn(),
  },
  createReadStream: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  default: {
    writeFile: vi.fn(),
    unlink: vi.fn(),
  },
  writeFile: vi.fn(),
  unlink: vi.fn(),
}));

describe('imageUploader', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fixImagePath', () => {
    it('should return null for null input', () => {
      expect(fixImagePath(null, 'https://example.com')).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(fixImagePath(undefined, 'https://example.com')).toBeNull();
    });

    it('should return full URL as-is for http URL', () => {
      const url = 'http://example.com/image.jpg';
      expect(fixImagePath(url, 'https://base.com')).toBe(url);
    });

    it('should return full URL as-is for https URL', () => {
      const url = 'https://example.com/image.jpg';
      expect(fixImagePath(url, 'https://base.com')).toBe(url);
    });

    it('should combine relative path with base URL', () => {
      expect(fixImagePath('images/photo.jpg', 'https://example.com')).toBe(
        'https://example.com/images/photo.jpg',
      );
    });

    it('should handle base URL with trailing slash', () => {
      expect(fixImagePath('images/photo.jpg', 'https://example.com/')).toBe(
        'https://example.com/images/photo.jpg',
      );
    });

    it('should handle path with leading slash', () => {
      expect(fixImagePath('/images/photo.jpg', 'https://example.com')).toBe(
        'https://example.com/images/photo.jpg',
      );
    });

    it('should normalize Windows-style paths', () => {
      expect(fixImagePath('images\\photo.jpg', 'https://example.com')).toBe(
        'https://example.com/images/photo.jpg',
      );
    });
  });

  describe('isImgurUrl', () => {
    it('should return true for imgur.com URL', () => {
      expect(isImgurUrl('https://imgur.com/abc123')).toBe(true);
    });

    it('should return true for i.imgur.com URL', () => {
      expect(isImgurUrl('https://i.imgur.com/abc123.jpg')).toBe(true);
    });

    it('should return false for non-imgur URL', () => {
      expect(isImgurUrl('https://example.com/image.jpg')).toBe(false);
    });

    it('should return false for URL containing imgur in path', () => {
      expect(isImgurUrl('https://example.com/not-imgur-really')).toBe(false);
    });
  });

  describe('createImageUploader', () => {
    let mockClient: Partial<SanityClient>;
    let mockFetch: ReturnType<typeof vi.fn>;
    let uploader: ReturnType<typeof createImageUploader>;

    beforeEach(async () => {
      // Mock Sanity client
      mockClient = {
        assets: {
          upload: vi.fn(),
        },
      } as any;

      // Mock global fetch
      mockFetch = vi.fn();
      global.fetch = mockFetch;

      // Import and mock fs functions
      const fs = await import('fs');
      const fsPromises = await import('fs/promises');
      vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);
      vi.mocked(fsPromises.unlink).mockResolvedValue(undefined);
      vi.mocked(fs.createReadStream).mockReturnValue({} as any);

      // Create uploader and clear cache
      uploader = createImageUploader(mockClient as SanityClient);
      uploader.clearCache();
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    describe('uploadFromUrl', () => {
      it('should successfully upload an image from URL', async () => {
        const imageUrl = 'https://example.com/image.jpg';
        const mockAsset = { _id: 'image-asset-123' };

        mockFetch.mockResolvedValue({
          ok: true,
          headers: {
            get: () => 'image/jpeg',
          },
          arrayBuffer: async () => new ArrayBuffer(100),
        });

        (mockClient.assets!.upload as any).mockResolvedValue(mockAsset);

        const uploader = createImageUploader(mockClient as SanityClient);
        const result = await uploader.uploadFromUrl(imageUrl);

        expect(result.success).toBe(true);
        expect(result.assetId).toBe('image-asset-123');
        expect(result.imageValue).toEqual({
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: 'image-asset-123',
          },
        });
        expect(mockFetch).toHaveBeenCalledWith(imageUrl);

        const fsPromises = await import('fs/promises');
        expect(fsPromises.writeFile).toHaveBeenCalled();
        expect(fsPromises.unlink).toHaveBeenCalled();
      });

      it('should use cached image on second upload of same URL', async () => {
        const imageUrl = 'https://example.com/image.jpg';
        const mockAsset = { _id: 'image-asset-123' };

        mockFetch.mockResolvedValue({
          ok: true,
          headers: {
            get: () => 'image/jpeg',
          },
          arrayBuffer: async () => new ArrayBuffer(100),
        });

        (mockClient.assets!.upload as any).mockResolvedValue(mockAsset);

        const uploader = createImageUploader(mockClient as SanityClient);

        // First upload
        await uploader.uploadFromUrl(imageUrl);

        // Second upload - should use cache
        const result = await uploader.uploadFromUrl(imageUrl);

        expect(result.success).toBe(true);
        expect(result.assetId).toBe('image-asset-123');
        expect(mockFetch).toHaveBeenCalledTimes(1); // Only called once
        expect(mockClient.assets!.upload).toHaveBeenCalledTimes(1); // Only called once
      });

      it('should handle fetch failure', async () => {
        const imageUrl = 'https://example.com/image.jpg';

        mockFetch.mockResolvedValue({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        });

        const uploader = createImageUploader(mockClient as SanityClient);
        const result = await uploader.uploadFromUrl(imageUrl);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to fetch image');
        expect(result.error).toContain('404');
      });

      it('should handle network error', async () => {
        const imageUrl = 'https://example.com/image.jpg';

        mockFetch.mockRejectedValue(new Error('Network error'));

        const uploader = createImageUploader(mockClient as SanityClient);
        const result = await uploader.uploadFromUrl(imageUrl);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Network error');
      });

      it('should handle upload failure', async () => {
        const imageUrl = 'https://example.com/image.jpg';

        mockFetch.mockResolvedValue({
          ok: true,
          headers: {
            get: () => 'image/jpeg',
          },
          arrayBuffer: async () => new ArrayBuffer(100),
        });

        (mockClient.assets!.upload as any).mockRejectedValue(new Error('Upload failed'));

        const uploader = createImageUploader(mockClient as SanityClient);
        const result = await uploader.uploadFromUrl(imageUrl);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Upload failed');
      });

      it('should use custom filename if provided', async () => {
        const imageUrl = 'https://example.com/image.jpg';
        const customFilename = 'custom-name.jpg';
        const mockAsset = { _id: 'image-asset-123' };

        mockFetch.mockResolvedValue({
          ok: true,
          headers: {
            get: () => 'image/jpeg',
          },
          arrayBuffer: async () => new ArrayBuffer(100),
        });

        (mockClient.assets!.upload as any).mockResolvedValue(mockAsset);

        const uploader = createImageUploader(mockClient as SanityClient);
        await uploader.uploadFromUrl(imageUrl, customFilename);

        expect(mockClient.assets!.upload).toHaveBeenCalledWith(
          'image',
          expect.anything(),
          { filename: customFilename },
        );
      });

      it('should handle different content types', async () => {
        const imageUrl = 'https://example.com/image.png';
        const mockAsset = { _id: 'image-asset-123' };

        mockFetch.mockResolvedValue({
          ok: true,
          headers: {
            get: () => 'image/png',
          },
          arrayBuffer: async () => new ArrayBuffer(100),
        });

        (mockClient.assets!.upload as any).mockResolvedValue(mockAsset);

        const uploader = createImageUploader(mockClient as SanityClient);
        const result = await uploader.uploadFromUrl(imageUrl);

        expect(result.success).toBe(true);
      });

      it('should clean up temp file even if upload fails', async () => {
        const imageUrl = 'https://example.com/image.jpg';

        mockFetch.mockResolvedValue({
          ok: true,
          headers: {
            get: () => 'image/jpeg',
          },
          arrayBuffer: async () => new ArrayBuffer(100),
        });

        (mockClient.assets!.upload as any).mockRejectedValue(new Error('Upload failed'));

        const uploader = createImageUploader(mockClient as SanityClient);
        await uploader.uploadFromUrl(imageUrl);

        const fsPromises = await import('fs/promises');
        expect(fsPromises.unlink).toHaveBeenCalled();
      });

      it('should handle cleanup failure gracefully', async () => {
        const imageUrl = 'https://example.com/image.jpg';
        const mockAsset = { _id: 'image-asset-123' };

        mockFetch.mockResolvedValue({
          ok: true,
          headers: {
            get: () => 'image/jpeg',
          },
          arrayBuffer: async () => new ArrayBuffer(100),
        });

        (mockClient.assets!.upload as any).mockResolvedValue(mockAsset);

        const fsPromises = await import('fs/promises');
        vi.mocked(fsPromises.unlink).mockRejectedValue(new Error('Cleanup failed'));

        const uploader = createImageUploader(mockClient as SanityClient);
        const result = await uploader.uploadFromUrl(imageUrl);

        // Should still succeed despite cleanup failure
        expect(result.success).toBe(true);
      });
    });

    describe('uploadFromFile', () => {
      it('should successfully upload an image from file path', async () => {
        const filePath = '/path/to/image.jpg';
        const mockAsset = { _id: 'image-asset-456' };

        (mockClient.assets!.upload as any).mockResolvedValue(mockAsset);

        const uploader = createImageUploader(mockClient as SanityClient);
        const result = await uploader.uploadFromFile(filePath);

        expect(result.success).toBe(true);
        expect(result.assetId).toBe('image-asset-456');
        expect(result.imageValue).toEqual({
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: 'image-asset-456',
          },
        });

        const fs = await import('fs');
        expect(fs.createReadStream).toHaveBeenCalledWith(filePath);
      });

      it('should use custom filename if provided', async () => {
        const filePath = '/path/to/image.jpg';
        const customFilename = 'custom.jpg';
        const mockAsset = { _id: 'image-asset-456' };

        (mockClient.assets!.upload as any).mockResolvedValue(mockAsset);

        const uploader = createImageUploader(mockClient as SanityClient);
        await uploader.uploadFromFile(filePath, customFilename);

        expect(mockClient.assets!.upload).toHaveBeenCalledWith(
          'image',
          expect.anything(),
          { filename: customFilename },
        );
      });

      it('should use basename as filename if not provided', async () => {
        const filePath = '/path/to/my-image.jpg';
        const mockAsset = { _id: 'image-asset-456' };

        (mockClient.assets!.upload as any).mockResolvedValue(mockAsset);

        const uploader = createImageUploader(mockClient as SanityClient);
        await uploader.uploadFromFile(filePath);

        expect(mockClient.assets!.upload).toHaveBeenCalledWith(
          'image',
          expect.anything(),
          { filename: 'my-image.jpg' },
        );
      });

      it('should handle upload failure', async () => {
        const filePath = '/path/to/image.jpg';

        (mockClient.assets!.upload as any).mockRejectedValue(new Error('Upload failed'));

        const uploader = createImageUploader(mockClient as SanityClient);
        const result = await uploader.uploadFromFile(filePath);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Upload failed');
      });

      it('should handle non-Error exceptions', async () => {
        const filePath = '/path/to/image.jpg';

        (mockClient.assets!.upload as any).mockRejectedValue('String error');

        const uploader = createImageUploader(mockClient as SanityClient);
        const result = await uploader.uploadFromFile(filePath);

        expect(result.success).toBe(false);
        expect(result.error).toBe('String error');
      });
    });

    describe('clearCache', () => {
      it('should clear the image cache', async () => {
        const imageUrl = 'https://example.com/image.jpg';
        const mockAsset = { _id: 'image-asset-123' };

        mockFetch.mockResolvedValue({
          ok: true,
          headers: {
            get: () => 'image/jpeg',
          },
          arrayBuffer: async () => new ArrayBuffer(100),
        });

        (mockClient.assets!.upload as any).mockResolvedValue(mockAsset);

        const uploader = createImageUploader(mockClient as SanityClient);

        // Upload once to cache
        await uploader.uploadFromUrl(imageUrl);

        // Clear cache
        uploader.clearCache();

        // Upload again - should not use cache
        await uploader.uploadFromUrl(imageUrl);

        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(mockClient.assets!.upload).toHaveBeenCalledTimes(2);
      });
    });
  });
});
