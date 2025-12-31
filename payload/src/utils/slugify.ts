/**
 * Slugify utility for auto-generating slugs from field values
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/[^\w-]+/g, '')        // Remove non-word characters except hyphens
    .replace(/--+/g, '-')            // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')              // Remove leading hyphens
    .replace(/-+$/, '');             // Remove trailing hyphens
};
