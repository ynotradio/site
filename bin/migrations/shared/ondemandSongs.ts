import { stripHtmlTags } from './importUtils';

export interface ParsedLegacySongList {
  cleaned: string;
  reason?: 'empty' | 'placeholder';
  titles: string[];
}

export interface ArtistCandidate {
  id?: number;
  name: string;
}

function normalizeSongTitle(title: string): string {
  return title.replace(/\s+/g, ' ').trim();
}

function isPlaceholderSongText(cleaned: string): boolean {
  const normalized = cleaned.toLowerCase();

  return (
    normalized === 'n/a'
    || normalized === 'na'
    || normalized === '-'
    || /^[-–—]+$/.test(normalized)
    || normalized === '*full live set'
    || normalized.includes('setlist.fm')
    || normalized.includes('click here for setlist')
  );
}

export function parseLegacySongList(raw: string | null | undefined): ParsedLegacySongList {
  const cleaned = stripHtmlTags(raw ?? '').replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    return { cleaned, reason: 'empty', titles: [] };
  }

  if (isPlaceholderSongText(cleaned)) {
    return { cleaned, reason: 'placeholder', titles: [] };
  }

  const titles = cleaned
    .split('/')
    .map(normalizeSongTitle)
    .filter((title) => title.length > 0);

  if (titles.length === 0) {
    return { cleaned, reason: 'empty', titles: [] };
  }

  return { cleaned, titles };
}

export function extractArtistCandidates(input: {
  artists?: unknown;
  artistsText?: string | null;
  headline?: string | null;
}): ArtistCandidate[] {
  const fromRelations = Array.isArray(input.artists)
    ? input.artists
      .map((artist) => {
        if (typeof artist === 'object' && artist !== null && 'name' in artist) {
          const name = String((artist as { name?: unknown }).name ?? '').trim();
          const id = 'id' in artist ? Number((artist as { id?: unknown }).id) : undefined;
          return name ? { id: Number.isNaN(id) ? undefined : id, name } : null;
        }
        return null;
      })
      .filter((artist): artist is ArtistCandidate => artist !== null)
    : [];

  if (fromRelations.length > 0) {
    return fromRelations;
  }

  const fromText = (input.artistsText ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name }));

  if (fromText.length > 0) {
    return fromText;
  }

  return [];
}

export function formatSongPreviewTitles(titles: string[], maxItems = 4): string {
  if (titles.length <= maxItems) {
    return titles.join(' / ');
  }

  return `${titles.slice(0, maxItems).join(' / ')} / … (+${titles.length - maxItems} more)`;
}
