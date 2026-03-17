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
 * Format a Date as YYYY-MM-DD for use as a slug prefix.
 */
export function formatDatePrefix(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Slugify a post headline, stripping HTML tags first.
 */
export function slugifyHeadline(headline: string): string {
  return headline
    .replace(/<[^>]*>/g, '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
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
  let artistId = artist;
  if (typeof artist === 'object' && artist !== null && 'id' in artist) {
    artistId = (artist as { id: unknown }).id;
  }
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
 * Build the "artist--title" slug from pre-resolved artist name and title.
 */
export function buildMusicSlug(artistName: string, titleSlug: string): string {
  if (artistName) {
    const artistSlug = slugifyText(artistName);
    if (artistSlug) return `${artistSlug}--${titleSlug}`;
  }
  return titleSlug;
}

/**
 * Custom slugify function for Songs and Records.
 * Generates "artist-name--title" format slugs.
 *
 * IMPORTANT: This function returns synchronously whenever possible because Payload's
 * generateSlug wrapper does NOT await the slugify result. Returning a Promise causes
 * data.slug to be set to a Promise object, which fails text field validation.
 * Only falls back to async (returns Promise) when an artist DB lookup is required.
 */
export const musicSlugify: Slugify = ({ data, req, valueToSlugify }) => {
  const title = data?.title;
  if (!title) return undefined;

  // If a slug was explicitly pre-set (valueToSlugify differs from title),
  // return it synchronously. valueToSlugify is data.slug || data.title,
  // captured by Payload BEFORE generateSlug overwrites data.slug.
  if (valueToSlugify && String(valueToSlugify) !== String(title)) {
    return String(valueToSlugify);
  }

  const titleSlug = slugifyText(String(title));

  // If title can't be slugified (e.g. only special characters like ♪♫★),
  // return the fallback synchronously.
  if (!titleSlug) {
    if (!valueToSlugify) return undefined;
    return slugifyText(String(valueToSlugify)) || String(valueToSlugify);
  }

  const artist = data?.artist;
  if (!artist) return titleSlug;

  // Populated artist object — resolve synchronously
  if (typeof artist === 'object' && artist !== null && 'name' in artist) {
    return buildMusicSlug(String((artist as { name: unknown }).name || ''), titleSlug);
  }

  // Artist is an ID — need async DB lookup, returns a Promise
  return resolveArtistName(data, req.payload).then((name) => buildMusicSlug(name, titleSlug));
};

export const setCdOfTheWeekSlugFromRecord: CollectionBeforeChangeHook = async ({ data, req }) => {
  const updatedData = data;

  if (!updatedData.record) return updatedData;

  let recordId = updatedData.record;
  if (typeof updatedData.record === 'object') {
    recordId = (updatedData.record as { id: unknown }).id;
  }

  try {
    const record = await req.payload.findByID({
      collection: 'records',
      id: recordId,
    });

    if (record?.slug) {
      const dateStr = updatedData.date
        ? formatDatePrefix(new Date(updatedData.date as string))
        : '';
      updatedData.slug = dateStr ? `${dateStr}--${record.slug}` : record.slug;
    }
  } catch {
    // Silently handle errors - slug will remain unchanged
  }

  return updatedData;
};
