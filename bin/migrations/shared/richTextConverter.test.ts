import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  htmlToPortableText,
  createTextBlock,
  createLinkBlock,
} from './richTextConverter';

describe('richTextConverter', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('htmlToPortableText', () => {
    it('should handle null input', () => {
      const result = htmlToPortableText(null);
      expect(result).toHaveLength(1);
      expect(result[0]._type).toBe('block');
      expect(result[0].style).toBe('normal');
      expect(result[0].children[0].text).toBe('');
    });

    it('should handle undefined input', () => {
      const result = htmlToPortableText(undefined);
      expect(result).toHaveLength(1);
      expect(result[0].children[0].text).toBe('');
    });

    it('should handle empty string', () => {
      const result = htmlToPortableText('');
      expect(result).toHaveLength(1);
      expect(result[0].children[0].text).toBe('');
    });

    it('should handle whitespace-only string', () => {
      const result = htmlToPortableText('   ');
      expect(result).toHaveLength(1);
      expect(result[0].children[0].text).toBe('');
    });

    it('should convert plain text to a block', () => {
      const result = htmlToPortableText('Hello world');
      expect(result).toHaveLength(1);
      expect(result[0]._type).toBe('block');
      expect(result[0].style).toBe('normal');
      expect(result[0].children[0].text).toBe('Hello world');
    });

    it('should convert paragraph tags', () => {
      const result = htmlToPortableText('<p>First paragraph</p><p>Second paragraph</p>');
      expect(result).toHaveLength(2);
      expect(result[0].children[0].text).toBe('First paragraph');
      expect(result[1].children[0].text).toBe('Second paragraph');
    });

    it('should convert heading tags', () => {
      const result = htmlToPortableText('<h1>Heading One</h1>');
      expect(result).toHaveLength(1);
      expect(result[0].style).toBe('h1');
      expect(result[0].children[0].text).toBe('Heading One');
    });

    it('should convert h2 tags', () => {
      const result = htmlToPortableText('<h2>Heading Two</h2>');
      expect(result[0].style).toBe('h2');
    });

    it('should convert h3 tags', () => {
      const result = htmlToPortableText('<h3>Heading Three</h3>');
      expect(result[0].style).toBe('h3');
    });

    it('should convert blockquote tags', () => {
      const result = htmlToPortableText('<blockquote>Quote text</blockquote>');
      expect(result).toHaveLength(1);
      expect(result[0].style).toBe('blockquote');
      expect(result[0].children[0].text).toBe('Quote text');
    });

    it('should convert br tags to new blocks', () => {
      const result = htmlToPortableText('Line one<br>Line two');
      expect(result).toHaveLength(2);
      expect(result[0].children[0].text).toBe('Line one');
      expect(result[1].children[0].text).toBe('Line two');
    });

    it('should handle self-closing br tags', () => {
      const result = htmlToPortableText('Line one<br/>Line two');
      expect(result).toHaveLength(2);
    });

    it('should handle br with space', () => {
      const result = htmlToPortableText('Line one<br />Line two');
      expect(result).toHaveLength(2);
    });

    it('should convert links', () => {
      const result = htmlToPortableText('<a href="https://example.com">Click here</a>');
      expect(result).toHaveLength(1);
      expect(result[0].markDefs).toHaveLength(1);
      expect(result[0].markDefs[0]._type).toBe('link');
      expect(result[0].markDefs[0].href).toBe('https://example.com');
      expect(result[0].children[0].text).toBe('Click here');
      expect(result[0].children[0].marks).toContain(result[0].markDefs[0]._key);
    });

    it('should handle bold text with strong tag', () => {
      const result = htmlToPortableText('<strong>Bold text</strong>');
      expect(result[0].children[0].text).toBe('Bold text');
      expect(result[0].children[0].marks).toContain('strong');
    });

    it('should handle bold text with b tag', () => {
      const result = htmlToPortableText('<b>Bold text</b>');
      expect(result[0].children[0].text).toBe('Bold text');
      expect(result[0].children[0].marks).toContain('strong');
    });

    it('should handle italic text with em tag', () => {
      const result = htmlToPortableText('<em>Italic text</em>');
      expect(result[0].children[0].text).toBe('Italic text');
      expect(result[0].children[0].marks).toContain('em');
    });

    it('should handle italic text with i tag', () => {
      const result = htmlToPortableText('<i>Italic text</i>');
      expect(result[0].children[0].text).toBe('Italic text');
      expect(result[0].children[0].marks).toContain('em');
    });

    it('should decode HTML entities', () => {
      const result = htmlToPortableText('Hello &amp; World');
      expect(result[0].children[0].text).toBe('Hello & World');
    });

    it('should decode nbsp', () => {
      const result = htmlToPortableText('Hello&nbsp;World');
      expect(result[0].children[0].text).toBe('Hello World');
    });

    it('should handle mixed content', () => {
      const html = '<p>Normal text with <strong>bold</strong> and <a href="https://example.com">a link</a></p>';
      const result = htmlToPortableText(html);
      expect(result).toHaveLength(1);
      expect(result[0].children.length).toBeGreaterThan(1);
    });

    it('should normalize Windows line endings', () => {
      const result = htmlToPortableText('Line one\r\nLine two');
      // Should be treated as double newline split
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should normalize Mac line endings', () => {
      const result = htmlToPortableText('Line one\rLine two');
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should generate unique keys for blocks', () => {
      const result = htmlToPortableText('<p>One</p><p>Two</p>');
      expect(result[0]._key).not.toBe(result[1]._key);
    });

    it('should generate unique keys for children', () => {
      const result = htmlToPortableText('Text with <a href="#">link</a> and more text');
      const keys = result[0].children.map((c) => c._key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });
  });

  describe('createTextBlock', () => {
    it('should create a simple text block', () => {
      const block = createTextBlock('Hello world');
      expect(block._type).toBe('block');
      expect(block.style).toBe('normal');
      expect(block.children[0].text).toBe('Hello world');
      expect(block.markDefs).toEqual([]);
    });

    it('should create block with custom style', () => {
      const block = createTextBlock('Heading', 'h1');
      expect(block.style).toBe('h1');
    });

    it('should handle empty string', () => {
      const block = createTextBlock('');
      expect(block.children[0].text).toBe('');
    });

    it('should have unique keys', () => {
      const block1 = createTextBlock('One');
      const block2 = createTextBlock('Two');
      expect(block1._key).not.toBe(block2._key);
    });
  });

  describe('createLinkBlock', () => {
    it('should create a block with a link', () => {
      const block = createLinkBlock('Click me', 'https://example.com');
      expect(block._type).toBe('block');
      expect(block.style).toBe('normal');
      expect(block.markDefs).toHaveLength(1);
      expect(block.markDefs[0]._type).toBe('link');
      expect(block.markDefs[0].href).toBe('https://example.com');
      expect(block.children[0].text).toBe('Click me');
      expect(block.children[0].marks).toContain(block.markDefs[0]._key);
    });

    it('should have unique keys for block and markDef', () => {
      const block = createLinkBlock('Link', 'https://example.com');
      expect(block._key).not.toBe(block.markDefs[0]._key);
    });
  });
});
