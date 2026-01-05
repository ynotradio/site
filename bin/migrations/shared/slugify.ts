/**
 * Generate a URL-friendly slug from text
 * Removes HTML tags, special characters, and normalizes whitespace
 */
export function slugify(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags like <br>, <font>, etc.
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .trim();
}

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
