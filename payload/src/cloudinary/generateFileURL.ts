import type { GenerateFileURL } from '@payloadcms/plugin-cloud-storage/types';

/**
 * Build a Cloudinary delivery URL for a media file.
 * For sized variants, uses on-the-fly transforms (c_fill,w_320,h_240) instead of separate uploads.
 */
export const cloudinaryGenerateFileURL: GenerateFileURL = ({ filename, size }) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!filename) {
    return '';
  }

  const baseURL = `https://res.cloudinary.com/${cloudName}/image/upload`;

  if (!size) {
    return `${baseURL}/${filename}`;
  }

  // Build Cloudinary transformation string for the requested size
  const parts: string[] = ['c_fill'];
  if (size.width) parts.push(`w_${size.width}`);
  if (size.height) parts.push(`h_${size.height}`);
  const transform = parts.join(',');

  return `${baseURL}/${transform}/${filename}`;
};
