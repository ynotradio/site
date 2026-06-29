/**
 * Common utility functions for data import scripts
 */

import { migrationConfig } from '../config';

/**
 * Convert relative URL to absolute URL
 */
function toAbsoluteUrl(url: string): string {
  if (!url) return url;

  // Already absolute
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Protocol-relative URL
  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  // Root-relative URL (starts with /)
  if (url.startsWith('/')) {
    return `${migrationConfig.baseUrl.replace(/\/$/, '')}${url}`;
  }

  // Relative URL (e.g., contests.php, ../page.html)
  return `${migrationConfig.baseUrl}${url}`;
}

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
 * Generate an "artist--title" format slug used for music collections.
 * Falls back to title-only slug if artist name is empty.
 */
export function generateMusicSlug(artistName: string, title: string): string {
  const titleSlug = generateSlug(title);
  const artistSlug = generateSlug(artistName);
  return artistSlug ? `${artistSlug}--${titleSlug}` : titleSlug;
}

function appendSpaceToLastNode(nodes: any[]): void {
  if (nodes.length === 0) return;
  const lastNode = nodes[nodes.length - 1];
  if (lastNode.text && !lastNode.text.endsWith(' ')) {
    lastNode.text += ' ';
  }
}

// A boundary space can be attached to a preceding plain-text node, but not to a
// link node (whose text lives in children). When the previous node is a link,
// the leading space must be kept on the following text node instead.
function lastNodeIsLink(nodes: any[]): boolean {
  return nodes.length > 0 && nodes[nodes.length - 1].type === 'link';
}

