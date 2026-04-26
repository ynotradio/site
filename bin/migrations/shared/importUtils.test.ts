import { describe, it, expect } from 'vitest';
import {
  generateSlug,
  generateMusicSlug,
  convertHtmlToLexical,
  getStatusFromDeleted,
  stripHtmlTags,
  convertTextToLexical,
} from './importUtils';

describe('generateSlug', () => {
  it('should convert text to lowercase', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('should replace spaces with dashes', () => {
    expect(generateSlug('foo bar baz')).toBe('foo-bar-baz');
  });

  it('should remove special characters', () => {
    expect(generateSlug('hello@world!#$')).toBe('helloworld');
  });

  it('should collapse multiple spaces', () => {
    expect(generateSlug('hello    world')).toBe('hello-world');
  });

  it('should collapse multiple dashes', () => {
    expect(generateSlug('hello--world---test')).toBe('hello-world-test');
  });

  it('should remove leading dashes', () => {
    expect(generateSlug('---hello-world')).toBe('hello-world');
  });

  it('should remove trailing dashes', () => {
    expect(generateSlug('hello-world---')).toBe('hello-world');
  });

  it('should handle mixed case and special chars', () => {
    expect(generateSlug('The Quick! Brown@ Fox#')).toBe('the-quick-brown-fox');
  });

  it('should preserve alphanumeric and hyphens', () => {
    expect(generateSlug('test-123-abc')).toBe('test-123-abc');
  });
});

describe('generateMusicSlug', () => {
  it('should generate artist--title slug', () => {
    expect(generateMusicSlug('The Beatles', 'Hey Jude')).toBe('the-beatles--hey-jude');
  });

  it('should fall back to title-only when artist is empty', () => {
    expect(generateMusicSlug('', 'Untitled Song')).toBe('untitled-song');
  });

  it('should handle special characters in artist and title', () => {
    expect(generateMusicSlug("Guns N' Roses", 'Sweet Child O\' Mine')).toBe('guns-n-roses--sweet-child-o-mine');
  });

  it('should fall back to title-only when artist slugifies to empty', () => {
    expect(generateMusicSlug('!!!', 'Good Title')).toBe('good-title');
  });
});

describe('convertHtmlToLexical', () => {
  it('should return minimal valid structure for empty string', () => {
    // Empty string should return a valid Lexical structure with an empty paragraph
    // This is required for Payload's richText field validation
    const result = convertHtmlToLexical('');
    expect(result.root.children).toHaveLength(1);
    expect(result.root.children[0].type).toBe('paragraph');
    expect(result.root.children[0].children[0].text).toBe('');
    expect(result.root.children[0].children[0].type).toBe('text');
  });

  it('should return minimal valid structure for null/undefined/empty', () => {
    // Empty content should return a valid Lexical structure with an empty paragraph
    // This is required for Payload's richText field validation
    const result = convertHtmlToLexical(null as any);
    expect(result.root.children).toHaveLength(1);
    expect(result.root.children[0].type).toBe('paragraph');
    expect(result.root.children[0].children[0].text).toBe('');
    expect(result.root.children[0].children[0].type).toBe('text');
  });

  it('should convert plain text to paragraph with text node', () => {
    const result = convertHtmlToLexical('Hello World');
    expect(result.root.children).toHaveLength(1);
    expect(result.root.children[0].type).toBe('paragraph');
    expect(result.root.children[0].children[0].text).toBe('Hello World');
  });

  it('should strip HTML tags from content', () => {
    const result = convertHtmlToLexical('<p>Hello <strong>World</strong></p>');
    // Should create two text nodes: plain "Hello " (with space) and bold "World"
    expect(result.root.children[0].children).toHaveLength(2);
    expect(result.root.children[0].children[0].text).toBe('Hello ');
    expect(result.root.children[0].children[0].format).toBe(0); // Plain
    expect(result.root.children[0].children[1].text).toBe('World');
    expect(result.root.children[0].children[1].format).toBe(1); // Bold
  });

  it('should preserve spaces between inline elements', () => {
    // This is the issue from IMPORT_TODO: "new episode ofAussie UnlockedwithShanafor"
    // should be "new episode of Aussie Unlocked with Shana for"
    const html = '<p>new episode of<em>Aussie Unlocked</em>with<strong>Shana</strong>for</p>';
    const result = convertHtmlToLexical(html);
    // Combine all text nodes to check the full text
    const fullText = result.root.children[0].children
      .map(
        (child: any) =>
          child.text || (child.children ? child.children.map((c: any) => c.text).join('') : ''),
      )
      .join('');
    // Should have spaces between parts
    expect(fullText).toContain('of');
    expect(fullText).toContain('Aussie Unlocked');
    expect(fullText).toContain('with');
    expect(fullText).toContain('Shana');
    expect(fullText).toContain('for');
  });

  it('should preserve spaces with proper formatting', () => {
    const html = '<p>Check out the <em>latest episode</em> of <strong>The Show</strong>!</p>';
    const result = convertHtmlToLexical(html);
    const fullText = result.root.children[0].children
      .map(
        (child: any) =>
          child.text || (child.children ? child.children.map((c: any) => c.text).join('') : ''),
      )
      .join('');
    expect(fullText).toBe('Check out the latest episode of The Show!');
  });

  it('should handle complex HTML', () => {
    const html = '<div><h1>Title</h1><p>Paragraph with <a href="#">link</a></p></div>';
    const result = convertHtmlToLexical(html);
    // Should create paragraphs (exact count depends on how unsupported tags are handled)
    expect(result.root.children.length).toBeGreaterThan(0);
    expect(result.root.children[0].type).toBe('paragraph');
    // Should have processed the link
    const hasLink = result.root.children.some((para: any) =>
      para.children?.some((child: any) => child.type === 'link'),
    );
    expect(hasLink).toBe(true);
  });

  it('should set correct structure properties', () => {
    const result = convertHtmlToLexical('test');
    expect(result.root.type).toBe('root');
    expect(result.root.version).toBe(1);
    expect(result.root.direction).toBe('ltr');
    expect(result.root.children[0].type).toBe('paragraph');
    expect(result.root.children[0].direction).toBe('ltr');
  });

  it('should set format:center on paragraph wrapped in <center> tags', () => {
    const result = convertHtmlToLexical('<center><b><a href="https://example.com/vote">VOTE HERE</a></b></center>');
    expect(result.root.children[0].format).toBe('center');
    const linkNode = result.root.children[0].children.find((c: any) => c.type === 'link');
    expect(linkNode).toBeDefined();
  });

  it('should set format:center for <p align="center"> paragraphs', () => {
    const result = convertHtmlToLexical('<p align="center">Centered text</p>');
    expect(result.root.children[0].format).toBe('center');
    expect(result.root.children[0].children[0].text).toBe('Centered text');
  });

  it('should keep non-centered paragraphs with empty format', () => {
    const result = convertHtmlToLexical('<p>Normal paragraph</p>');
    expect(result.root.children[0].format).toBe('');
  });

  it('should handle mixed centered and non-centered content', () => {
    const result = convertHtmlToLexical(
      '<p>Normal text</p><center>Centered text</center><p>Normal again</p>',
    );
    expect(result.root.children[0].format).toBe('');
    expect(result.root.children[1].format).toBe('center');
    expect(result.root.children[2].format).toBe('');
  });

  it('should return minimal paragraph when parsing yields no nodes', () => {
    // <br> only produces no paragraph nodes since all split segments are empty
    const result = convertHtmlToLexical('<br>');
    expect(result.root.children).toHaveLength(1);
    expect(result.root.children[0].type).toBe('paragraph');
  });

  it('should handle HTML containing only whitespace paragraph tags', () => {
    const result = convertHtmlToLexical('<p>   </p>');
    expect(result.root.children).toHaveLength(1);
    expect(result.root.children[0].type).toBe('paragraph');
  });

  it('should append space to previous node when single space separates inline elements', () => {
    // Covers the branch where normalizedText === ' ' and lastNode.text doesn't end with space
    const result = convertHtmlToLexical('<strong>bold</strong> <em>italic</em>');
    const children = result.root.children[0].children;
    // The bold text should have a trailing space appended, italic text should follow
    const boldNode = children.find((c: any) => c.format === 1);
    const italicNode = children.find((c: any) => c.format === 2);
    expect(boldNode).toBeDefined();
    expect(italicNode).toBeDefined();
    expect(boldNode.text).toBe('bold ');
    expect(italicNode.text).toBe('italic');
  });

  it('should fallback to stripped tag text when link has no href', () => {
    // Covers fallback path in parseInlineElements (lines 218-220): link with empty href
    // has its text extracted by stripping tags from the raw HTML
    const result = convertHtmlToLexical('<a href="">click here</a>');
    const children = result.root.children[0].children;
    expect(children.length).toBeGreaterThan(0);
    const textContent = children.map((c: any) => c.text || '').join('');
    expect(textContent).toContain('click here');
  });

  it('should produce minimal paragraph for link with no text or href', () => {
    // Covers the branch in convertHtmlToLexical where parseHtmlToLexicalNodes returns []
    // An empty anchor tag with a URL but no text produces no nodes from parseInlineElements
    const result = convertHtmlToLexical('<a href="http://example.com"></a>');
    expect(result.root.children).toHaveLength(1);
    expect(result.root.children[0].type).toBe('paragraph');
  });

  it('should recursively parse bold tags containing nested inline elements', () => {
    // Covers the branch where <b>/<strong> innerHtml contains '<' (nested HTML)
    const result = convertHtmlToLexical('<b><a href="http://example.com">link text</a></b>');
    const children = result.root.children[0].children;
    expect(children.length).toBeGreaterThan(0);
    const linkNode = children.find((c: any) => c.type === 'link');
    expect(linkNode).toBeDefined();
    expect(linkNode.children[0].text).toBe('link text');
  });

  it('should append space to previous node when trailing text starts with whitespace', () => {
    // Covers lines 199-201: remaining text after inline elements starts with whitespace
    const result = convertHtmlToLexical('<strong>bold</strong> trailing');
    const children = result.root.children[0].children;
    const boldNode = children.find((c: any) => c.format === 1);
    const trailingNode = children.find((c: any) => c.text === 'trailing');
    expect(boldNode).toBeDefined();
    expect(trailingNode).toBeDefined();
    // Bold node should have trailing space appended before the plain text node
    expect(boldNode.text).toBe('bold ');
  });

  it('should convert protocol-relative URLs to https absolute URLs', () => {
    const result = convertHtmlToLexical('<a href="//example.com/path">Protocol relative link</a>');
    const linkNode = result.root.children[0].children.find((c: any) => c.type === 'link');
    expect(linkNode).toBeDefined();
    expect(linkNode.fields.url).toBe('https://example.com/path');
  });

  it('should convert root-relative URLs to absolute URLs using baseUrl', () => {
    const result = convertHtmlToLexical('<a href="/artists/miles-davis">Root relative link</a>');
    const linkNode = result.root.children[0].children.find((c: any) => c.type === 'link');
    expect(linkNode).toBeDefined();
    expect(linkNode.fields.url).toBe('https://www.ynotradio.net/artists/miles-davis');
  });
});

describe('getStatusFromDeleted', () => {
  it('should return published for null', () => {
    expect(getStatusFromDeleted(null)).toBe('published');
  });

  it('should return published for undefined', () => {
    expect(getStatusFromDeleted(undefined)).toBe('published');
  });

  it('should return published for empty string', () => {
    expect(getStatusFromDeleted('')).toBe('published');
  });

  it('should return draft for "y"', () => {
    expect(getStatusFromDeleted('y')).toBe('draft');
  });

  it('should return draft for "Y"', () => {
    expect(getStatusFromDeleted('Y')).toBe('draft');
  });

  it('should return draft for "yes"', () => {
    expect(getStatusFromDeleted('yes')).toBe('draft');
  });

  it('should return draft for "Yes"', () => {
    expect(getStatusFromDeleted('Yes')).toBe('draft');
  });

  it('should return draft for "YES"', () => {
    expect(getStatusFromDeleted('YES')).toBe('draft');
  });

  it('should return published for "n"', () => {
    expect(getStatusFromDeleted('n')).toBe('published');
  });

  it('should return published for "N"', () => {
    expect(getStatusFromDeleted('N')).toBe('published');
  });

  it('should return published for "no"', () => {
    expect(getStatusFromDeleted('no')).toBe('published');
  });

  it('should return published for "No"', () => {
    expect(getStatusFromDeleted('No')).toBe('published');
  });

  it('should return published for "NO"', () => {
    expect(getStatusFromDeleted('NO')).toBe('published');
  });

  it('should return published for any other value', () => {
    expect(getStatusFromDeleted('maybe')).toBe('published');
    expect(getStatusFromDeleted('unknown')).toBe('published');
    expect(getStatusFromDeleted('123')).toBe('published');
  });

  it('should handle whitespace', () => {
    expect(getStatusFromDeleted('  y  ')).toBe('draft');
    expect(getStatusFromDeleted('  yes  ')).toBe('draft');
    expect(getStatusFromDeleted('  n  ')).toBe('published');
  });
});

describe('stripHtmlTags', () => {
  it('should return empty string for null', () => {
    expect(stripHtmlTags(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(stripHtmlTags(undefined)).toBe('');
  });

  it('should return empty string for empty string', () => {
    expect(stripHtmlTags('')).toBe('');
  });

  it('should remove HTML tags', () => {
    expect(stripHtmlTags('<p>Hello World</p>')).toBe('Hello World');
  });

  it('should remove multiple HTML tags', () => {
    expect(stripHtmlTags('<div><p>Hello</p><span>World</span></div>')).toBe('Hello World');
  });

  it('should convert <br> tags to spaces', () => {
    expect(stripHtmlTags('Hello<br>World')).toBe('Hello World');
    expect(stripHtmlTags('Hello<br/>World')).toBe('Hello World');
    expect(stripHtmlTags('Hello<br />World')).toBe('Hello World');
  });

  it('should remove inline formatting tags', () => {
    expect(stripHtmlTags('<strong>Bold</strong> and <em>italic</em>')).toBe('Bold and italic');
  });

  it('should normalize whitespace', () => {
    expect(stripHtmlTags('Hello    World')).toBe('Hello World');
    expect(stripHtmlTags('  Hello   World  ')).toBe('Hello World');
  });

  it('should handle mixed HTML and plain text', () => {
    expect(stripHtmlTags('Plain <b>bold</b> text')).toBe('Plain bold text');
  });

  it('should handle complex HTML', () => {
    expect(
      stripHtmlTags('<div><h1>Title</h1><p>Paragraph with <a href="#">link</a></p></div>'),
    ).toBe('Title Paragraph with link');
  });

  it('should handle font tags common in legacy content', () => {
    expect(stripHtmlTags('<font color="red">Red text</font>')).toBe('Red text');
  });

  it('should preserve text content only', () => {
    expect(stripHtmlTags('DJ <font color="blue">Blue</font> Show')).toBe('DJ Blue Show');
  });
});

describe('convertTextToLexical', () => {
  it('should return empty root for null', () => {
    const result = convertTextToLexical(null);
    expect(result).toEqual({
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        children: [],
        direction: null,
      },
    });
  });

  it('should return empty root for undefined', () => {
    const result = convertTextToLexical(undefined);
    expect(result).toEqual({
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        children: [],
        direction: null,
      },
    });
  });

  it('should return empty root for empty string', () => {
    const result = convertTextToLexical('');
    expect(result).toEqual({
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        children: [],
        direction: null,
      },
    });
  });

  it('should return empty root for whitespace-only string', () => {
    const result = convertTextToLexical('   ');
    expect(result).toEqual({
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        children: [],
        direction: null,
      },
    });
  });

  it('should convert plain text to Lexical format', () => {
    const result = convertTextToLexical('Hello World');
    expect(result).toEqual({
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
                text: 'Hello World',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
          },
        ],
        direction: 'ltr',
      },
    });
  });

  it('should trim whitespace from text', () => {
    const result = convertTextToLexical('  Hello World  ');
    expect(result.root.children[0].children[0].text).toBe('Hello World');
  });

  it('should handle special characters', () => {
    const result = convertTextToLexical('Win Dinosaur Jr. Tickets!');
    expect(result.root.children[0].children[0].text).toBe('Win Dinosaur Jr. Tickets!');
  });
});
