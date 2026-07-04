/**
 * Unit tests for Enhanced HTML to Lexical Converter
 */

import { describe, it, expect, vi } from 'vitest';
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

    it('should preserve link when wrapped in bold tag', () => {
      const result = convertHtmlToLexicalEnhanced(
        '<p><b><a href="https://example.com/vote">VOTE HERE</a></b></p>',
      );
      const linkNode = result.root.children[0].children.find((n: any) => n.type === 'link');
      expect(linkNode).toBeDefined();
      expect(linkNode.fields.url).toBe('https://example.com/vote');
      // The link text should inherit bold format from the wrapping <b>
      expect(linkNode.children[0].format).toBe(1);
      expect(linkNode.children[0].text).toBe('VOTE HERE');
    });

    it('should preserve link when wrapped in italic tag', () => {
      const result = convertHtmlToLexicalEnhanced(
        '<p><em><a href="https://example.com">italic link</a></em></p>',
      );
      const linkNode = result.root.children[0].children.find((n: any) => n.type === 'link');
      expect(linkNode).toBeDefined();
      expect(linkNode.children[0].format).toBe(2); // italic
    });

    it('should preserve formatting nested inside a link', () => {
      const result = convertHtmlToLexicalEnhanced(
        '<p><a href="https://example.com/album"><em>Album Title</em></a></p>',
      );
      const linkNode = result.root.children[0].children.find((n: any) => n.type === 'link');
      expect(linkNode).toBeDefined();
      expect(linkNode.children[0].text).toBe('Album Title');
      expect(linkNode.children[0].format).toBe(2); // italic from <em> inside <a>
    });

    it('should preserve whitespace between a link and following text', () => {
      const result = convertHtmlToLexicalEnhanced(
        '<p><a href="https://example.com/album">Album</a> by The Band.</p>',
      );
      const { children } = result.root.children[0];
      const trailing = children[children.length - 1];
      expect(trailing.type).toBe('text');
      expect(trailing.text).toBe(' by The Band.');
    });

    it('should handle combined formatting', () => {
      const result = convertHtmlToLexicalEnhanced(
        '<p><strong><em>Bold and italic</em></strong></p>',
      );
      // Nested formatting may result in separate nodes, check that both bold and italic exist
      const hasFormattedText = result.root.children[0].children.some(
        (n: any) => n.format > 0 && n.text && n.text.includes('Bold'),
      );
      expect(hasFormattedText).toBe(true);
    });

    it('should handle links', () => {
      const result = convertHtmlToLexicalEnhanced('<p><a href="https://example.com">Link</a></p>');
      const linkNode = result.root.children[0].children.find((n: any) => n.type === 'link');
      expect(linkNode).toBeDefined();
      expect(linkNode.fields.url).toBe('https://example.com');
    });

    it('should convert relative URLs to absolute URLs', () => {
      const result = convertHtmlToLexicalEnhanced('<p><a href="contests.php">Contests</a></p>');
      const linkNode = result.root.children[0].children.find((n: any) => n.type === 'link');
      expect(linkNode).toBeDefined();
      expect(linkNode.fields.url).toBe('https://www.ynotradio.net/contests.php');
    });

    it('should convert root-relative URLs to absolute URLs', () => {
      const result = convertHtmlToLexicalEnhanced(
        '<p><a href="/ondemand.php?id=176">On Demand</a></p>',
      );
      const linkNode = result.root.children[0].children.find((n: any) => n.type === 'link');
      expect(linkNode).toBeDefined();
      expect(linkNode.fields.url).toBe('https://www.ynotradio.net/ondemand.php?id=176');
    });

    it('should keep absolute URLs unchanged', () => {
      const result = convertHtmlToLexicalEnhanced(
        '<p><a href="https://external.com/page">External</a></p>',
      );
      const linkNode = result.root.children[0].children.find((n: any) => n.type === 'link');
      expect(linkNode).toBeDefined();
      expect(linkNode.fields.url).toBe('https://external.com/page');
    });

    it('should handle protocol-relative URLs', () => {
      const result = convertHtmlToLexicalEnhanced(
        '<p><a href="//cdn.example.com/file.js">CDN</a></p>',
      );
      const linkNode = result.root.children[0].children.find((n: any) => n.type === 'link');
      expect(linkNode).toBeDefined();
      expect(linkNode.fields.url).toBe('https://cdn.example.com/file.js');
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

    it('should set a numeric indent on every list item (Lexical rejects null/undefined)', () => {
      // Regression test: listitem nodes without `indent` crashed the Payload
      // admin editor with "Invalid indent value" on real imported pages that
      // used <li value="N"> for tied countdown rankings.
      const html = '<ol><li>First</li><li>Second</li></ol>';
      const result = convertHtmlToLexicalEnhanced(html);
      const listItems = result.root.children[0].children;
      listItems.forEach((item: any) => {
        expect(typeof item.indent).toBe('number');
      });
    });

    it('should use an explicit li value attribute as the listitem value', () => {
      const html = '<ol><li value="7">Tied for 7th</li><li value="7">Also tied for 7th</li></ol>';
      const result = convertHtmlToLexicalEnhanced(html);
      const [first, second] = result.root.children[0].children;
      expect(first.value).toBe(7);
      expect(second.value).toBe(7);
    });

    it('should fall back to positional numbering when li has no value attribute', () => {
      const html = '<ol><li>First</li><li>Second</li></ol>';
      const result = convertHtmlToLexicalEnhanced(html);
      const [first, second] = result.root.children[0].children;
      expect(first.value).toBe(1);
      expect(second.value).toBe(2);
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
      const result = convertHtmlToLexicalEnhanced(
        '<img src="/img.jpg" width="800" height="600" />',
      );
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

    it('should preserve iframe embeds inside table cells instead of flattening', () => {
      // Legacy layout tables wrap embeds in cells (e.g. y100-rocks playlist).
      const html = `
        <table><tr><td>
          <b>Track A</b><br>
          <iframe src="https://www.opendrive.com/player/111"></iframe><br><br>
          <b>Track B</b><br>
          <iframe src="https://www.opendrive.com/player/222"></iframe>
        </td></tr></table>
      `;
      const result = convertHtmlToLexicalEnhanced(html);
      const embeds = result.root.children.filter(
        (n: any) => n.type === 'block' && n.fields?.blockType === 'embed',
      );
      expect(embeds).toHaveLength(2);
      expect(embeds[0].fields.url).toBe('https://www.opendrive.com/player/111');
      expect(embeds[1].fields.url).toBe('https://www.opendrive.com/player/222');
    });

    it('should preserve embeds when a table of iframes is nested inside a <p>', () => {
      // Invalid-but-rendered legacy markup: <p><table>…iframes…</table></p>.
      const html = '<p><table><tr><td>'
        + '<iframe src="https://www.opendrive.com/player/333"></iframe>'
        + '</td></tr></table></p>';
      const result = convertHtmlToLexicalEnhanced(html);
      const embeds = result.root.children.filter(
        (n: any) => n.type === 'block' && n.fields?.blockType === 'embed',
      );
      expect(embeds).toHaveLength(1);
      expect(embeds[0].fields.url).toBe('https://www.opendrive.com/player/333');
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

    it('should set format:center on paragraph inside <center> tag', () => {
      const html = '<center><p>Centered text</p></center>';
      const result = convertHtmlToLexicalEnhanced(html);
      expect(result.root.children[0].children[0].text).toContain('Centered');
      expect(result.root.children[0].format).toBe('center');
    });

    it('should create centered paragraph for inline content directly in <center>', () => {
      const html = '<center><b><a href="https://example.com/vote">VOTE HERE</a></b></center>';
      const result = convertHtmlToLexicalEnhanced(html);
      expect(result.root.children[0].format).toBe('center');
      const linkNode = result.root.children[0].children.find((n: any) => n.type === 'link');
      expect(linkNode).toBeDefined();
      expect(linkNode.fields.url).toBe('https://example.com/vote');
      // Link text should carry the bold format inherited from the wrapping <b>
      expect(linkNode.children[0].format).toBe(1);
    });

    it('should apply format:center to heading inside <center>', () => {
      const html = '<center><h2>Centered heading</h2></center>';
      const result = convertHtmlToLexicalEnhanced(html);
      expect(result.root.children[0].type).toBe('heading');
      expect(result.root.children[0].format).toBe('center');
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
      expect(linkNode?.fields.url).toBe('https://example.com');
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

  describe('Line Breaks', () => {
    it('should not crash on top-level br element', () => {
      const result = convertHtmlToLexicalEnhanced('<br/>');
      expect(result.root).toBeDefined();
      expect(result.root.type).toBe('root');
    });

    it('should handle br inside a paragraph without crashing', () => {
      const result = convertHtmlToLexicalEnhanced('<p>before<br/>after</p>');
      expect(result.root.children[0].type).toBe('paragraph');
    });
  });

  describe('parseInlineHTML fallback', () => {
    it('should handle paragraph containing only an empty bold tag', () => {
      // <p><b></b></p>: parseInlineHTML('<b></b>') produces no nodes (empty formatted element)
      // but html.trim() is truthy, triggering the fallback path
      const result = convertHtmlToLexicalEnhanced('<p><b></b></p>');
      expect(result.root).toBeDefined();
      expect(result.root.type).toBe('root');
    });

    it('should handle paragraph containing only empty formatting tags', () => {
      const result = convertHtmlToLexicalEnhanced('<p><strong></strong><em></em></p>');
      expect(result.root).toBeDefined();
    });

    it('should handle paragraph with only a void element', () => {
      // <img> inside a paragraph: parseInlineHTML('<img src="...">') produces no nodes
      const result = convertHtmlToLexicalEnhanced('<p><img src="/test.jpg" alt=""/></p>');
      expect(result.root).toBeDefined();
    });
  });

  describe('Unknown Elements', () => {
    it('should extract text content from unknown block elements', () => {
      const result = convertHtmlToLexicalEnhanced('<footer>Footer content</footer>');
      expect(result.root.children[0].type).toBe('paragraph');
      expect(result.root.children[0].children[0].text).toBe('Footer content');
    });

    it('should extract plain text from unknown elements with inline formatting', () => {
      const result = convertHtmlToLexicalEnhanced('<aside><strong>Important</strong></aside>');
      expect(result.root.children[0].type).toBe('paragraph');
      // textContent strips HTML tags, so text is extracted as plain text
      const textNode = result.root.children[0].children.find((n: any) => n.text === 'Important');
      expect(textNode).toBeDefined();
    });

    it('should silently skip unknown elements with no text content', () => {
      const result = convertHtmlToLexicalEnhanced('<aside></aside>');
      expect(result.root).toBeDefined();
      expect(result.root.type).toBe('root');
    });

    it('should silently skip unknown elements with only whitespace', () => {
      const result = convertHtmlToLexicalEnhanced('<nav>   </nav>');
      expect(result.root).toBeDefined();
      expect(result.root.type).toBe('root');
    });
  });

  describe('Code Formatting', () => {
    it('should apply code format (16) to <code> inline element', () => {
      const result = convertHtmlToLexicalEnhanced('<p>Use <code>console.log()</code> here</p>');
      const codeNode = result.root.children[0].children.find((n: any) => n.format === 16);
      expect(codeNode).toBeDefined();
      expect(codeNode.text).toContain('console.log()');
    });

    it('should apply combined bold+code format when nested', () => {
      const result = convertHtmlToLexicalEnhanced('<p><strong><code>boldCode</code></strong></p>');
      // bold=1, code=16, combined=17
      const codeNode = result.root.children[0].children.find((n: any) => n.format === 17);
      expect(codeNode).toBeDefined();
    });
  });

  describe('Link Edge Cases', () => {
    it('should handle <a> with no href attribute (empty string url)', () => {
      const result = convertHtmlToLexicalEnhanced('<p><a>No href link</a></p>');
      const linkNode = result.root.children[0].children.find((n: any) => n.type === 'link');
      expect(linkNode).toBeDefined();
      expect(linkNode.fields.url).toBe('');
    });

    it('should set newTab:true when target is _new', () => {
      const result = convertHtmlToLexicalEnhanced(
        '<p><a href="https://example.com" target="_new">Link</a></p>',
      );
      const linkNode = result.root.children[0].children.find((n: any) => n.type === 'link');
      expect(linkNode).toBeDefined();
      expect(linkNode.fields.newTab).toBe(true);
    });
  });

  describe('Empty Block Elements', () => {
    it('should silently skip empty heading', () => {
      const result = convertHtmlToLexicalEnhanced('<h2></h2><p>After</p>');
      expect(result.root.children).toHaveLength(1);
      expect(result.root.children[0].type).toBe('paragraph');
    });

    it('should silently skip empty blockquote', () => {
      const result = convertHtmlToLexicalEnhanced('<blockquote></blockquote><p>After</p>');
      expect(result.root.children).toHaveLength(1);
      expect(result.root.children[0].type).toBe('paragraph');
    });

    it('should silently skip empty list', () => {
      const result = convertHtmlToLexicalEnhanced('<ul></ul><p>After</p>');
      expect(result.root.children).toHaveLength(1);
      expect(result.root.children[0].type).toBe('paragraph');
    });

    it('should use empty text fallback for empty list item', () => {
      const result = convertHtmlToLexicalEnhanced('<ul><li></li></ul>');
      const listItem = result.root.children[0].children[0];
      expect(listItem.type).toBe('listitem');
      expect(listItem.children[0].text).toBe('');
    });
  });

  describe('Image Edge Cases', () => {
    it('should silently skip image with no src attribute', () => {
      const result = convertHtmlToLexicalEnhanced('<img alt="no source"><p>After</p>');
      expect(result.root.children).toHaveLength(1);
      expect(result.root.children[0].type).toBe('paragraph');
    });

    it('should handle image without width or height attributes', () => {
      const result = convertHtmlToLexicalEnhanced('<img src="/image.jpg" alt="Test" />');
      const imageNode = result.root.children[0];
      expect(imageNode.type).toBe('upload');
      expect(imageNode.width).toBeUndefined();
      expect(imageNode.height).toBeUndefined();
    });
  });

  describe('Iframe Edge Cases', () => {
    it('should silently skip iframe with no src attribute', () => {
      const result = convertHtmlToLexicalEnhanced('<iframe></iframe><p>After</p>');
      expect(result.root.children).toHaveLength(1);
      expect(result.root.children[0].type).toBe('paragraph');
    });
  });

  describe('Table Edge Cases', () => {
    it('should silently skip table with no rows/cells', () => {
      const result = convertHtmlToLexicalEnhanced('<table></table><p>After</p>');
      expect(result.root.children).toHaveLength(1);
      expect(result.root.children[0].type).toBe('paragraph');
    });
  });

  describe('Center with Non-Paragraph Block Children', () => {
    it('should process list inside <center> without applying center format to list nodes', () => {
      const result = convertHtmlToLexicalEnhanced('<center><ul><li>Item</li></ul></center>');
      const listNode = result.root.children.find((n: any) => n.type === 'list');
      expect(listNode).toBeDefined();
      // list nodes don't get center format applied
      expect(listNode.format).not.toBe('center');
    });

    it('should silently skip empty <center> tag', () => {
      const result = convertHtmlToLexicalEnhanced('<center></center><p>After</p>');
      expect(result.root.children).toHaveLength(1);
      expect(result.root.children[0].type).toBe('paragraph');
    });
  });

  describe('Paragraph Alignment via style', () => {
    it('should not apply alignment when align attribute is stripped by sanitizer', () => {
      // DOMPurify strips `align` and `style` attributes — format stays ''
      const result = convertHtmlToLexicalEnhanced(
        '<p style="text-align: center;">Styled center</p>',
      );
      expect(result.root.children[0].type).toBe('paragraph');
      expect(result.root.children[0].format).toBe('');
    });

    it('should not apply alignment when style textAlign is stripped by sanitizer', () => {
      const result = convertHtmlToLexicalEnhanced('<p align="right">Right aligned</p>');
      expect(result.root.children[0].type).toBe('paragraph');
      expect(result.root.children[0].format).toBe('');
    });
  });

  describe('Whitespace Text Nodes', () => {
    it('should ignore whitespace-only text nodes inside a paragraph', () => {
      // Extra whitespace between inline elements should not produce extra text nodes
      const result = convertHtmlToLexicalEnhanced('<p><strong>A</strong>   <em>B</em></p>');
      const children = result.root.children[0].children;
      // whitespace-only text between A and B should be ignored
      const hasWhitespaceOnlyNode = children.some(
        (n: any) => n.type === 'text' && n.text.trim() === '' && n.text.length > 0,
      );
      expect(hasWhitespaceOnlyNode).toBe(false);
    });
  });

  describe('Error Recovery', () => {
    it('should return fallback structure when JSDOM throws', async () => {
      vi.doMock('jsdom', () => ({
        JSDOM: vi.fn().mockImplementation(() => {
          throw new Error('JSDOM failed');
        }),
      }));
      vi.resetModules();

      const { convertHtmlToLexicalEnhanced: convertWithError } = await import('./enhancedHtmlToLexical');
      const result = convertWithError('<p>Some content</p>');

      expect(result.root.children[0].children[0].text).toBe(
        '[Content conversion failed - see legacy HTML]',
      );

      vi.doUnmock('jsdom');
      vi.resetModules();
    });
  });
});
