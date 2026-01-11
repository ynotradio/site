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

  function processNode(node: Node): void {
    if (node.nodeType === 3) { // Text node
      const text = node.textContent || '';
      if (text.trim()) {
        nodes.push({
          type: 'text',
          text: text.replace(/\s+/g, ' '),
          format: 0,
          mode: 'normal',
          style: '',
          detail: 0,
          version: 1,
        });
      }
    } else if (node.nodeType === 1) { // Element node
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      let format = 0;
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
        const text = element.textContent || '';
        const target = element.getAttribute('target');
        
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
      } else if (format > 0) {
        const text = element.textContent || '';
        if (text.trim()) {
          nodes.push({
            type: 'text',
            text,
            format,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1,
          });
        }
      } else {
        // Process children for other elements
        Array.from(element.childNodes).forEach(processNode);
      }
    }
  }

  Array.from(dom.window.document.body.childNodes).forEach(processNode);

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
    const children = parseInlineHTML(element.innerHTML);
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
    const children = listItems.map((li) => {
      const itemChildren = parseInlineHTML(li.innerHTML);
      return {
        type: 'listitem',
        value: 1,
        checked: undefined,
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

  // Tables - simplify to paragraph with structured text
  else if (tagName === 'table') {
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

  // Divs and other containers - process children
  else if (tagName === 'div' || tagName === 'section' || tagName === 'article' || tagName === 'center') {
    Array.from(element.children).forEach((child) => {
      nodes.push(...htmlElementToLexicalNodes(child as Element));
    });
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
