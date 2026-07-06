import type { CollectionBeforeChangeHook } from 'payload';

type NomineeRow = {
  song?: unknown;
  record?: unknown;
  artist?: unknown;
  concert?: unknown;
  customLabel?: unknown;
};

/**
 * Validates that every nominee row in a YearEndPollCategory has at least one
 * typed field populated (song, record, artist, concert, or customLabel).
 *
 * Empty rows would be unvoteable and confusing in the admin UI, and could
 * receive orphaned votes that are impossible to display.
 */
export const validateNominees: CollectionBeforeChangeHook = ({ data }) => {
  const nominees: NomineeRow[] = Array.isArray(data.nominees) ? data.nominees : [];

  for (let i = 0; i < nominees.length; i += 1) {
    const row = nominees[i];
    const hasValue = row.song != null
      || row.record != null
      || row.artist != null
      || row.concert != null
      || (typeof row.customLabel === 'string' && row.customLabel.trim() !== '');

    if (!hasValue) {
      throw new Error(
        `Nominee at position ${i + 1} must have at least one field populated (song, record, artist, concert, or customLabel).`,
      );
    }
  }

  return data;
};
