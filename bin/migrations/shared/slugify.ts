/**
 * Generate a URL-friendly slug from text
 * Removes HTML tags, special characters, and normalizes whitespace
 *
 * @deprecated Use slugifyHeadline from payload/src/collections/hooks/slugUtils instead
 */
export { slugifyHeadline as slugify } from '../../../payload/src/collections/hooks/slugUtils';

/**
 * Clean HTML tags from headline text
 */
export function cleanHeadline(headline: string): string {
  if (!headline) return '';

  return headline
    .replace(/<br\s*\/?>/gi, ' ') // Replace <br> with space
    .replace(/<[^>]*>/g, '') // Remove all other HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}
