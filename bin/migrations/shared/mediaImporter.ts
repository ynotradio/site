/**
 * Media Importer Utility
 *
 * Downloads images from legacy URLs (Google Drive, Imgur, ynotradio.net, etc.)
 * and uploads them to Cloudinary via Payload CMS Media collection.
 */

import type { Payload } from 'payload';
import axios from 'axios';
import { createLogger } from './logger';

const logger = createLogger('MediaImporter');

export interface MediaImportResult {
  success: boolean;
  mediaId?: string;
  cloudinaryUrl?: string;
  error?: string;
}

export interface MediaMetadata {
  alt: string;
  caption?: string;
  legacyUrl: string;
  legacyId?: number;
}

/**
 * Process image URLs to handle special cases (Google Drive, etc.)
 */
function processImageUrl(url: string): string {
  // Handle relative paths with backslashes (e.g., "images\mattsummers.jpg")
  // or forward slashes (e.g., "images/mattsummers.jpg")
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // Convert backslashes to forward slashes
    const normalizedPath = url.replace(/\\/g, '/');

    // Remove leading slash if present
    const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath;

    // Construct full URL to ynotradio.net
    return `https://www.ynotradio.net/${cleanPath}`;
  }

  // Google Drive: Convert sharing URL to direct download URL
  if (url.includes('drive.google.com')) {
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1];
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
  }

  // Fix URLs with multiple slashes (e.g., "http://example.com//images//photo.jpg")
  // Keep the protocol double slash but fix the rest
  if (url.includes('://')) {
    const [protocol, ...rest] = url.split('://');
    const cleanedPath = rest.join('://').replace(/\/+/g, '/');
    return `${protocol}://${cleanedPath}`;
  }

  return url;
}

/**
 * Get MIME type from URL or buffer magic numbers
 */
function getMimeType(url: string, buffer: Buffer): string {
  // Try to determine from URL extension
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
  if (ext) {
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    if (mimeTypes[ext]) {
      return mimeTypes[ext];
    }
  }

  // Check magic numbers in buffer
  if (buffer.length < 4) {
    return 'image/jpeg'; // Default fallback
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }

  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return 'image/gif';
  }

  // WebP: RIFF ... WEBP
  if (
    buffer[0] === 0x52
    && buffer[1] === 0x49
    && buffer[2] === 0x46
    && buffer[3] === 0x46
    && buffer.length >= 12
    && buffer[8] === 0x57
    && buffer[9] === 0x45
    && buffer[10] === 0x42
    && buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return 'image/jpeg'; // Default fallback
}

/**
 * Generate a filename from URL and MIME type
 */
function generateFilename(url: string, mimeType: string): string {
  // Extract filename from URL if possible
  const urlParts = url.split('/');
  const lastPart = urlParts[urlParts.length - 1].split('?')[0];

  // If URL has a reasonable filename, use it (sanitized)
  if (lastPart && lastPart.includes('.')) {
    return lastPart.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  // Otherwise generate a name from the URL hash
  // eslint-disable-next-line no-bitwise
  const hash = url
    .split('')
    // eslint-disable-next-line no-bitwise
    .reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0)
    .toString(36);

  const ext = mimeType.split('/')[1] || 'jpg';
  return `imported-${Math.abs(hash)}.${ext}`;
}

/**
 * Download image from URL
 */
async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    // Handle Google Drive URLs
    const processedUrl = processImageUrl(url);

    const response = await axios.get(processedUrl, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
      maxContentLength: 10 * 1024 * 1024, // 10 MB max
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; YNotRadioBot/1.0)',
      },
    });

    return Buffer.from(response.data);
  } catch (error) {
    logger.error(`Failed to download ${url}:`, error as Error);
    return null;
  }
}

/**
 * Import an image from a URL to Cloudinary via Payload Media collection
 *
 * @param payload - Payload CMS instance
 * @param imageUrl - URL of the image to import (Google Drive, Imgur, ynotradio.net, etc.)
 * @param metadata - Metadata for the media record
 * @returns Result with media ID and Cloudinary URL, or error
 */
export async function importImageFromUrl(
  payload: Payload,
  imageUrl: string,
  metadata: MediaMetadata,
): Promise<MediaImportResult> {
  try {
    // Skip if URL is empty or invalid
    if (!imageUrl || imageUrl.trim() === '') {
      return { success: false, error: 'Empty image URL' };
    }

    // Check if already imported by legacy URL
    const existing = await payload.find({
      collection: 'media',
      where: {
        legacyUrl: {
          equals: imageUrl,
        },
      },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      logger.debug(`Image already imported: ${imageUrl}`);
      return {
        success: true,
        mediaId: existing.docs[0].id,
        cloudinaryUrl: existing.docs[0].url as string,
      };
    }

    // Download the image
    logger.debug(`Downloading image: ${imageUrl}`);
    const imageBuffer = await downloadImage(imageUrl);

    if (!imageBuffer) {
      return { success: false, error: 'Failed to download image' };
    }

    // Determine MIME type from URL or buffer
    const mimeType = getMimeType(imageUrl, imageBuffer);
    const filename = generateFilename(imageUrl, mimeType);

    // Upload to Payload (which will handle Cloudinary via the plugin)
    logger.debug(`Uploading to Payload/Cloudinary: ${filename}`);
    
    // Don't set legacyId for media - it causes unique constraint conflicts
    // when multiple posts reference images (since we're using post IDs, not image IDs)
    // Instead, rely on legacyUrl for deduplication
    const mediaData: Record<string, any> = {
      alt: metadata.alt,
      caption: metadata.caption,
      legacyUrl: metadata.legacyUrl,
      migratedAt: new Date().toISOString(),
    };
    
    const media = await payload.create({
      collection: 'media',
      data: mediaData,
      file: {
        data: imageBuffer,
        mimetype: mimeType,
        name: filename,
        size: imageBuffer.length,
      },
    });

    logger.info(`✓ Imported image: ${imageUrl} -> ${media.id}`);

    return {
      success: true,
      mediaId: media.id,
      cloudinaryUrl: media.url as string,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to import image ${imageUrl}: ${errorMsg}`);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Batch import images with progress tracking
 */
export async function batchImportImages(
  payload: Payload,
  images: Array<{ url: string; metadata: MediaMetadata }>,
  options: {
    concurrency?: number;
    onProgress?: (current: number, total: number, result: MediaImportResult) => void;
  } = {},
): Promise<MediaImportResult[]> {
  const { concurrency = 3, onProgress } = options;
  const results: MediaImportResult[] = [];

  // Process in batches to avoid overwhelming the server
  for (let i = 0; i < images.length; i += concurrency) {
    const batch = images.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(({ url, metadata }) => importImageFromUrl(payload, url, metadata)),
    );

    results.push(...batchResults);

    // Report progress
    if (onProgress) {
      batchResults.forEach((result, idx) => {
        onProgress(i + idx + 1, images.length, result);
      });
    }

    // Rate limiting: small delay between batches
    if (i + concurrency < images.length) {
      await new Promise((resolve) => {
        setTimeout(resolve, 200);
      });
    }
  }

  return results;
}
