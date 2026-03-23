import type { GenerateFileURL } from '@payloadcms/plugin-cloud-storage/types';

/**
 * Build a Cloudinary delivery URL for a media file.
 *
 * For the **original** image (no `size`), the URL points straight at the
 * uploaded resource:
 *   https://res.cloudinary.com/<cloud>/image/upload/<publicId>
 *
 * For a **sized variant** (thumbnail, card, hero …), Cloudinary's on-the-fly
 * transformation API is used instead of uploading a separate file:
 *   https://res.cloudinary.com/<cloud>/image/upload/c_fill,w_320,h_240/<publicId>
 */
export const cloudinaryGenerateFileURL: GenerateFileURL = ({ filename, size }) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  // filename is the Cloudinary public_id (e.g. "dev/uploads/1704251928-a3f9c2d1").
  // For sized variants it may be undefined when Payload hasn't populated the
  // size-specific filename — return empty string so the URL field stays blank
  // rather than containing "undefined".
  if (!filename) {
    return '';
  }

  const baseURL = `https://res.cloudinary.com/${cloudName}/image/upload`;

  if (!size) {
    return `${baseURL}/${filename}`;
  }

  // Build Cloudinary transformation string for the requested size
  const parts: string[] = ['c_fill'];
  if (size.width) {
    parts.push(`w_${size.width}`);
  }
  if (size.height) {
    parts.push(`h_${size.height}`);
  }
  const transform = parts.join(',');

  return `${baseURL}/${transform}/${filename}`;
};
