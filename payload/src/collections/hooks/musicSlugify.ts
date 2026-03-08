/**
 * Custom slug generation for music collections (Songs and Records)
 *
 * Generates slugs in the format "artist-name--title" using a double-hyphen
 * separator between artist and title for SEO-friendly URLs.
 *
 * Also provides a hook for CdOfTheWeek to inherit the slug from its associated record.
 */

import type { CollectionBeforeChangeHook, Payload, Slugify } from 'payload';

/**
 * Slugify a single text value (lowercases, removes special chars, replaces spaces with hyphens)
 */
export function slugifyText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Resolve the artist name from data, handling both populated objects and IDs.
 */
async function resolveArtistName(
  data: Record<string, unknown>,
  payload: Payload,
): Promise<string> {
  const artist = data?.artist;
  if (!artist) return '';

  // Handle populated artist object
  if (typeof artist === 'object' && artist !== null && 'name' in artist) {
    return String((artist as { name: unknown }).name || '');
  }

  // Look up artist by ID
  const artistId = typeof artist === 'object' && artist !== null && 'id' in artist
    ? (artist as { id: unknown }).id
    : artist;
  try {
    const found = await payload.findByID({
      collection: 'artists',
      id: artistId as number,
    });
    return found?.name || '';
  } catch {
    return '';
  }
}

/**
 * Custom slugify function for Songs and Records.
 * Generates "artist-name--title" format slugs.
 */
export const musicSlugify: Slugify = async ({ data, req }) => {
  const title = data?.title;
  if (!title) return undefined;

  const artistName = await resolveArtistName(data, req.payload);
  const titleSlug = slugifyText(String(title));

  // If the title cannot be slugified into a non-empty string, do not generate a slug
  if (!titleSlug) return undefined;

  if (artistName) {
    const artistSlug = slugifyText(artistName);
    // Only prepend artist segment if it slugifies to a non-empty value
    if (artistSlug) {
      return `${artistSlug}--${titleSlug}`;
    }
  }

  return titleSlug;
};

/**
 * beforeChange hook for CdOfTheWeek that copies the slug from the associated record.
 */
export const setCdOfTheWeekSlugFromRecord: CollectionBeforeChangeHook = async ({ data, req }) => {
  const updatedData = data;

  if (!updatedData.record) return updatedData;

  const recordId = typeof updatedData.record === 'object'
    ? updatedData.record.id
    : updatedData.record;

  try {
    const record = await req.payload.findByID({
      collection: 'records',
      id: recordId,
    });

    if (record?.slug) {
      updatedData.slug = record.slug;
    }
  } catch {
    // Silently handle errors - slug will remain unchanged
  }

  return updatedData;
};
