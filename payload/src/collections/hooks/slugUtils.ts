import type {
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
  Payload,
  PayloadRequest,
} from 'payload';
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
export async function resolveArtistName(
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
 * Custom slugify function for Songs and Records. Generates "artist-name--title"
 * format slugs.
 *
 * IMPORTANT: This function is ALWAYS synchronous and never returns a Promise.
 * Payload's generateSlug wrapper does not await the slugify result, so a Promise
 * would be stored as data.slug and fail text-field validation — the intermittent
 * "invalid slug" error editors hit when adding new music.
 *
 * When the artist name is not available synchronously (artist is a numeric ID),
 * this returns a valid title-only slug. The full "artist--title" slug is resolved
 * asynchronously and written by generateMusicSlugBeforeChangeHook (a collection
 * beforeChange hook), which runs before the row is persisted. Either way the
 * value reaching validation is a valid, non-empty slug.
 */
export const musicSlugify: Slugify = ({ data, valueToSlugify }) => {
  const title = data?.title;
  if (!title) return undefined;

  // If a slug was explicitly pre-set (valueToSlugify differs from title),
  // return it. valueToSlugify is data.slug || data.title, captured by Payload
  // BEFORE generateSlug overwrites data.slug.
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

  // Populated artist object — resolve synchronously.
  if (typeof artist === 'object' && artist !== null && 'name' in artist) {
    return buildMusicSlug(String((artist as { name: unknown }).name || ''), titleSlug);
  }

  // Artist is a numeric ID — prefer the slug already resolved by
  // generateMusicSlugBeforeChangeHook when present; otherwise return a valid
  // title-only slug. Never fall back to an async DB lookup here: returning a
  // Promise is exactly what broke slug validation.
  const precomputedSlug = data?.slug;
  if (typeof precomputedSlug === 'string' && precomputedSlug) {
    return precomputedSlug;
  }

  return titleSlug;
};

/**
 * Collection beforeChange hook for Songs and Records.
 *
 * Pre-computes the artist--title slug BEFORE Payload's field-level generateSlug hook runs.
 * This is required because Payload's generateSlug wrapper does NOT await a Promise returned
 * by a custom Slugify function, causing data.slug to be set to a Promise object (which fails
 * text field validation) whenever the artist is a numeric ID and needs a DB lookup.
 *
 * By resolving the artist name here (async, before field hooks) and setting data.slug,
 * musicSlugify can later return the pre-computed value synchronously.
 *
 * Skips when:
 * - The user has manually unlocked the slug (data.generateSlug === false)
 * - There is no title to slugify
 * - The artist is already a populated object with a name (musicSlugify handles that synchronously)
 */
export const generateMusicSlugBeforeChangeHook: CollectionBeforeChangeHook = async ({
  data,
  req,
}) => {
  const updatedData = data;

  // Respect the user's manual slug override (Unlock button sets generateSlug = false)
  if (updatedData.generateSlug === false) return updatedData;

  const title = updatedData?.title;
  if (!title) return updatedData;

  const titleSlug = slugifyText(String(title));
  if (!titleSlug) return updatedData;

  const artist = updatedData?.artist;
  if (!artist) return updatedData;

  // Populated artist with name — musicSlugify handles this synchronously; nothing to do here
  if (typeof artist === 'object' && artist !== null && 'name' in artist) return updatedData;

  // Artist is a numeric ID (or object without name) — resolve name asynchronously now
  const artistName = await resolveArtistName(updatedData as Record<string, unknown>, req.payload);
  updatedData.slug = buildMusicSlug(artistName, titleSlug);

  return updatedData;
};

/**
 * Find a slug based on `base` that no other row in `collection` already uses,
 * appending -2, -3, … on collision. Excludes the current document on update.
 */
async function findUniqueSlug(
  payload: Payload,
  collection: 'songs' | 'records',
  base: string,
  excludeId: number | string | undefined,
  req: PayloadRequest,
): Promise<string> {
  for (let n = 1; n < 100; n += 1) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const where = excludeId != null
      ? { and: [{ slug: { equals: candidate } }, { id: { not_equals: excludeId } }] }
      : { slug: { equals: candidate } };
    // eslint-disable-next-line no-await-in-loop -- sequential probing is intentional
    const { totalDocs } = await payload.find({
      collection,
      where,
      limit: 0,
      depth: 0,
      overrideAccess: true,
      req,
    });
    if (totalDocs === 0) return candidate;
  }
  // Extremely unlikely fallback — keep the save unblocked with a unique value.
  return `${base}-${Date.now()}`;
}

