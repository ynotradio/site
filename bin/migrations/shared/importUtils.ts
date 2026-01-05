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
 * Preserves links, formatting (bold, italic), and basic structure
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

  // Parse HTML into Lexical nodes
  const children = parseHtmlToLexicalNodes(html);

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children,
      direction: 'ltr',
    },
  };
}

/**
 * Parse HTML string into Lexical paragraph nodes
 * Handles: <p>, <br>, <b>, <strong>, <em>, <i>, <a>, <center>
 */
function parseHtmlToLexicalNodes(html: string): any[] {
  const nodes: any[] = [];

  // Remove <center> tags but keep content
  html = html.replace(/<\/?center>/gi, '');

  // Split by paragraph and br tags
  const segments = html.split(/<\/?p>|<br\s*\/?>/gi).filter((s) => s.trim());

  for (const segment of segments) {
    if (!segment.trim()) continue;

    const children = parseInlineElements(segment.trim());

    if (children.length > 0) {
      nodes.push({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children,
        direction: 'ltr',
      });
    }
  }

  // If no paragraphs were created, wrap everything in one
  if (nodes.length === 0 && html.trim()) {
    const children = parseInlineElements(html.trim());
    if (children.length > 0) {
      nodes.push({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children,
        direction: 'ltr',
      });
    }
  }

  return nodes;
}

/**
 * Parse inline HTML elements recursively
 * Handles nested tags like <b><a href="...">text</a></b>
 */
function parseInlineElements(html: string): any[] {
  const nodes: any[] = [];
  const currentIndex = 0;

  // Match opening tags with their content
  const tagRegex = /<(a|b|strong|em|i)([^>]*)>(.*?)<\/\1>/gi;
  let match;

  // Track last processed position
  let lastProcessedIndex = 0;

  const matches = [];
  while ((match = tagRegex.exec(html)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      tag: match[1],
      attributes: match[2],
      innerHtml: match[3],
      fullMatch: match[0],
    });
  }

  // Process text and tags in order
  for (const m of matches) {
    // Add any plain text before this tag
    if (m.start > lastProcessedIndex) {
      const plainText = html.substring(lastProcessedIndex, m.start).trim();
      if (plainText) {
        nodes.push({
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: plainText,
          type: 'text',
          version: 1,
        });
      }
    }

    // Process the tag
    const tag = m.tag.toLowerCase();
    const { innerHtml } = m;

    if (tag === 'a') {
      // Extract href
      const hrefMatch = m.attributes.match(/href=["']([^"']+)["']/);
      const href = hrefMatch ? hrefMatch[1] : '';

      // Get link text (may contain nested formatting)
      const linkText = innerHtml.replace(/<[^>]*>/g, '').trim();

      if (linkText && href) {
        nodes.push({
          type: 'link',
          format: '',
          indent: 0,
          version: 3,
          rel: null,
          target: null,
          title: null,
          url: href,
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: linkText,
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr',
        });
      }
    } else if (tag === 'b' || tag === 'strong') {
      // Check if inner content has links or other tags
      if (innerHtml.includes('<')) {
        // Recursively parse inner content
        const innerNodes = parseInlineElements(innerHtml);
        nodes.push(...innerNodes);
      } else {
        // Plain bold text
        nodes.push({
          detail: 0,
          format: 1, // Bold
          mode: 'normal',
          style: '',
          text: innerHtml.trim(),
          type: 'text',
          version: 1,
        });
      }
    } else if (tag === 'em' || tag === 'i') {
      // Plain italic text
      nodes.push({
        detail: 0,
        format: 2, // Italic
        mode: 'normal',
        style: '',
        text: innerHtml.replace(/<[^>]*>/g, '').trim(),
        type: 'text',
        version: 1,
      });
    }

    lastProcessedIndex = m.end;
  }

  // Add any remaining plain text
  if (lastProcessedIndex < html.length) {
    const plainText = html.substring(lastProcessedIndex).trim();
    if (plainText) {
      nodes.push({
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        text: plainText,
        type: 'text',
        version: 1,
      });
    }
  }

  // Fallback: if no nodes created, just strip all tags
  if (nodes.length === 0 && html.trim()) {
    const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (text) {
      nodes.push({
        type: 'text',
        format: 0,
        text,
        version: 1,
      });
    }
  }

  return nodes;
}

/**
 * Determine Payload draft status from legacy deleted field
 * Payload uses _status: 'published' | 'draft'
 *
 * @param deleted - Legacy deleted field value
 *   ('y', 'Y', 'yes', 'Yes', 'n', 'N', 'no', 'No', 'No' etc.)
 * @returns 'published' if not deleted, 'draft' if deleted
 */
export function getStatusFromDeleted(deleted: string | null | undefined): 'published' | 'draft' {
  if (!deleted) {
    return 'published';
  }

  const normalizedDeleted = deleted.toLowerCase().trim();

  // Consider 'y', 'yes', or similar as deleted (draft status)
  if (normalizedDeleted === 'y' || normalizedDeleted === 'yes') {
    return 'draft';
  }

  // Everything else is published ('n', 'no', 'No', etc.)
  return 'published';
}
