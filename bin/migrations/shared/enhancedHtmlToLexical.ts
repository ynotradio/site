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
import type { Payload } from 'payload';
import { createLogger } from './logger';
import { migrationConfig } from '../config';
import { importImageFromUrl } from './mediaImporter';

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
      'src', 'alt', 'width', 'height', 'align',
      'class', 'id',
      'value',
      'data-*',
      // Legacy markup floats images via inline style rather than the align
      // attribute (e.g. `<a style="float: right;"><img/></a>` artist
      // thumbnails). DOMPurify sanitizes the CSS value itself (strips
      // javascript:/expression() etc.); this converter only ever reads
      // `float` back out of it, never re-emits the raw attribute.
      'style',
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
 * True for an <a> whose only meaningful content is an <img> (e.g. legacy
 * `<a href="artist site"><img .../></a>` thumbnails). These need block-level
 * handling: parseInlineHTML's <a> case only produces inline children, and
 * Lexical's upload node has no link-wrapper field to hold the href.
 */
function isImageOnlyAnchor(el: Element): boolean {
  return el.tagName.toLowerCase() === 'a' && el.querySelector('img') !== null && !el.textContent?.trim();
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
        if (el && (blockTags.has(el.tagName.toLowerCase()) || isImageOnlyAnchor(el))) {
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

  // Anchor wrapping only an image (e.g. legacy `<a href="artist site"
  // style="float: right;"><img .../></a>` thumbnails). Lexical's upload node
  // has no link-wrapper field, and parseInlineHTML's <a> handling only
  // produces inline (text) children, so an <img> child there is silently
  // dropped. Treat this as an image block instead -- losing the click-through
  // is preferable to losing the photo entirely.
  else if (isImageOnlyAnchor(element)) {
    const img = element.querySelector('img');
    if (img) {
      // The <img> itself rarely carries alignment; legacy markup puts the
      // float on the wrapping <a> instead (`style="float: right;"`), which
      // htmlElementToLexicalNodes(img) can't see since it only inspects the
      // element it's handed. Copy it onto the <img> before recursing so the
      // upload node's alignment field ends up correct.
      if (!img.getAttribute('align')) {
        const anchorFloat = (element as HTMLElement).style?.float
          || (element.getAttribute('style')?.match(/float:\s*(left|right)/)?.[1] ?? '');
        if (anchorFloat === 'left' || anchorFloat === 'right') {
          img.setAttribute('align', anchorFloat);
        }
      }
      nodes.push(...htmlElementToLexicalNodes(img));
    }
  }

  // Images. Emits a *pending* upload node (value: null, legacy src/alt/width/
  // height kept as scratch data) — resolveImageUploads() below does the
  // actual async download-and-upload pass and turns this into a real
  // `value: <media id>` reference. Payload's own upload node has no `src`;
  // that's just how this converter tracks "still needs an upload."
  else if (tagName === 'img') {
    const src = element.getAttribute('src') || '';
    // Media.alt is a required field; legacy <img> tags frequently have no
    // alt attribute at all (e.g. decorative artist thumbnails), so fall
    // back to a generic description rather than an empty string that's
    // guaranteed to fail validation on import.
    const alt = element.getAttribute('alt') || 'Image';
    const width = element.getAttribute('width');
    const height = element.getAttribute('height');
    const align = element.getAttribute('align');
    const alignment = align === 'left' || align === 'right' || align === 'center' ? align : undefined;

    if (src) {
      nodes.push({
        type: 'upload',
        value: null,
        relationTo: 'media',
        format: '',
        version: 1,
        fields: alignment ? { alignment } : undefined,
        // Scratch data consumed by resolveImageUploads(); not part of the
        // final Payload upload node shape.
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
          if (el && (blockTags.has(el.tagName.toLowerCase()) || isImageOnlyAnchor(el))) {
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
      // Genuinely tabular text data (no images/embeds in any cell) — emit a
      // real table/tablerow/tablecell structure so it's an editable Lexical
      // table (TableFeature) rather than a flattened text blob.
      const rows = Array.from(element.querySelectorAll('tr'));
      const tableRows = rows
        .map((row) => {
          const cells = Array.from(row.querySelectorAll('td, th'));
          const cellNodes = cells
            .filter((cell) => (cell.textContent ?? '').trim() !== '')
            .map((cell) => ({
              type: 'tablecell',
              version: 1,
              headerState: cell.tagName.toLowerCase() === 'th' ? 1 : 0,
              colSpan: 1,
              rowSpan: 1,
              children: [{
                type: 'paragraph',
                format: '',
                indent: 0,
                version: 1,
                children: parseInlineHTML((cell.textContent ?? '').trim()),
                direction: 'ltr',
              }],
              direction: 'ltr',
              format: '',
              indent: 0,
            }));

          if (cellNodes.length === 0) {
            return null;
          }
          return {
            type: 'tablerow',
            version: 1,
            children: cellNodes,
            direction: 'ltr',
            format: '',
            indent: 0,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);

      if (tableRows.length > 0) {
        nodes.push({
          type: 'table',
          version: 1,
          children: tableRows,
          direction: 'ltr',
          format: '',
          indent: 0,
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
    const blockTags = new Set(['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'blockquote', 'table', 'hr', 'iframe', 'img']);
    const hasBlockChildren = Array.from(element.children).some(
      (child) => blockTags.has(child.tagName.toLowerCase()) || isImageOnlyAnchor(child),
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

  // Bare inline-formatting tags at block level (e.g. a whole paragraph's
  // content wrapped in a single <i>...</i>, which happens when an unclosed
  // <center> upstream causes the HTML parser to nest content one level
  // deeper than the source markup intended). These have no dedicated block
  // case, so they used to fall into the generic "unknown element" branch
  // below, which reads .textContent (tags already stripped) and lost any
  // nested links/formatting. Route through parseInlineHTML on the innerHTML
  // instead, same as the <p>/<center> inline-only branches do.
  else if (['i', 'em', 'b', 'strong', 's', 'strike', 'u', 'code', 'span'].includes(tagName)) {
    const children = parseInlineHTML(element.outerHTML);
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

    // Convert all elements. Legacy markup frequently has loose inline
    // content (bare text, <a>, <b>, <i>, <br>) directly under <body> with no
    // wrapping <p> -- walking body.children alone would silently drop that
    // prose (text nodes aren't Elements) or mis-handle bare inline tags
    // (which fall through to the "unknown element" branch and lose their
    // surrounding text). Buffer consecutive inline/text siblings into a
    // paragraph, same as the <p> handler already does for nested block
    // content, and only recurse per-node for genuine block-level tags.
    const children: LexicalNode[] = [];
    const topBlockTags = new Set([
      'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'blockquote', 'table', 'hr', 'iframe', 'img', 'center',
    ]);
    let inlineBuffer = '';
    const flushInlineBuffer = () => {
      const inline = parseInlineHTML(inlineBuffer);
      inlineBuffer = '';
      if (inline.length > 0) {
        children.push({
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          children: inline,
          direction: 'ltr',
        });
      }
    };
    // A double <br><br> is the legacy convention for a paragraph break (the
    // real content has no <p> tags at all, just prose separated this way).
    // Track a run of consecutive <br> siblings so two-in-a-row flushes the
    // buffer as its own paragraph instead of being appended as literal tags.
    let consecutiveBrCount = 0;
    Array.from(body.childNodes).forEach((node) => {
      const el = node.nodeType === 1 ? (node as Element) : null;
      const isBr = el?.tagName.toLowerCase() === 'br';
      if (el && (topBlockTags.has(el.tagName.toLowerCase()) || isImageOnlyAnchor(el))) {
        flushInlineBuffer();
        children.push(...htmlElementToLexicalNodes(el));
        consecutiveBrCount = 0;
      } else if (isBr) {
        consecutiveBrCount += 1;
        if (consecutiveBrCount >= 2) {
          flushInlineBuffer();
          consecutiveBrCount = 0;
        }
      } else if (el) {
        inlineBuffer += el.outerHTML;
        consecutiveBrCount = 0;
      } else if (node.nodeType === 3) {
        inlineBuffer += node.textContent ?? '';
        if (node.textContent?.trim()) consecutiveBrCount = 0;
      }
    });
    flushInlineBuffer();

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

/**
 * Resolve a single pending upload node (value: null, src set) into a real
 * Payload Media reference by downloading and uploading it via the same
 * importImageFromUrl helper used for the Pages `headerImage` import. Returns
 * null when the import fails, so the caller can drop the node rather than
 * leave a broken reference (mirrors the graceful-degradation behavior for
 * headerImage).
 */
async function resolvePendingUploadNode(
  payload: Payload,
  node: LexicalNode,
): Promise<LexicalNode | null> {
  const result = await importImageFromUrl(payload, node.src, {
    alt: typeof node.alt === 'string' ? node.alt : '',
    legacyUrl: node.src,
  });

  if (!result.success || !result.mediaId) {
    logger.warn(`Dropping inline image (import failed): ${node.src} — ${result.error}`);
    return null;
  }

  return {
    type: 'upload',
    version: 3,
    relationTo: typeof node.relationTo === 'string' ? node.relationTo : 'media',
    value: result.mediaId,
    ...(node.fields ? { fields: node.fields } : {}),
  };
}

async function resolveNodeListImageUploads(
  payload: Payload,
  nodes: LexicalNode[],
): Promise<LexicalNode[]> {
  const resolved: LexicalNode[] = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const node of nodes) {
    const isPendingUpload = node.type === 'upload' && node.value === null && typeof node.src === 'string';

    if (isPendingUpload) {
      // eslint-disable-next-line no-await-in-loop
      const resolvedNode = await resolvePendingUploadNode(payload, node);
      if (resolvedNode) {
        resolved.push(resolvedNode);
      }
    } else {
      if (Array.isArray(node.children)) {
        // eslint-disable-next-line no-await-in-loop
        node.children = await resolveNodeListImageUploads(payload, node.children);
      }
      resolved.push(node);
    }
  }

  return resolved;
}

/**
 * Resolve every pending `upload` node emitted for an <img> tag (value: null,
 * with the original src/alt kept as scratch data) into a real Payload Media
 * reference. Returns a new document; does not mutate the input.
 */
export async function resolveImageUploads(payload: Payload, lexicalData: any): Promise<any> {
  const children = lexicalData?.root?.children;
  if (!Array.isArray(children)) {
    return lexicalData;
  }
  const resolvedChildren = await resolveNodeListImageUploads(payload, children);
  return { ...lexicalData, root: { ...lexicalData.root, children: resolvedChildren } };
}
