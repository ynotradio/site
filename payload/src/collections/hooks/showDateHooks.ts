import type { CollectionBeforeChangeHook } from 'payload';

/**
 * Normalize a date field to noon UTC before saving.
 *
 * Payload's dayOnly date picker normalizes dates to noon UTC on the client side
 * (setHours(12 - tzOffset)) to keep the calendar date consistent across timezones.
 * This hook applies the same normalization server-side so dates created via the
 * API or seed scripts are stored consistently, ensuring the admin list date filter
 * (which generates an exact equality query) matches stored values.
 */
export const normalizeDateToNoon: CollectionBeforeChangeHook = ({ data }) => {
  if (data.date) {
    const raw = data.date;
    const date = raw instanceof Date ? raw : new Date(raw as string);
    date.setUTCHours(12, 0, 0, 0);
    return { ...data, date: date.toISOString() };
  }
  return data;
};

/** @deprecated Use `normalizeDateToNoon` instead */
export const normalizeShowDate = normalizeDateToNoon;
