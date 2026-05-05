import {
  convertLexicalToHTML,
  type HTMLConvertersFunction,
} from '@payloadcms/richtext-lexical/html';
import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext';
import type { SerializedEditorState } from 'lexical';

const SAFE_URL_RE = /^(https?:|mailto:|tel:|\/|#|\?)/i;

function safeHref(raw: unknown): string {
  if (typeof raw !== 'string') return '#';
  const trimmed = raw.trim();
  if (!trimmed) return '#';
  if (!SAFE_URL_RE.test(trimmed)) return '#';
  return trimmed.replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

const inlineConverters: HTMLConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  paragraph: ({ node, nodesToHTML }) => nodesToHTML({ nodes: node.children }).join(''),
  link: ({ node, nodesToHTML }) => {
    const fields = (node as { fields?: { url?: string; newTab?: boolean; linkType?: string } })
      .fields ?? {};
    const href = safeHref(fields.url);
    const children = nodesToHTML({ nodes: node.children }).join('');
    const rel = ' rel="nofollow noopener noreferrer"';
    const target = fields.newTab ? ' target="_blank"' : '';
    return `<a href="${href}"${target}${rel}>${children}</a>`;
  },
  autolink: ({ node, nodesToHTML }) => {
    const fields = (node as { fields?: { url?: string; newTab?: boolean } }).fields ?? {};
    const href = safeHref(fields.url);
    const children = nodesToHTML({ nodes: node.children }).join('');
    return `<a href="${href}" rel="nofollow noopener noreferrer">${children}</a>`;
  },
});

export function convertConcertTitleToHtml(state: SerializedEditorState | null | undefined): string {
  if (!state || !state.root || !Array.isArray(state.root.children)) return '';
  const html = convertLexicalToHTML({
    data: state,
    converters: inlineConverters,
    disableContainer: true,
    disableIndent: true,
    disableTextAlign: true,
  });
  return html.trim();
}

export function convertConcertTitleToPlain(
  state: SerializedEditorState | null | undefined,
): string {
  if (!state || !state.root || !Array.isArray(state.root.children)) return '';
  return convertLexicalToPlaintext({ data: state }).trim();
}
