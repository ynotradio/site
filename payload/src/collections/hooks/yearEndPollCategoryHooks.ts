import type { CollectionBeforeChangeHook } from 'payload';
import { parseNomineeList } from './parseNomineeList';

type NomineeRow = {
  id?: unknown;
  song?: unknown;
  record?: unknown;
  artist?: unknown;
  concert?: unknown;
  customLabel?: unknown;
  voteCount?: unknown;
};

/** Set on req.context by the vote tally so its own count changes go through. */
export const UPDATING_VOTE_COUNT = 'yearEndPollUpdatingVoteCount';

/**
 * Votes bump each nominee's voteCount outside the admin form (yearendpoll.php
 * writes it directly), so an admin save would put back whatever counts the
 * form loaded. Existing rows keep their stored count on every update except
 * the vote tally's own. Counts are re-read here, as the last hook, because
 * originalDoc was loaded before the nominee lookups, which can take seconds.
 */
export const keepVoteCounts: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  if (
    operation !== 'update'
    || req.context?.[UPDATING_VOTE_COUNT]
    || !Array.isArray(data.nominees)
  ) {
    return data;
  }
  const current = originalDoc?.id == null
    ? originalDoc
    : await req.payload.findByID({
      collection: 'year-end-poll-categories',
      id: originalDoc.id,
      depth: 0,
      select: { nominees: { id: true, voteCount: true } },
      req,
    });
  const stored = new Map<unknown, unknown>(
    ((current?.nominees ?? []) as NomineeRow[]).map((row) => [row.id, row.voteCount]),
  );
  const withStoredCount = (row: NomineeRow): NomineeRow => {
    if (row.id == null || !stored.has(row.id)) return row;
    return { ...row, voteCount: stored.get(row.id) ?? 0 };
  };
  return { ...data, nominees: (data.nominees as NomineeRow[]).map(withStoredCount) };
};

const LINKABLE = {
  songs: { collection: 'songs', field: 'song', nameField: 'displayName' },
  albums: { collection: 'records', field: 'record', nameField: 'displayName' },
  artists: { collection: 'artists', field: 'artist', nameField: 'name' },
  concerts: { collection: 'concerts', field: 'concert', nameField: 'titlePlain' },
} as const;

const comparable = (value: unknown) => String(value ?? '')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim();

const idOf = (value: unknown): string | null => {
  if (value == null) return null;
  if (typeof value === 'object') return idOf((value as { id?: unknown }).id);
  return String(value);
};

type Link = (typeof LINKABLE)[keyof typeof LINKABLE];

const findExactMatch = async (
  req: Parameters<CollectionBeforeChangeHook>[0]['req'],
  link: Link,
  label: string,
): Promise<number | string | null> => {
  const exactMatches = async (operator: 'equals' | 'like') => {
    const { docs } = await req.payload.find({
      collection: link.collection,
      where: { [link.nameField]: { [operator]: label } },
      depth: 0,
      pagination: false,
      req,
    });
    return docs.filter((doc) => {
      const name = (doc as unknown as Record<string, unknown>)[link.nameField];
      return comparable(name) === comparable(label);
    });
  };
  // `equals` is case-sensitive; `like` catches case and spacing differences.
  let exact = await exactMatches('equals');
  if (exact.length === 0) exact = await exactMatches('like');
  return exact.length === 1 ? exact[0].id : null;
};

/**
 * Adds one nominee per pasted/uploaded line. In a songs, albums, artists or
 * concerts category a line that matches exactly one existing document by name
 * is linked to it; anything else becomes a custom-label nominee. Lines already
 * on the list are skipped.
 */
export const appendBulkNominees: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const { bulkNominees, ...rest } = data;
  if (typeof bulkNominees !== 'string' || bulkNominees.trim() === '') return rest;

  const nominees: NomineeRow[] = Array.isArray(data.nominees)
    ? data.nominees
    : (originalDoc?.nominees ?? []);
  const link = LINKABLE[(data.categoryType ?? originalDoc?.categoryType) as keyof typeof LINKABLE];
  const seen = new Set<string>();
  nominees.forEach((row) => {
    if (typeof row.customLabel === 'string' && row.customLabel.trim()) {
      seen.add(`label:${comparable(row.customLabel)}`);
    }
    const linkedId = link && idOf(row[link.field]);
    if (link && linkedId) seen.add(`${link.field}:${linkedId}`);
  });

  const added: NomineeRow[] = [];
  const lines = parseNomineeList(bulkNominees);
  for (let i = 0; i < lines.length; i += 1) {
    const label = lines[i];
    // eslint-disable-next-line no-await-in-loop
    const match = link ? await findExactMatch(req, link, label) : null;
    const key = match ? `${link!.field}:${match}` : `label:${comparable(label)}`;
    if (!seen.has(key)) {
      seen.add(key);
      added.push(match ? { [link!.field]: match } : { customLabel: label });
    }
  }

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
