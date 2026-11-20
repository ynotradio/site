import type { CollectionBeforeChangeHook } from 'payload';

type NomineeRow = {
  song?: unknown;
  record?: unknown;
  artist?: unknown;
  concert?: unknown;
  customLabel?: unknown;
};

export const appendBulkNominees: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const { bulkNominees, ...rest } = data;
  if (typeof bulkNominees !== 'string' || bulkNominees.trim() === '') return rest;

  const nominees: NomineeRow[] = Array.isArray(data.nominees)
    ? data.nominees
    : (originalDoc?.nominees ?? []);
  const seen = new Set(
    nominees
      .map((row) => (typeof row.customLabel === 'string' ? row.customLabel.trim().toLowerCase() : ''))
      .filter(Boolean),
  );

  const added: NomineeRow[] = [];
  bulkNominees.split(/\r?\n/).forEach((line) => {
    const label = line.trim();
    const key = label.toLowerCase();
    if (!label || seen.has(key)) return;
    seen.add(key);
    added.push({ customLabel: label });
  });

  return { ...rest, nominees: [...nominees, ...added] };
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
