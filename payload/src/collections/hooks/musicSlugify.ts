/**
 * Custom slug generation for music collections (Songs and Records)
 *
 * Generates slugs in the format "artist-name--title" using a double-hyphen
 * separator between artist and title for SEO-friendly URLs.
 *
 * Also provides a hook for CdOfTheWeek to inherit the slug from its associated record.
 */

import type { CollectionBeforeChangeHook, Slugify } from 'payload';

/**
 * Slugify a single text value (lowercases, removes special chars, replaces spaces with hyphens)
 */
export function slugifyText(text: string): string {
  return text
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
    .toLowerCase();
}

/**
 * Resolve the artist name from data, handling both populated objects and IDs.
 */
async function resolveArtistName(
  data: Record<string, any>,
  req: { payload: any },
): Promise<string> {
  if (!data?.artist) return '';

  // Handle populated artist object
  if (typeof data.artist === 'object' && data.artist.name) {
    return data.artist.name;
  }

  // Look up artist by ID
  const artistId = typeof data.artist === 'object' ? data.artist.id : data.artist;
  try {
    const artist = await req.payload.findByID({
      collection: 'artists',
      id: artistId,
    });
    return artist?.name || '';
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

  const artistName = await resolveArtistName(data, req);
  const titleSlug = slugifyText(title);

  if (artistName) {
    const artistSlug = slugifyText(artistName);
    return `${artistSlug}--${titleSlug}`;
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
