import type { CollectionBeforeChangeHook } from 'payload';

/** Matches the `defaultValue` on the `maxPicks` field in YearEndPollCategories. */
const DEFAULT_MAX_PICKS = 3;

/**
 * Overwrites the client-supplied `userId` with the server-verified Auth0 sub
 * claim (or the Payload user id as a fallback). This prevents a logged-in user
 * from spoofing another user's identity when casting a vote.
 *
 * Must run before the duplicate-check hook so that `data.userId` is already
 * canonical when the database query runs.
 */
export const enforceUserId: CollectionBeforeChangeHook = ({ data, req }) => {
  const user = req.user as Record<string, unknown> | null;
  if (!user) {
    throw new Error('Authentication required to cast a vote.');
  }
  const resolvedUserId = (user.sub as string | undefined) || String(user.id);
  return { ...data, userId: resolvedUserId };
};

/**
 * Rejects a create operation when the (category, nomineeId, userId) triple
 * already exists in the database. The DB-level unique index is the hard
 * guarantee; this hook provides a clean API error instead of a constraint
 * violation.
 */
export const rejectDuplicateVote: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation !== 'create') return data;

  const { payload } = req;
  const categoryId = typeof data.category === 'object' ? data.category?.id : data.category;

  const existing = await payload.find({
    collection: 'year-end-poll-votes',
    where: {
      and: [
        { category: { equals: categoryId } },
        { nomineeId: { equals: data.nomineeId } },
        { userId: { equals: data.userId } },
      ],
    },
    limit: 1,
  });

  if (existing.totalDocs > 0) {
    throw new Error('You have already voted for this nominee.');
  }

  return data;
};

/**
 * Rejects a create operation when the voter has already reached the category's
 * `maxPicks` limit. This is a server-side safeguard; the DB unique index does
 * not cover the per-voter-per-category count.
 */
export const enforceMaxPicks: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation !== 'create') return data;

  const { payload } = req;
  const categoryId = typeof data.category === 'object' ? data.category?.id : data.category;

  const categoryDoc = await payload.findByID({
    collection: 'year-end-poll-categories',
    id: categoryId as string | number,
  });

  const maxPicks = (categoryDoc as { maxPicks?: number }).maxPicks ?? DEFAULT_MAX_PICKS;

  const existing = await payload.find({
    collection: 'year-end-poll-votes',
    where: {
      and: [{ category: { equals: categoryId } }, { userId: { equals: data.userId } }],
    },
    limit: 0,
  });

  if (existing.totalDocs >= maxPicks) {
    throw new Error(`Maximum of ${maxPicks} pick(s) reached for this category.`);
  }

  return data;
};
