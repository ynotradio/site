import type { CollectionBeforeChangeHook, Payload } from 'payload';
import type { Slugify } from 'payload/shared';

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
async function resolveArtistName(data: Record<string, unknown>, payload: Payload): Promise<string> {
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

  // If the title cannot be slugified, preserve any pre-existing slug (e.g. import fallback)
  if (!titleSlug) return typeof data?.slug === 'string' && data.slug ? data.slug : undefined;

  if (artistName) {
    const artistSlug = slugifyText(artistName);
    // Only prepend artist segment if it slugifies to a non-empty value
    if (artistSlug) {
      return `${artistSlug}--${titleSlug}`;
    }
  }

  return titleSlug;
};

export const setCdOfTheWeekSlugFromRecord: CollectionBeforeChangeHook = async ({ data, req }) => {
  const updatedData = data;

  if (!updatedData.record) return updatedData;

  const recordId = typeof updatedData.record === 'object'
    ? (updatedData.record as { id: unknown }).id
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