/**
 * Collection beforeValidate hook for Songs and Records that guarantees a UNIQUE
 * slug before Payload's unique-field validation runs.
 *
 * Two different titles can slugify to the same value ("test 🙈🙈" and
 * "test 🙉🙉" both become "test"), so the derived artist--title slug collides
 * with an existing row and Payload rejects the save with the same opaque
 * "The following field is invalid: slug" message editors already struggle with.
 * This resolves the artist name, builds the base slug, then de-duplicates it
 * (-2, -3, …) so the save never blocks. Runs in beforeValidate (not
 * beforeChange) because the unique check happens during validation.
 *
 * Respects a manual override (generateSlug === false) and locks the resulting
 * slug so nothing downstream overwrites the de-duplicated value.
 */
export const dedupeMusicSlug = (collectionSlug: 'songs' | 'records'): CollectionBeforeValidateHook => async ({ data, req, originalDoc }) => {
  const updatedData = data;
  if (!updatedData) return updatedData;
  if (updatedData.generateSlug === false) return updatedData;

  const { title } = updatedData;
  if (!title) return updatedData;

  const titleSlug = slugifyText(String(title));
  const artistName = await resolveArtistName(updatedData as Record<string, unknown>, req.payload);
  let base = titleSlug ? buildMusicSlug(artistName, titleSlug) : '';
  if (!base) {
    // Title has no slug-safe characters — fall back to any typed slug, else a constant.
    base = slugifyText(String(updatedData.slug ?? '')) || 'song';
  }

  const excludeId = (originalDoc as { id?: number | string } | undefined)?.id;
  updatedData.slug = await findUniqueSlug(req.payload, collectionSlug, base, excludeId, req);
  // Lock the de-duplicated slug so the generateSlug hooks don't rebuild the
  // colliding base value.
  updatedData.generateSlug = false;
  return updatedData;
};

export const setCdOfTheWeekSlugFromRecord: CollectionBeforeChangeHook = async ({ data, req }) => {
  const updatedData = data;

  // Respect the user's manual slug override (Unlock button sets generateSlug = false)
  if (updatedData.generateSlug === false) return updatedData;

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

/**
 * Custom slugify function for Posts (Stories).
 * Generates "YYYY-MM-DD--headline" format slugs synchronously from headline + startDate.
 */
export const postSlugify: Slugify = ({ data, valueToSlugify }) => {
  const headline = data?.headline;
  if (!headline) {
    return valueToSlugify ? slugifyHeadline(String(valueToSlugify)) : undefined;
  }

  // Honor a user-typed slug (valueToSlugify diverged from headline)
  if (valueToSlugify && String(valueToSlugify) !== String(headline)) {
    return slugifyHeadline(String(valueToSlugify));
  }

  const headlineSlug = slugifyHeadline(String(headline));
  if (!headlineSlug) return undefined;

  const dateStr = data?.startDate ? formatDatePrefix(new Date(data.startDate as string)) : '';
  return dateStr ? `${dateStr}--${headlineSlug}` : headlineSlug;
};

/**
 * Custom slugify function for Pages (custom-text pages).
 * Generates a simple, stable permalink slug from the page title — no date prefix.
 */
export const pageSlugify: Slugify = ({ data, valueToSlugify }) => {
  const title = data?.title;
  if (!title) {
    return valueToSlugify ? slugifyHeadline(String(valueToSlugify)) : undefined;
  }
  if (valueToSlugify && String(valueToSlugify) !== String(title)) {
    return slugifyHeadline(String(valueToSlugify));
  }
  return slugifyHeadline(String(title)) || undefined;
};

/**
 * Custom slugify function for CdOfTheWeek.
 * Returns the slug pre-computed by setCdOfTheWeekSlugFromRecord (collection beforeChange hook
 * runs before field hooks). Falls back to valueToSlugify if no precomputed slug exists.
 *
 * IMPORTANT: Returns synchronously because Payload's generateSlug wrapper does NOT await
 * Promise results; the async record lookup must happen in the collection-level hook.
 */
export const cdSlugify: Slugify = ({ data, valueToSlugify }) => {
  const precomputedSlug = data?.slug;
  if (typeof precomputedSlug === 'string' && precomputedSlug) {
    return precomputedSlug;
  }
  if (valueToSlugify) return slugifyText(String(valueToSlugify));
  return undefined;
};
