/**
 * Rich Text Converter - Convert HTML to Sanity Portable Text
 */

import { createLogger } from './logger';

const logger = createLogger('RichTextConverter');

// Portable Text block types
export interface PortableTextBlock {
  _type: 'block';
  _key: string;
  style: 'normal' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'blockquote';
  markDefs: MarkDef[];
  children: PortableTextSpan[];
}

export interface PortableTextSpan {
  _type: 'span';
  _key: string;
  text: string;
  marks: string[];
}

export interface MarkDef {
  _key: string;
  _type: 'link';
  href: string;
}

/**
 * Generate a unique key for Portable Text elements
 */
function generateKey(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Strip HTML tags from content, preserving text
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Get marks (bold/italic) from HTML content
 */
function getMarks(html: string): string[] {
  const marks: string[] = [];

  if (/<(strong|b)[^>]*>/i.test(html)) {
    marks.push('strong');
  }
  if (/<(em|i)[^>]*>/i.test(html)) {
    marks.push('em');
  }

  return marks;
}

/**
 * Parse inline elements like links, bold, italic
 */
function parseInlineElements(content: string, markDefs: MarkDef[]): PortableTextSpan[] {
  const spans: PortableTextSpan[] = [];

  // Simple regex-based parsing for common patterns
  // This handles: <a>, <strong>/<b>, <em>/<i>

  // First, strip any remaining HTML tags we don't handle, preserving text content
  const text = content;

  // Process links - extract them first
  const linkRegex = /<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi;
  let lastIndex = 0;
  let match;

  const segments: Array<{ text: string; marks: string[]; linkKey?: string }> = [];

  // eslint-disable-next-line no-cond-assign
  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index);
      const strippedBefore = stripHtmlTags(beforeText);
      if (strippedBefore) {
        segments.push({ text: strippedBefore, marks: getMarks(beforeText) });
      }
    }

    // Add the link
    const linkKey = generateKey();
    markDefs.push({
      _key: linkKey,
      _type: 'link',
      href: match[1],
    });
    segments.push({
      text: stripHtmlTags(match[2]),
      marks: [linkKey, ...getMarks(match[2])],
      linkKey,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last link
  if (lastIndex < text.length) {
    const afterText = text.substring(lastIndex);
    const strippedAfter = stripHtmlTags(afterText);
    if (strippedAfter) {
      segments.push({ text: strippedAfter, marks: getMarks(afterText) });
    }
  }

  // If no segments, create one from the entire content
  if (segments.length === 0) {
    const strippedText = stripHtmlTags(text);
    segments.push({ text: strippedText, marks: getMarks(text) });
  }

  // Convert segments to spans
  segments.forEach((segment) => {
    if (segment.text) {
      spans.push({
        _type: 'span',
        _key: generateKey(),
        text: segment.text,
        marks: segment.marks,
      });
    }
  });

  // Ensure at least one span
  if (spans.length === 0) {
    spans.push({
      _type: 'span',
      _key: generateKey(),
      text: '',
      marks: [],
    });
  }

  return spans;
}

/**
 * Create a Portable Text block with proper handling of inline formatting
 */
function createBlock(
  content: string,
  style: PortableTextBlock['style'],
): PortableTextBlock {
  const markDefs: MarkDef[] = [];
  const children: PortableTextSpan[] = [];

  // Parse inline elements (links, bold, italic)
  const parsed = parseInlineElements(content, markDefs);
  children.push(...parsed);

  return {
    _type: 'block',
    _key: generateKey(),
    style,
    markDefs,
    children,
  };
}

/**
 * Parse simple HTML tags and convert to Portable Text blocks
 * This is a simplified parser for common HTML patterns in migration data
 */
export function htmlToPortableText(html: string | null | undefined): PortableTextBlock[] {
  if (!html || html.trim() === '') {
    return [{
      _type: 'block',
      _key: generateKey(),
      style: 'normal',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: generateKey(),
        text: '',
        marks: [],
      }],
    }];
  }

  logger.debug(`Converting HTML to Portable Text: ${html.substring(0, 100)}...`);

  const blocks: PortableTextBlock[] = [];

  // Normalize line breaks
  let content = html
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Replace <br> and <br/> tags with newlines
  content = content.replace(/<br\s*\/?>/gi, '\n');

  // Split by paragraph tags or double newlines
  const paragraphs = content
    .split(/<\/?p[^>]*>/gi)
    .flatMap((p) => p.split(/\n\n+/))
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) {
    // Return empty block if no content
    return [{
      _type: 'block',
      _key: generateKey(),
      style: 'normal',
      markDefs: [],
      children: [{
        _type: 'span',
        _key: generateKey(),
        text: '',
        marks: [],
      }],
    }];
  }

  paragraphs.forEach((paragraph) => {
    // Check for heading tags
    const headingMatch = paragraph.match(/^<h([1-6])[^>]*>(.*?)<\/h[1-6]>$/i);
    if (headingMatch) {
      const level = parseInt(headingMatch[1], 10);
      const headingContent = headingMatch[2];
      const block = createBlock(headingContent, `h${level}` as PortableTextBlock['style']);
      blocks.push(block);
      return;
    }

    // Check for blockquote
    const blockquoteMatch = paragraph.match(/^<blockquote[^>]*>([\s\S]*?)<\/blockquote>$/i);
    if (blockquoteMatch) {
      const quoteContent = blockquoteMatch[1];
      const block = createBlock(quoteContent, 'blockquote');
      blocks.push(block);
      return;
    }

    // Handle newlines within paragraphs - each line becomes a block
    const lines = paragraph.split('\n').filter((line) => line.trim().length > 0);
    lines.forEach((line) => {
      const block = createBlock(line, 'normal');
      blocks.push(block);
    });
  });

  return blocks.length > 0 ? blocks : [{
    _type: 'block',
    _key: generateKey(),
    style: 'normal',
    markDefs: [],
    children: [{
      _type: 'span',
      _key: generateKey(),
      text: '',
      marks: [],
    }],
  }];
}

/**
 * Create a simple text block (no HTML parsing)
 */
export function createTextBlock(
  text: string,
  style: PortableTextBlock['style'] = 'normal',
): PortableTextBlock {
  return {
    _type: 'block',
    _key: generateKey(),
    style,
    markDefs: [],
    children: [{
      _type: 'span',
      _key: generateKey(),
      text: text || '',
      marks: [],
    }],
  };
}

/**
 * Create a block with a link
 */
export function createLinkBlock(text: string, href: string): PortableTextBlock {
  const linkKey = generateKey();
  return {
    _type: 'block',
    _key: generateKey(),
    style: 'normal',
    markDefs: [{
      _key: linkKey,
      _type: 'link',
      href,
    }],
    children: [{
      _type: 'span',
      _key: generateKey(),
      text,
      marks: [linkKey],
    }],
  };
}
