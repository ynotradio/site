import { JSDOM } from 'jsdom';
import type { SerializedEditorState } from 'lexical';

const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;

type Inline =
  | { kind: 'text'; text: string; format: number }
  | { kind: 'link'; url: string; children: Inline[] }
  | { kind: 'br' };

function walk(node: Node, format: number, out: Inline[]): void {
  if (node.nodeType === 3) {
    const text = node.textContent ?? '';
    if (text.length === 0) return;
    out.push({ kind: 'text', text, format });
    return;
  }
  if (node.nodeType !== 1) return;
  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  switch (tag) {
    case 'br':
      out.push({ kind: 'br' });
      return;
    case 'em':
    case 'i': {
      // eslint-disable-next-line no-bitwise
      el.childNodes.forEach((c) => walk(c, format | FORMAT_ITALIC, out));
      return;
    }
    case 'strong':
    case 'b': {
      // eslint-disable-next-line no-bitwise
      el.childNodes.forEach((c) => walk(c, format | FORMAT_BOLD, out));
      return;
    }
    case 'a': {
      const href = el.getAttribute('href') ?? '';
      const inner: Inline[] = [];
      el.childNodes.forEach((c) => walk(c, format, inner));
      // Collapse: if no inner content, drop the link entirely
      if (inner.length === 0) return;
      out.push({ kind: 'link', url: href, children: inner });
      return;
    }
    default:
      // Unknown / unsupported tag: descend, treat as transparent
      el.childNodes.forEach((c) => walk(c, format, out));
  }
}

function inlineToLexical(items: Inline[]): unknown[] {
  const out: unknown[] = [];
  for (const item of items) {
    if (item.kind === 'text') {
      out.push({
        type: 'text',
        detail: 0,
        format: item.format,
        mode: 'normal',
        style: '',
        text: item.text,
        version: 1,
      });
    } else if (item.kind === 'br') {
      out.push({ type: 'linebreak', version: 1 });
    } else {
      out.push({
        type: 'link',
        version: 3,
        format: '',
        indent: 0,
        direction: 'ltr',
        fields: {
          linkType: 'custom',
          url: item.url,
          newTab: true,
        },
        children: inlineToLexical(item.children),
      });
    }
  }
  return out;
}

/**
 * Convert a legacy concert title HTML string (which may contain `<em>`, `<i>`,
 * `<strong>`, `<b>`, `<a>`, `<br>`) into a single-paragraph Lexical editor state.
 * Plain strings produce a single paragraph with one text node.
 * Empty input returns an empty paragraph (matching Payload's default empty state).
 */
export function htmlTitleToLexical(html: string): SerializedEditorState {
  const dom = new JSDOM(`<!doctype html><body>${html ?? ''}</body>`);
  const { body } = dom.window.document;

  const inlines: Inline[] = [];
  body.childNodes.forEach((child) => walk(child, 0, inlines));

  const children = inlineToLexical(inlines);

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
