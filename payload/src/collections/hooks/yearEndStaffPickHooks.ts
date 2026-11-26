import type { CollectionBeforeChangeHook } from 'payload';

export type Pick = { artist: string; title: string };

const QUOTES = /["“”]/;
const stripQuotes = (text: string) => text.replace(/^["“”\s]+|["“”\s]+$/g, '');

/**
 * Parses `Artist "Title"` (the legacy song format) or `Artist - Title`.
 * A line with neither is kept whole as the title. Hand-typed legacy lists
 * have doubled, unclosed and mid-line quotes (`Jay Som "Float" (ft. X)`),
 * so the title runs from the first quote to the end, minus quote marks.
 */
const dashOutsideQuotes = (text: string): number => {
  let at = text.indexOf(' - ');
  while (at >= 0) {
    const quotesBefore = (text.slice(0, at).match(/["“”]/g) ?? []).length;
    if (quotesBefore % 2 === 0) return at;
    at = text.indexOf(' - ', at + 1);
  }
  return -1;
};

export const parsePickLine = (line: string): Pick | null => {
  const text = line
    .replace(/\s+/g, ' ')
    .replace(/^\d+[.)]\s*/, '')
    .replace(/ [–—] /g, ' - ')
    .trim();
  if (!text) return null;

  // A " - " outside quotes wins, so `Christone "Kingfish" Ingram - Fresh Stitches`
  // and `Wilco - Jesus, Etc. "Live"` split at the dash.
  const dash = dashOutsideQuotes(text);
  if (dash > 0) {
    const title = text.slice(dash + 3).trim();
    const wrapped = /^["“].*["”]$/.test(title);
    return { artist: text.slice(0, dash).trim(), title: wrapped ? stripQuotes(title) : title };
  }

  const quote = text.search(QUOTES);
  if (quote > 0) {
    const rest = text.slice(quote);
    const close = Math.max(rest.lastIndexOf('"'), rest.lastIndexOf('”'), rest.lastIndexOf('“'));
    const title = close > 0 ? `${rest.slice(0, close)} ${rest.slice(close + 1)}` : rest;
    const artist = text
      .slice(0, quote)
      .trim()
      .replace(/\s*[-–—]$/, '');
    return { artist, title: stripQuotes(title).replace(/\s+/g, ' ') };
  }

  return { artist: '', title: text };
};

export const parsePickLines = (text: string): Pick[] => text
  .split(/\r?\n/)
  .map(parsePickLine)
  .filter((pick): pick is Pick => pick !== null);

const appendPasted = (
  data: Record<string, unknown>,
  originalDoc: Record<string, unknown> | undefined,
  listField: 'songs' | 'albums',
  pasteField: 'songsPaste' | 'albumsPaste',
) => {
  const pasted = data[pasteField];
  const rest = { ...data };
  delete rest[pasteField];
  if (typeof pasted !== 'string' || pasted.trim() === '') return rest;

  const current = Array.isArray(data[listField]) ? data[listField] : originalDoc?.[listField];
  const existing = (current ?? []) as Pick[];
  const key = (pick: Partial<Pick>) => `${pick.artist ?? ''}\u0000${pick.title ?? ''}`.toLowerCase();
  const seen = new Set(existing.map(key));
  const added = parsePickLines(pasted).filter((pick) => {
    if (seen.has(key(pick))) return false;
    seen.add(key(pick));
    return true;
  });
  return { ...rest, [listField]: [...existing, ...added] };
};

export const appendPastedPicks: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const withSongs = appendPasted(data, originalDoc, 'songs', 'songsPaste');
  return appendPasted(withSongs, originalDoc, 'albums', 'albumsPaste');
};
