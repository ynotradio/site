import type { CollectionBeforeChangeHook } from 'payload';

/**
 * Normalize a specific date field to noon UTC before saving.
 *
 * Payload's dayOnly date picker normalizes dates to noon UTC on the client side
 * (setHours(12 - tzOffset)) to keep the calendar date consistent across timezones.
 * This hook applies the same normalization server-side so dates created via the
 * API or seed scripts are stored consistently, ensuring the admin list date filter
 * (which generates an exact equality query) matches stored values.
 */
export function normalizeFieldToNoon(fieldName: string): CollectionBeforeChangeHook {
  return ({ data }) => {
    if (data[fieldName]) {
      const raw = data[fieldName];
      const date = raw instanceof Date ? raw : new Date(raw as string);
      date.setUTCHours(12, 0, 0, 0);
      return { ...data, [fieldName]: date.toISOString() };
    }
    return data;
  };
}

/** Normalize the `date` field to noon UTC. */
export const normalizeDateToNoon: CollectionBeforeChangeHook = normalizeFieldToNoon('date');

/** @deprecated Use `normalizeDateToNoon` instead */
export const normalizeShowDate = normalizeDateToNoon;

/**
 * Require a release date whenever a song is featured on New Music.
 *
 * The New Music page filters on `release_date > CURRENT_DATE - INTERVAL '6 months'`
 * and groups results by that date. A featured song with a null release date fails
 * the comparison (NULL > date is NULL, not true) and has no group to sit in, so it
 * silently never renders despite the checkbox being on.
 *
 * Unfeatured songs may still omit the date — most of the back catalog has none.
 */
export const validateReleaseDateWhenFeatured = (
  value: unknown,
  { siblingData }: { siblingData?: { featureOnNewMusic?: unknown } },
): string | true => {
  if (siblingData?.featureOnNewMusic && !value) {
    return 'A release date is required when "Feature on New Music" is checked, otherwise the song will not appear on the New Music page.';
  }
  return true;
};
