/**
 * Common utility functions for data import scripts
 */

/**
 * Generate a URL-friendly slug from a string
 * Used across all import scripts for consistent slug generation
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
}

/**
 * Convert HTML content to Lexical JSON format
 * This is a simplified conversion - for production, consider using @payloadcms/richtext-lexical
 * or a proper html-to-lexical converter package
 *
 * TODO: Implement proper HTML-to-Lexical conversion using @payloadcms/richtext-lexical
 * or similar package to preserve formatting, links, and other rich content
 *
 * @param html - HTML string to convert
 * @returns Lexical JSON structure
 */
export function convertHtmlToLexical(html: string): any {
  if (!html) {
    return {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        children: [],
        direction: null,
      },
    };
  }

  // Simple conversion - wrap HTML in a paragraph node
  // TODO: Replace with proper HTML parser that preserves formatting
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              type: 'text',
              format: 0,
              text: html.replace(/<[^>]*>/g, ''), // TODO: Strip HTML tags - replace with proper HTML parser
              version: 1,
            },
          ],
          direction: 'ltr',
        },
      ],
      direction: 'ltr',
    },
  };
}