// OR a Lexical format bit into every text node, recursing into link children,
// so wrapping tags (e.g. <em><a>…</a></em>) propagate formatting to the text.
function applyFormat(nodes: any[], formatBit: number): any[] {
  for (const node of nodes) {
    if (node.type === 'text') {
      // eslint-disable-next-line no-bitwise, no-param-reassign
      node.format |= formatBit;
    } else if (node.type === 'link' && Array.isArray(node.children)) {
      applyFormat(node.children, formatBit);
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

  // First, split on <br> tags to handle line breaks as separate nodes
  const brParts = html.split(/<br\s*\/?>/gi);

  for (const [brIndex, partHtml] of brParts.entries()) {
    // Match opening tags with their content in this part
    const tagRegex = /<(a|b|strong|em|i)([^>]*)>(.*?)<\/\1>/gi;

    let lastProcessedIndex = 0;

    const matches = [];
    let match = tagRegex.exec(partHtml);
    while (match !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        tag: match[1],
        attributes: match[2],
        innerHtml: match[3],
      });
      match = tagRegex.exec(partHtml);
    }

    // Process text and tags in order
    for (const m of matches) {
      // Add any plain text before this tag
      if (m.start > lastProcessedIndex) {
        const plainText = partHtml.substring(lastProcessedIndex, m.start);
        const normalizedText = plainText.replace(/\s+/g, ' ');
        if (normalizedText && normalizedText !== ' ') {
          nodes.push({
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: normalizedText,
            type: 'text',
            version: 1,
          });
        } else if (normalizedText === ' ') {
          if (lastNodeIsLink(nodes)) {
            // Space between a link and the next tag — emit it as its own node
            // since it can't be appended to the link's text.
            nodes.push({
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: ' ',
              type: 'text',
              version: 1,
            });
          } else {
            appendSpaceToLastNode(nodes);
          }
        }
      }

      // Process the tag
      const tag = m.tag.toLowerCase();
      const { innerHtml } = m;

      if (tag === 'a') {
        const hrefMatch = m.attributes.match(/href=["']([^"']+)["']/);
        const href = hrefMatch ? hrefMatch[1] : '';

        // Recurse so formatting inside the anchor (e.g. <a><em>Album</em></a>)
        // is preserved as text-node format bits instead of being flattened.
        const linkChildren = innerHtml.includes('<')
          ? parseInlineElements(innerHtml)
          : [{
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: innerHtml.trim(),
            type: 'text',
            version: 1,
          }];

        const hasText = linkChildren.some(
          (c) => (c.text && c.text.trim()) || c.type === 'link',
        );

        if (hasText && href) {
          const absoluteUrl = toAbsoluteUrl(href);
          const targetMatch = m.attributes.match(/target=["']([^"']+)["']/);
          const target = targetMatch ? targetMatch[1] : null;

          nodes.push({
            type: 'link',
            format: '',
            indent: 0,
            version: 3,
            fields: {
              linkType: 'custom',
              url: absoluteUrl,
              newTab: target === '_blank' || target === '_new',
            },
            children: linkChildren,
            direction: 'ltr',
          });
        }
      } else if (tag === 'b' || tag === 'strong') {
        if (innerHtml.includes('<')) {
          nodes.push(...applyFormat(parseInlineElements(innerHtml), 1)); // Bold
        } else {
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
        if (innerHtml.includes('<')) {
          nodes.push(...applyFormat(parseInlineElements(innerHtml), 2)); // Italic
        } else {
          nodes.push({
            detail: 0,
            format: 2, // Italic
            mode: 'normal',
            style: '',
            text: innerHtml.trim(),
            type: 'text',
            version: 1,
          });
        }
      }

      lastProcessedIndex = m.end;
    }

    // Add any remaining plain text in this part
    if (lastProcessedIndex < partHtml.length) {
      const plainText = partHtml.substring(lastProcessedIndex);
      const normalizedText = plainText.replace(/\s+/g, ' ');
      if (normalizedText.trim()) {
        const hasLeadingSpace = !!plainText.match(/^\s/);
        // Keep the leading space on this node when it can't be appended to a
        // preceding link node (links store text in children, not on the node).
        const keepLeadingSpace = hasLeadingSpace && lastNodeIsLink(nodes);
        if (hasLeadingSpace && !keepLeadingSpace) {
          appendSpaceToLastNode(nodes);
        }
        nodes.push({
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: keepLeadingSpace ? ` ${normalizedText.trim()}` : normalizedText.trim(),
          type: 'text',
          version: 1,
        });
      }
    }

    // Add linebreak node after each <br> (except after the last part)
    if (brIndex < brParts.length - 1) {
      nodes.push({
        type: 'linebreak',
        version: 1,
      });
    }
  }

  // Fallback: if no nodes created, just strip all tags
  if (nodes.length === 0 && html.trim()) {
    const text = html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
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

  // Normalize <p align="center">...</p> to <center>...</center> so both
  // patterns are handled by the same code path below.
  const normalizedHtml = htmlInput.replace(
    /<p\s[^>]*align\s*=\s*["']center["'][^>]*>([\s\S]*?)<\/p>/gi,
    '<center>$1</center>',
  );

  // Split on <center>...</center> blocks to preserve alignment metadata.
  // Each alternating element in the resulting array is either plain HTML or
  // a full "<center>...</center>" string.
  const parts = normalizedHtml.split(/(<center>[\s\S]*?<\/center>)/gi);

  for (const part of parts) {
    const isCentered = /^<center>/i.test(part);
    const content = isCentered ? part.replace(/<\/?center>/gi, '') : part;

    if (content.trim()) {
      const format = isCentered ? 'center' : '';

      // Split by paragraph tags only (NOT by <br> tags)
      // parseInlineElements now handles <br> tags and converts them to linebreak nodes
      const segments = content.split(/<\/?p>/gi).filter((s) => s.trim());

      for (const segment of segments) {
        const children = parseInlineElements(segment.trim());
        if (children.length > 0) {
          nodes.push({
            type: 'paragraph',
            format,
            indent: 0,
            version: 1,
            children,
            direction: 'ltr',
          });
        }
      }
    }
  }

  // If no paragraphs were created, wrap everything in one
  if (nodes.length === 0 && htmlInput.trim()) {
    const plain = htmlInput.replace(/<\/?center>/gi, '');
    const children = parseInlineElements(plain.trim());
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

function makeEmptyParagraph(): any {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    children: [
      {
        type: 'text',
        format: 0,
        version: 1,
        text: '',
        mode: 'normal',
        style: '',
        detail: 0,
      },
    ],
    direction: 'ltr',
  };
}

function makeLexicalRoot(children: any[]): any {
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
 * Convert HTML content to Lexical JSON format
 * Preserves links, formatting (bold, italic), and basic structure
 *
 * @param html - HTML string to convert
 * @returns Lexical JSON structure
 */
export function convertHtmlToLexical(html: string): any {
  if (!html?.trim()) {
    return makeLexicalRoot([makeEmptyParagraph()]);
  }

  const children = parseHtmlToLexicalNodes(html);
  if (children.length === 0) {
    children.push(makeEmptyParagraph());
  }

  return makeLexicalRoot(children);
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
