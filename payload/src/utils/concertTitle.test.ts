import { describe, expect, it } from 'vitest';
import type { SerializedEditorState } from 'lexical';
import { convertConcertTitleToHtml, convertConcertTitleToPlain } from './concertTitle';

function paragraph(children: unknown[]): SerializedEditorState {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          textFormat: 0,
          textStyle: '',
          children,
        },
      ],
    },
  } as unknown as SerializedEditorState;
}

function text(textValue: string, format = 0) {
  return {
    type: 'text',
    detail: 0,
    format,
    mode: 'normal',
    style: '',
    text: textValue,
    version: 1,
  };
}

describe('convertConcertTitleToHtml', () => {
  it('returns empty string for null state', () => {
    expect(convertConcertTitleToHtml(null)).toBe('');
    expect(convertConcertTitleToHtml(undefined)).toBe('');
  });

  it('renders plain text without paragraph wrapper', () => {
    expect(convertConcertTitleToHtml(paragraph([text('Hello world')]))).toBe('Hello world');
  });

  it('renders italic (format=2) as <em>', () => {
    const html = convertConcertTitleToHtml(
      paragraph([text('Pete Yorn ('), text('Musicforthemorningafter', 2), text(' 25th)')]),
    );
    expect(html).toContain('<em>Musicforthemorningafter</em>');
    expect(html.startsWith('<p')).toBe(false);
  });

  it('renders bold (format=1) as <strong>', () => {
    expect(convertConcertTitleToHtml(paragraph([text('Loud', 1)]))).toContain('<strong>Loud</strong>');
  });

  it('renders link with safe rel attributes', () => {
    const state = paragraph([
      {
        type: 'link',
        version: 3,
        format: '',
        indent: 0,
        direction: 'ltr',
        fields: { linkType: 'custom', url: 'https://example.com', newTab: true },
        children: [text('see show')],
      },
    ]);
    const html = convertConcertTitleToHtml(state);
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('rel="nofollow noopener noreferrer"');
    expect(html).toContain('target="_blank"');
  });

  it('blocks javascript: URLs', () => {
    const state = paragraph([
      {
        type: 'link',
        version: 3,
        format: '',
        indent: 0,
        direction: 'ltr',
        // eslint-disable-next-line no-script-url
        fields: { linkType: 'custom', url: 'javascript:alert(1)' },
        children: [text('xss')],
      },
    ]);
    expect(convertConcertTitleToHtml(state)).toContain('href="#"');
  });
});

describe('convertConcertTitleToPlain', () => {
  it('returns empty string for null state', () => {
    expect(convertConcertTitleToPlain(null)).toBe('');
  });

  it('strips formatting', () => {
    const state = paragraph([text('Pete Yorn ('), text('Musicforthemorningafter', 2), text(' 25th)')]);
    expect(convertConcertTitleToPlain(state)).toBe('Pete Yorn (Musicforthemorningafter 25th)');
  });
});
