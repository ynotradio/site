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
 * Parse inline HTML elements recursively
 * Handles nested tags like <b><a href="...">text</a></b>
 */
function parseInlineElements(html: string): any[] {
  const nodes: any[] = [];

  // Match opening tags with their content
  const tagRegex = /<(a|b|strong|em|i)([^>]*)>(.*?)<\/\1>/gi;

  // Track last processed position
  let lastProcessedIndex = 0;

  const matches = [];
  let match = tagRegex.exec(html);
  while (match !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      tag: match[1],
      attributes: match[2],
      innerHtml: match[3],
      fullMatch: match[0],
    });
    match = tagRegex.exec(html);
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
 * Parse HTML string into Lexical paragraph nodes
 * Handles: <p>, <br>, <b>, <strong>, <em>, <i>, <a>, <center>
 */
function parseHtmlToLexicalNodes(htmlInput: string): any[] {
  const nodes: any[] = [];

  // Remove <center> tags but keep content (use local copy to avoid mutating parameter)
  const html = htmlInput.replace(/<\/?center>/gi, '');

  // Split by paragraph and br tags
  const segments = html.split(/<\/?p>|<br\s*\/?>/gi).filter((s) => s.trim());

  for (const segment of segments) {
    const trimmedSegment = segment.trim();
    if (!trimmedSegment) {
      // Skip empty segments
    } else {
      const children = parseInlineElements(trimmedSegment);

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

/**
 * Strip HTML tags from plain text fields
 * Use this for text fields that should not contain HTML (names, titles, etc.)
 * Do NOT use for richText/Lexical fields - use convertHtmlToLexical instead
 *
 * @param text - Text that may contain HTML tags
 * @returns Plain text with HTML tags removed
 */
export function stripHtmlTags(text: string | null | undefined): string {
  if (!text) {
    return '';
  }

  return text
    .replace(/<br\s*\/?>/gi, ' ') // Replace <br> with space
    .replace(/<\/(p|div|h[1-6]|li|td|th|tr)>/gi, ' ') // Add space after block-level closing tags
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Convert plain text to Lexical JSON format
 * Use this when you need to convert plain text (not HTML) to Lexical
 * For HTML content, use convertHtmlToLexical instead
 *
 * @param text - Plain text string
 * @returns Lexical JSON structure
 */
export function convertTextToLexical(text: string | null | undefined): any {
  if (!text || text.trim() === '') {
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
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: text.trim(),
              type: 'text',
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
