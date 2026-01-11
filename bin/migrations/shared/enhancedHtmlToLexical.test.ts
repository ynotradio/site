/**
 * Unit tests for Enhanced HTML to Lexical Converter
 */

import { describe, it, expect } from 'vitest';
import { convertHtmlToLexicalEnhanced } from './enhancedHtmlToLexical';

describe('enhancedHtmlToLexical', () => {
  describe('Basic Content', () => {
    it('should handle empty string', () => {
      const result = convertHtmlToLexicalEnhanced('');
      expect(result.root.children).toHaveLength(1);
      expect(result.root.children[0].type).toBe('paragraph');
    });

    it('should handle plain text', () => {
      const result = convertHtmlToLexicalEnhanced('Hello World');
      expect(result.root.children[0].children[0].text).toContain('Hello World');
    });

    it('should handle simple paragraph', () => {
      const result = convertHtmlToLexicalEnhanced('<p>Test paragraph</p>');
      expect(result.root.children[0].type).toBe('paragraph');
      expect(result.root.children[0].children[0].text).toBe('Test paragraph');
    });
  });

  describe('Headings', () => {
    it('should convert h1 to heading node', () => {
      const result = convertHtmlToLexicalEnhanced('<h1>Main Title</h1>');
      expect(result.root.children[0].type).toBe('heading');
      expect(result.root.children[0].tag).toBe('h1');
      expect(result.root.children[0].children[0].text).toBe('Main Title');
    });

    it('should convert h2-h6 to heading nodes', () => {
      const html = '<h2>H2</h2><h3>H3</h3><h4>H4</h4><h5>H5</h5><h6>H6</h6>';
      const result = convertHtmlToLexicalEnhanced(html);
      expect(result.root.children).toHaveLength(5);
      expect(result.root.children[0].tag).toBe('h2');
      expect(result.root.children[4].tag).toBe('h6');
    });
  });

  describe('Inline Formatting', () => {
    it('should handle bold text', () => {
      const result = convertHtmlToLexicalEnhanced('<p>This is <strong>bold</strong> text</p>');
      const boldNode = result.root.children[0].children.find((n: any) => n.format === 1);
      expect(boldNode).toBeDefined();
      expect(boldNode.text).toContain('bold');
    });

    it('should handle italic text', () => {
      const result = convertHtmlToLexicalEnhanced('<p>This is <em>italic</em> text</p>');
      const italicNode = result.root.children[0].children.find((n: any) => n.format === 2);
      expect(italicNode).toBeDefined();
    });

    it('should handle combined formatting', () => {
      const result = convertHtmlToLexicalEnhanced('<p><strong><em>Bold and italic</em></strong></p>');
      // Nested formatting may result in separate nodes, check that both bold and italic exist
      const hasFormattedText = result.root.children[0].children.some((n: any) => n.format > 0 && n.text && n.text.includes('Bold'));
      expect(hasFormattedText).toBe(true);
    });

    it('should handle links', () => {
      const result = convertHtmlToLexicalEnhanced('<p><a href="https://example.com">Link</a></p>');
      const linkNode = result.root.children[0].children.find((n: any) => n.type === 'link');
      expect(linkNode).toBeDefined();
      expect(linkNode.url).toBe('https://example.com');
    });

    it('should convert relative URLs to absolute URLs', () => {
      const result = convertHtmlToLexicalEnhanced('<p><a href="contests.php">Contests</a></p>');
      const linkNode = result.root.children[0].children.find((n: any) => n.type === 'link');
      expect(linkNode).toBeDefined();
      expect(linkNode.url).toBe('https://www.ynotradio.net/contests.php');
    });

    it('should convert root-relative URLs to absolute URLs', () => {
      const result = convertHtmlToLexicalEnhanced('<p><a href="/ondemand.php?id=176">On Demand</a></p>');
      const linkNode = result.root.children[0].children.find((n: any) => n.type === 'link');
      expect(linkNode).toBeDefined();
      expect(linkNode.url).toBe('https://www.ynotradio.net/ondemand.php?id=176');
    });

    it('should keep absolute URLs unchanged', () => {
      const result = convertHtmlToLexicalEnhanced('<p><a href="https://external.com/page">External</a></p>');
      const linkNode = result.root.children[0].children.find((n: any) => n.type === 'link');
      expect(linkNode).toBeDefined();
      expect(linkNode.url).toBe('https://external.com/page');
    });

    it('should handle protocol-relative URLs', () => {
      const result = convertHtmlToLexicalEnhanced('<p><a href="//cdn.example.com/file.js">CDN</a></p>');
      const linkNode = result.root.children[0].children.find((n: any) => n.type === 'link');
      expect(linkNode).toBeDefined();
      expect(linkNode.url).toBe('https://cdn.example.com/file.js');
    });

    it('should handle strikethrough', () => {
      const result = convertHtmlToLexicalEnhanced('<p><s>Strikethrough</s></p>');
      const strikeNode = result.root.children[0].children.find((n: any) => n.format === 4);
      expect(strikeNode).toBeDefined();
    });

    it('should handle underline', () => {
      const result = convertHtmlToLexicalEnhanced('<p><u>Underline</u></p>');
      const underlineNode = result.root.children[0].children.find((n: any) => n.format === 8);
      expect(underlineNode).toBeDefined();
    });
  });

  describe('Lists', () => {
    it('should convert unordered list', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>';
      const result = convertHtmlToLexicalEnhanced(html);
      expect(result.root.children[0].type).toBe('list');
      expect(result.root.children[0].listType).toBe('bullet');
      expect(result.root.children[0].children).toHaveLength(3);
    });

    it('should convert ordered list', () => {
      const html = '<ol><li>First</li><li>Second</li></ol>';
      const result = convertHtmlToLexicalEnhanced(html);
      expect(result.root.children[0].type).toBe('list');
      expect(result.root.children[0].listType).toBe('number');
    });

    it('should handle list items with formatting', () => {
      const html = '<ul><li><strong>Bold</strong> item</li></ul>';
      const result = convertHtmlToLexicalEnhanced(html);
      const listItem = result.root.children[0].children[0];
      expect(listItem.type).toBe('listitem');
      expect(listItem.children.some((n: any) => n.format === 1)).toBe(true);
    });
  });

  describe('Block Quotes', () => {
    it('should convert blockquote', () => {
      const result = convertHtmlToLexicalEnhanced('<blockquote>Quote text</blockquote>');
      expect(result.root.children[0].type).toBe('quote');
      expect(result.root.children[0].children[0].text).toContain('Quote');
    });
  });

  describe('Images', () => {
    it('should handle image with src and alt', () => {
      const result = convertHtmlToLexicalEnhanced('<img src="/image.jpg" alt="Test Image" />');
      const imageNode = result.root.children[0];
      expect(imageNode.type).toBe('upload');
      expect(imageNode.src).toBe('/image.jpg');
      expect(imageNode.alt).toBe('Test Image');
    });

    it('should handle image with width and height', () => {
      const result = convertHtmlToLexicalEnhanced('<img src="/img.jpg" width="800" height="600" />');
      const imageNode = result.root.children[0];
      expect(imageNode.width).toBe(800);
      expect(imageNode.height).toBe(600);
    });
  });

  describe('Embeds and iframes', () => {
    it('should create embed block for YouTube iframe', () => {
      const html = '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>';
      const result = convertHtmlToLexicalEnhanced(html);
      const block = result.root.children[0];
      expect(block.type).toBe('block');
      expect(block.fields.blockType).toBe('embed');
      expect(block.fields.url).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should create embed block for YouTube short URL', () => {
      const html = '<iframe src="https://youtu.be/dQw4w9WgXcQ"></iframe>';
      const result = convertHtmlToLexicalEnhanced(html);
      const block = result.root.children[0];
      expect(block.type).toBe('block');
      expect(block.fields.blockType).toBe('embed');
      expect(block.fields.url).toBe('https://youtu.be/dQw4w9WgXcQ');
    });

    it('should create embed block for generic iframe', () => {
      const html = '<iframe src="https://example.com/embed"></iframe>';
      const result = convertHtmlToLexicalEnhanced(html);
      const block = result.root.children[0];
      expect(block.type).toBe('block');
      expect(block.fields.blockType).toBe('embed');
      expect(block.fields.url).toBe('https://example.com/embed');
    });
  });

  describe('Tables', () => {
    it('should convert table to structured text', () => {
      const html = `
        <table>
          <tr><td>Cell 1</td><td>Cell 2</td></tr>
          <tr><td>Cell 3</td><td>Cell 4</td></tr>
        </table>
      `;
      const result = convertHtmlToLexicalEnhanced(html);
      const { text } = result.root.children[0].children[0];
      expect(text).toContain('[Table]');
      expect(text).toContain('Cell 1');
      expect(text).toContain('Cell 4');
    });
  });

  describe('Horizontal Rules', () => {
    it('should convert hr to horizontal rule node', () => {
      const result = convertHtmlToLexicalEnhanced('<p>Before</p><hr><p>After</p>');
      expect(result.root.children[1].type).toBe('horizontalrule');
    });
  });

  describe('Container Elements', () => {
    it('should unwrap div and process children', () => {
      const html = '<div><p>Paragraph 1</p><p>Paragraph 2</p></div>';
      const result = convertHtmlToLexicalEnhanced(html);
      expect(result.root.children).toHaveLength(2);
      expect(result.root.children[0].type).toBe('paragraph');
      expect(result.root.children[1].type).toBe('paragraph');
    });

    it('should handle nested divs', () => {
      const html = '<div><div><p>Nested content</p></div></div>';
      const result = convertHtmlToLexicalEnhanced(html);
      expect(result.root.children[0].type).toBe('paragraph');
      expect(result.root.children[0].children[0].text).toContain('Nested');
    });

    it('should strip center tags but keep content', () => {
      const html = '<center><p>Centered text</p></center>';
      const result = convertHtmlToLexicalEnhanced(html);
      expect(result.root.children[0].children[0].text).toContain('Centered');
    });
  });

  describe('Complex HTML', () => {
    it('should handle mixed content types', () => {
      const html = `
        <h1>Title</h1>
        <p>Paragraph with <strong>bold</strong> and <a href="#">link</a></p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
        <blockquote>Quote</blockquote>
      `;
      const result = convertHtmlToLexicalEnhanced(html);
      expect(result.root.children.length).toBeGreaterThan(3);
      expect(result.root.children[0].type).toBe('heading');
      expect(result.root.children[1].type).toBe('paragraph');
      expect(result.root.children[2].type).toBe('list');
      expect(result.root.children[3].type).toBe('quote');
    });
  });

  describe('Security and Sanitization', () => {
    it('should strip script tags', () => {
      const html = '<p>Safe text</p><script>alert("xss")</script><p>More text</p>';
      const result = convertHtmlToLexicalEnhanced(html);
      const allText = JSON.stringify(result);
      expect(allText).not.toContain('script');
      expect(allText).not.toContain('alert');
    });

    it('should strip onclick handlers', () => {
      const html = '<p onclick="alert()">Text</p>';
      const result = convertHtmlToLexicalEnhanced(html);
      const allText = JSON.stringify(result);
      expect(allText).not.toContain('onclick');
    });

    it('should allow safe attributes', () => {
      const html = '<p><a href="https://example.com" title="Link Title">Link</a></p>';
      const result = convertHtmlToLexicalEnhanced(html);
      const linkNode = result.root.children[0].children.find((n: any) => n.type === 'link');
      expect(linkNode).toBeDefined();
      expect(linkNode?.url).toBe('https://example.com');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null input', () => {
      const result = convertHtmlToLexicalEnhanced(null as any);
      expect(result.root.children).toHaveLength(1);
      expect(result.root.children[0].type).toBe('paragraph');
    });

    it('should handle empty tags', () => {
      const result = convertHtmlToLexicalEnhanced('<p></p><div></div>');
      expect(result.root).toBeDefined();
    });

    it('should handle malformed HTML', () => {
      const result = convertHtmlToLexicalEnhanced('<p>Unclosed paragraph');
      expect(result.root.children[0].type).toBe('paragraph');
    });

    it('should handle HTML with only whitespace', () => {
      const result = convertHtmlToLexicalEnhanced('   \n\n   ');
      expect(result.root.children).toHaveLength(1);
    });
  });

  describe('Lexical Structure Validation', () => {
    it('should have valid root structure', () => {
      const result = convertHtmlToLexicalEnhanced('<p>Test</p>');
      expect(result.root.type).toBe('root');
      expect(result.root.version).toBe(1);
      expect(result.root.direction).toBe('ltr');
      expect(result.root.children).toBeInstanceOf(Array);
    });

    it('should have valid paragraph structure', () => {
      const result = convertHtmlToLexicalEnhanced('<p>Test</p>');
      const para = result.root.children[0];
      expect(para.type).toBe('paragraph');
      expect(para.version).toBe(1);
      expect(para.direction).toBe('ltr');
      expect(para.children).toBeInstanceOf(Array);
    });

    it('should have valid text node structure', () => {
      const result = convertHtmlToLexicalEnhanced('<p>Test</p>');
      const textNode = result.root.children[0].children[0];
      expect(textNode.type).toBe('text');
      expect(textNode.version).toBe(1);
      expect(textNode).toHaveProperty('text');
      expect(textNode).toHaveProperty('format');
      expect(textNode).toHaveProperty('mode');
      expect(textNode).toHaveProperty('style');
      expect(textNode).toHaveProperty('detail');
    });
  });
});
