/* eslint-disable @typescript-eslint/brace-style */
/**
 * Enhanced HTML to Lexical Converter
 *
 * Handles complex HTML structures including:
 * - Headings (h1-h6)
 * - Lists (ul, ol, li)
 * - Images (with alt text and captions)
 * - Block quotes
 * - Horizontal rules
 * - iframes/embeds (YouTube, Vimeo, etc.)
 * - Tables (simplified)
 * - Nested formatting
 *
 * Safety features:
 * - HTML sanitization with DOMPurify
 * - URL validation
 * - Attribute whitelisting
 */

import { randomUUID } from 'crypto';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';
import { createLogger } from './logger';
import { migrationConfig } from '../config';

const logger = createLogger('EnhancedHtmlToLexical');

interface LexicalNode {
  type: string;
  version: number;
  [key: string]: any;
}

/**
 * Sanitize HTML input to prevent XSS and remove dangerous content
 */
function sanitizeHtml(html: string): string {
  const { window } = new JSDOM('');
  const purify = DOMPurify(window as unknown as Window);

  // Configure DOMPurify
  const config = {
    ALLOWED_TAGS: [
      'p', 'br', 'div', 'span',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'b', 'strong', 'i', 'em', 'u', 's', 'strike',
      'img',
      'blockquote', 'pre', 'code',
      'hr',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'iframe', 'center',
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel',
      'src', 'alt', 'width', 'height',
      'class', 'id',
      'value',
      'data-*',
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  };

  return purify.sanitize(html, config);
}

/**
 * Convert relative URL to absolute URL
 * @param url - URL to convert (can be relative or absolute)
 * @returns Absolute URL
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
 * Parse inline elements (bold, italic, links) within text
 */
function parseInlineHTML(html: string): LexicalNode[] {
  if (!html || !html.trim()) {
    return [];
  }

  const dom = new JSDOM(sanitizeHtml(html));
  const nodes: LexicalNode[] = [];

  function processNode(node: Node, inheritedFormat: number = 0): void {
    if (node.nodeType === 3) { // Text node
      const text = node.textContent || '';
      if (text.trim()) {
        nodes.push({
          type: 'text',
          text: text.replace(/\s+/g, ' '),
          format: inheritedFormat,
          mode: 'normal',
          style: '',
          detail: 0,
          version: 1,
        });
      }
    } else if (node.nodeType === 1) { // Element node
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      // Accumulate format bits from parent down through nested inline elements
      let format = inheritedFormat;
      // Bold: 1, Italic: 2, Strikethrough: 4, Underline: 8, Code: 16
      // eslint-disable-next-line no-bitwise
      if (tagName === 'b' || tagName === 'strong') format |= 1;
      // eslint-disable-next-line no-bitwise
      if (tagName === 'i' || tagName === 'em') format |= 2;
      // eslint-disable-next-line no-bitwise
      if (tagName === 's' || tagName === 'strike') format |= 4;
      // eslint-disable-next-line no-bitwise
      if (tagName === 'u') format |= 8;
      // eslint-disable-next-line no-bitwise
      if (tagName === 'code') format |= 16;

      if (tagName === 'a') {
        const href = element.getAttribute('href') || '';
        const target = element.getAttribute('target');

        // Build the link's children by recursing into its contents so that
        // formatting *inside* the anchor (e.g. <a><em>Album</em></a>) is
        // preserved as text-node format bits, not flattened to plain text.
        const before = nodes.length;
        Array.from(element.childNodes).forEach((child) => processNode(child, format));
        const linkChildren = nodes.splice(before);

        nodes.push({
          type: 'link',
          format: '',
          indent: 0,
          version: 3,
          fields: {
            linkType: 'custom',
            url: toAbsoluteUrl(href),
            newTab: target === '_blank' || target === '_new',
          },
          children: linkChildren.length > 0 ? linkChildren : [{
            type: 'text',
            text: element.textContent || '',
            format,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1,
          }],
          direction: 'ltr',
        });
      } else {
        // Recursively process children, propagating accumulated format
        Array.from(element.childNodes).forEach((child) => processNode(child, format));
      }
    }
  }

  Array.from(dom.window.document.body.childNodes).forEach((child) => processNode(child, 0));

  // Fallback: if no nodes, create plain text node
  if (nodes.length === 0 && html.trim()) {
    const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (text) {
      nodes.push({
        type: 'text',
        text,
        format: 0,
        mode: 'normal',
        style: '',
        detail: 0,
        version: 1,
      });
    }
  }

  return nodes;
}

/**
 * Convert HTML element to Lexical nodes
 */
function htmlElementToLexicalNodes(element: Element): LexicalNode[] {
  const nodes: LexicalNode[] = [];
  const tagName = element.tagName.toLowerCase();

  // Headings
  if (tagName.match(/^h[1-6]$/)) {
    const level = parseInt(tagName[1], 10);
    const children = parseInlineHTML(element.innerHTML);
    if (children.length > 0) {
      nodes.push({
        type: 'heading',
        tag: `h${level}`,
        format: '',
        indent: 0,
        version: 1,
        children,
        direction: 'ltr',
      });
    }
  }

  // Paragraphs
  else if (tagName === 'p') {
    // Legacy markup sometimes nests block content (tables of embeds, images)
    // inside a <p>, which is invalid HTML but renders fine in browsers. Inline
    // flattening would silently drop those embeds, so when block descendants
    // are present, walk the children in order and route block elements through
    // the block converter.
    const blockTags = new Set(['table', 'iframe', 'img', 'ul', 'ol', 'blockquote', 'hr', 'div', 'center']);
    const hasBlockDescendant = element.querySelector('table, iframe, img, ul, ol, blockquote, hr') !== null;

    if (hasBlockDescendant) {
      let inlineBuffer = '';
      const flushInline = () => {
        const inline = parseInlineHTML(inlineBuffer);
        inlineBuffer = '';
        if (inline.length > 0) {
          nodes.push({
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            children: inline,
            direction: 'ltr',
          });
        }
      };
      Array.from(element.childNodes).forEach((node) => {
        const el = node.nodeType === 1 ? (node as Element) : null;
        if (el && blockTags.has(el.tagName.toLowerCase())) {
          flushInline();
          nodes.push(...htmlElementToLexicalNodes(el));
        } else if (el) {
          inlineBuffer += el.outerHTML;
        } else if (node.nodeType === 3) {
          inlineBuffer += node.textContent ?? '';
        }
      });
      flushInline();
      return nodes;
    }

    const children = parseInlineHTML(element.innerHTML);
    if (children.length > 0) {
      // Detect alignment from align attribute or inline style
      const alignAttr = element.getAttribute('align') || '';
      const styleAlign = (element as HTMLElement).style?.textAlign || '';
      const alignment = alignAttr || styleAlign;
      const paragraphFormat = alignment === 'center' || alignment === 'right'
        ? alignment
        : '';
      nodes.push({
        type: 'paragraph',
        format: paragraphFormat,
        indent: 0,
        version: 1,
        children,
        direction: 'ltr',
      });
    }
  }

  // Block quotes
  else if (tagName === 'blockquote') {
    const children = parseInlineHTML(element.innerHTML);
    if (children.length > 0) {
      nodes.push({
        type: 'quote',
        format: '',
        indent: 0,
        version: 1,
        children,
        direction: 'ltr',
      });
    }
  }

  // Lists
  else if (tagName === 'ul' || tagName === 'ol') {
    const listItems = Array.from(element.querySelectorAll(':scope > li'));
    const children = listItems.map((li, index) => {
      const itemChildren = parseInlineHTML(li.innerHTML);
      const liValue = li.getAttribute('value');
      const parsedValue = liValue ? parseInt(liValue, 10) : NaN;
      return {
        type: 'listitem',
        value: Number.isNaN(parsedValue) ? index + 1 : parsedValue,
        checked: undefined,
        format: '',
        indent: 0,
        version: 1,
        children: itemChildren.length > 0 ? itemChildren : [{
          type: 'text',
          text: '',
          format: 0,
          mode: 'normal',
          style: '',
          detail: 0,
          version: 1,
        }],
        direction: 'ltr',
      };
    });

    if (children.length > 0) {
      nodes.push({
        type: 'list',
        listType: tagName === 'ol' ? 'number' : 'bullet',
        start: 1,
        tag: tagName,
        format: '',
        indent: 0,
        version: 1,
        children,
        direction: 'ltr',
      });
    }
  }

  // Images
  else if (tagName === 'img') {
    const src = element.getAttribute('src') || '';
    const alt = element.getAttribute('alt') || '';
    const width = element.getAttribute('width');
    const height = element.getAttribute('height');

    if (src) {
      nodes.push({
        type: 'upload',
        value: {
          id: src, // Will need proper upload handling
        },
        relationTo: 'media',
        format: '',
        version: 1,
        // Store original attributes for reference
        src,
        alt,
        width: width ? parseInt(width, 10) : undefined,
        height: height ? parseInt(height, 10) : undefined,
      });
    }
  }

  // iframes (embeds)
  else if (tagName === 'iframe') {
    const src = element.getAttribute('src');
    if (src) {
      nodes.push({
        type: 'block',
        format: '',
        version: 2,
        fields: {
          blockType: 'embed',
          blockName: '',
          url: src,
          id: randomUUID(), // Generate unique ID for block
        },
      });
    }
  }

  // Horizontal rule
  else if (tagName === 'hr') {
    nodes.push({
      type: 'horizontalrule',
      version: 1,
    });
  }

  // Tables. Legacy content frequently abuses tables purely as layout wrappers
  // around block media (iframes, images) — e.g. the y100-rocks playlist. If any
  // cell contains block-level content, recurse into the cells so those embeds
  // survive. Only fall back to the flattened "[Table]" text representation for
  // genuinely text-only tabular data.
  else if (tagName === 'table') {
    const blockSelector = 'iframe, img, ul, ol, blockquote, table, hr';
    const hasBlockContent = element.querySelector(blockSelector) !== null;

    if (hasBlockContent) {
      const blockTags = new Set(['iframe', 'img', 'ul', 'ol', 'blockquote', 'table', 'hr']);
      // Flush accumulated inline HTML (text, <b>, <a>, <br>…) as a paragraph so
      // labels stay attached above their embed, in document order.
      const flushInline = (htmlBuffer: string) => {
        const inline = parseInlineHTML(htmlBuffer);
        if (inline.length > 0) {
          nodes.push({
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            children: inline,
            direction: 'ltr',
          });
        }
      };

      Array.from(element.querySelectorAll('td, th')).forEach((cell) => {
        let inlineBuffer = '';
        Array.from(cell.childNodes).forEach((node) => {
          const el = node.nodeType === 1 ? (node as Element) : null;
          if (el && blockTags.has(el.tagName.toLowerCase())) {
            flushInline(inlineBuffer);
            inlineBuffer = '';
            nodes.push(...htmlElementToLexicalNodes(el));
          } else if (el) {
            inlineBuffer += el.outerHTML;
          } else if (node.nodeType === 3) {
            inlineBuffer += node.textContent ?? '';
          }
        });
        flushInline(inlineBuffer);
      });
    } else {
      const rows = Array.from(element.querySelectorAll('tr'));
      const tableText = rows.map((row) => {
        const cells = Array.from(row.querySelectorAll('td, th'));
        return cells.map((cell) => cell.textContent?.trim() || '').join(' | ');
      }).join('\n');

      if (tableText) {
        nodes.push({
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          children: [{
            type: 'text',
            text: `[Table]\n${tableText}`,
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1,
          }],
          direction: 'ltr',
        });
      }
    }
  }

  // Divs and other containers - process children
  else if (tagName === 'div' || tagName === 'section' || tagName === 'article') {
    Array.from(element.children).forEach((child) => {
      nodes.push(...htmlElementToLexicalNodes(child as Element));
    });
  }

  // Center element - process children and apply center alignment to block nodes
  else if (tagName === 'center') {
    const blockTags = new Set(['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'blockquote', 'table', 'hr']);
    const hasBlockChildren = Array.from(element.children).some(
      (child) => blockTags.has(child.tagName.toLowerCase()),
    );

    if (hasBlockChildren) {
      Array.from(element.children).forEach((child) => {
        const childNodes = htmlElementToLexicalNodes(child as Element);
        childNodes.forEach((n) => {
          if (n.type === 'paragraph' || n.type === 'heading') {
            // eslint-disable-next-line no-param-reassign
            n.format = 'center';
          }
          nodes.push(n);
        });
      });
    } else {
      // Inline-only content (e.g. <center><b><a>VOTE HERE</a></b></center>)
      const children = parseInlineHTML(element.innerHTML);
      if (children.length > 0) {
        nodes.push({
          type: 'paragraph',
          format: 'center',
          indent: 0,
          version: 1,
          children,
          direction: 'ltr',
        });
      }
    }
  }

  // Line breaks
  else if (tagName === 'br') {
    // Add line break as part of parent paragraph
    // This is handled by the parent element
  }

  // Unknown elements - extract text content
  else {
    const text = element.textContent?.trim();
    if (text) {
      const children = parseInlineHTML(text);
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

  return nodes;
}

/**
 * Convert HTML string to Lexical JSON structure (Enhanced Version)
 */
export function convertHtmlToLexicalEnhanced(html: string): any {
  if (!html || html.trim() === '') {
    return {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        children: [{
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          children: [{
            type: 'text',
            text: '',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1,
          }],
          direction: 'ltr',
        }],
        direction: 'ltr',
      },
    };
  }

  try {
    // Sanitize HTML first
    const sanitized = sanitizeHtml(html);

    // Parse with JSDOM
    const dom = new JSDOM(sanitized);
    const { body } = dom.window.document;

    // Convert all elements
    const children: LexicalNode[] = [];
    Array.from(body.children).forEach((element) => {
      children.push(...htmlElementToLexicalNodes(element as Element));
    });

    // Handle case where body has no children but has text
    if (children.length === 0 && body.textContent?.trim()) {
      const text = body.textContent.trim();
      children.push({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children: [{
          type: 'text',
          text,
          format: 0,
          mode: 'normal',
          style: '',
          detail: 0,
          version: 1,
        }],
        direction: 'ltr',
      });
    }

    // Ensure at least one paragraph
    if (children.length === 0) {
      children.push({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children: [{
          type: 'text',
          text: '',
          format: 0,
          mode: 'normal',
          style: '',
          detail: 0,
          version: 1,
        }],
        direction: 'ltr',
      });
    }

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
  } catch (error) {
    logger.error('Failed to convert HTML to Lexical:', error as Error);
    logger.debug(`HTML preview: ${html.substring(0, 200)}`);

    // Fallback to safe empty structure
    return {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        children: [{
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          children: [{
            type: 'text',
            text: '[Content conversion failed - see legacy HTML]',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1,
          }],
          direction: 'ltr',
        }],
        direction: 'ltr',
      },
    };
  }
}
