import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';
import {
  enforceUserId,
  rejectDuplicateVote,
  enforceMaxPicks,
} from './hooks/yearEndPollVoteHooks';

/**
 * YearEndPollVotes Collection
 *
 * One record per vote cast. A voter can vote for multiple nominees in a single
 * category (up to the category's maxPicks), so there is one vote record per
 * nominee selected — not one per category submission.
 *
 * Duplicate prevention uses `userId` (the Auth0 sub claim) combined with the
 * category and nominee IDs, matching the same mechanism used by
 * ModernRockMadnessVotes.
 *
 * `nomineeId` stores the Payload-generated ID of the nominee array item in the
 * category's `nominees` array. This is a stable identifier assigned by Payload
 * to each array row.
 *
 * Modelled after ModernRockMadnessVotes.
 */
export const YearEndPollVotes: CollectionConfig = {
  slug: 'year-end-poll-votes',
  labels: {
    singular: 'Vote',
    plural: 'Votes',
  },
  admin: {
    defaultColumns: ['poll', 'category', 'nomineeId', 'userId', 'createdAt'],
    group: 'Polls & Contests',
    description:
      'Individual vote records for Year End Poll categories. Every voter is authenticated via Auth0.',
  },
  access: {
    read: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  hooks: {
    // Run in order: enforce identity → check dupe → check maxPicks
    beforeChange: [enforceUserId, rejectDuplicateVote, enforceMaxPicks],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'poll',
          type: 'relationship',
          relationTo: 'year-end-polls',
          required: true,
          index: true,
          admin: {
            description: 'Poll this vote belongs to',
            width: '50%',
          },
        },
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'year-end-poll-categories',
          required: true,
          index: true,
          admin: {
            description: 'Category this vote was cast in',
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'nomineeId',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description:
          "Payload-assigned ID of the nominee array item in the category's nominees array.",
      },
    },
    {
      name: 'userId',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description:
          'Auth0 user ID (sub claim). Populated server-side from the authenticated user — client-supplied values are overwritten.',
      },
    },
  ],
  timestamps: true,
};
