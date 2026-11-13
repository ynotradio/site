import type { CollectionBeforeChangeHook } from 'payload';

export type Pick = { artist: string; title: string };

/**
 * Parses `Artist "Title"` (the legacy song format) or `Artist - Title`.
 * A line with neither is kept whole as the title.
 */
export const parsePickLine = (line: string): Pick | null => {
  const text = line
    .replace(/\s+/g, ' ')
    .replace(/^\d+[.)]\s*/, '')
    .trim();
  if (!text) return null;

  const quoted = text.match(/^(.*?)\s*[“"](.+)[”"]$/);
  if (quoted && quoted[1]) return { artist: quoted[1].trim(), title: quoted[2].trim() };

  const dash = text.indexOf(' - ');
  if (dash > 0) return { artist: text.slice(0, dash).trim(), title: text.slice(dash + 3).trim() };

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
  return { ...rest, [listField]: [...existing, ...parsePickLines(pasted)] };
};

export const appendPastedPicks: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const withSongs = appendPasted(data, originalDoc, 'songs', 'songsPaste');
  return appendPasted(withSongs, originalDoc, 'albums', 'albumsPaste');
};
