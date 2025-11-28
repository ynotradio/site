/**
 * Image upload utility for Sanity migrations
 * Handles fetching images from external URLs (including Imgur) and uploading to Sanity
 */

import { createClient, SanityClient } from '@sanity/client';
import * as fsPromises from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from './logger';

const logger = createLogger('ImageUploader');

export interface ImageAssetReference {
  _type: 'reference';
  _ref: string;
}

export interface SanityImageValue {
  _type: 'image';
  asset: ImageAssetReference;
}

export interface ImageUploadResult {
  success: boolean;
  assetId?: string;
  imageValue?: SanityImageValue;
  error?: string;
}

// Cache for uploaded images to avoid duplicate uploads
const imageCache = new Map<string, string>();

/**
 * Get file extension from content type
 */
function getExtensionFromContentType(contentType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
  };

  return mimeToExt[contentType.toLowerCase()] || 'jpg';
}

/**
 * Create an image uploader instance
 */
export function createImageUploader(client: SanityClient) {
  /**
   * Upload an image from a URL to Sanity
   */
  async function uploadFromUrl(
    imageUrl: string,
    filename?: string,
  ): Promise<ImageUploadResult> {
    // Check cache first
    if (imageCache.has(imageUrl)) {
      const cachedAssetId = imageCache.get(imageUrl)!;
      logger.debug(`Using cached image: ${imageUrl} -> ${cachedAssetId}`);
      return {
        success: true,
        assetId: cachedAssetId,
        imageValue: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: cachedAssetId,
          },
        },
      };
    }

    try {
      logger.debug(`Fetching image: ${imageUrl}`);

      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const extension = getExtensionFromContentType(contentType);
      const finalFilename = filename || `image-${Date.now()}.${extension}`;

      const imageBuffer = Buffer.from(await response.arrayBuffer());
      const tempFilePath = path.join('/tmp', `temp-upload-${Date.now()}.${extension}`);

      try {
        // Write buffer to temp file
        await fsPromises.writeFile(tempFilePath, imageBuffer);

        // Upload to Sanity
        const asset = await client.assets.upload('image', fs.createReadStream(tempFilePath), {
          filename: finalFilename,
        });

        // Cache the result
        imageCache.set(imageUrl, asset._id);

        logger.info(`Uploaded image: ${finalFilename} -> ${asset._id}`);

        return {
          success: true,
          assetId: asset._id,
          imageValue: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: asset._id,
            },
          },
        };
      } finally {
        // Clean up temp file
        try {
          await fsPromises.unlink(tempFilePath);
        } catch {
          // Ignore cleanup errors
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to upload image from ${imageUrl}: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Upload an image from a local file path to Sanity
   */
  async function uploadFromFile(
    filePath: string,
    filename?: string,
  ): Promise<ImageUploadResult> {
    try {
      const finalFilename = filename || path.basename(filePath);

      const asset = await client.assets.upload('image', fs.createReadStream(filePath), {
        filename: finalFilename,
      });

      logger.info(`Uploaded image: ${finalFilename} -> ${asset._id}`);

      return {
        success: true,
        assetId: asset._id,
        imageValue: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: asset._id,
          },
        },
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to upload image from ${filePath}: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Clear the image cache
   */
  function clearCache(): void {
    imageCache.clear();
    logger.debug('Image cache cleared');
  }

  return {
    uploadFromUrl,
    uploadFromFile,
    clearCache,
  };
}

/**
 * Fix image path - convert relative paths to full URLs
 */
export function fixImagePath(imagePath: string | null | undefined, baseUrl: string): string | null {
  if (!imagePath) return null;

  // If it's already a full URL, use it as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Handle Windows-style paths
  const normalizedPath = imagePath.replace(/\\/g, '/');

  // Remove leading slash if present
  const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath;

  // Combine with base URL
  const fullUrl = baseUrl.endsWith('/') ? `${baseUrl}${cleanPath}` : `${baseUrl}/${cleanPath}`;

  return fullUrl;
}

/**
 * Check if a URL is from Imgur
 */
export function isImgurUrl(url: string): boolean {
  return url.includes('imgur.com') || url.includes('i.imgur.com');
}

// Export client creation for convenience
export { createClient };
