import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';

/**
 * YearEndPollVotes Collection
 *
 * One record per vote cast. A voter can vote for multiple nominees in a single
 * category (up to the category's maxPicks), so there is one vote record per
 * nominee selected — not one per category submission.
 *
 * Duplicate prevention uses `userId` (the voter's IP address, matching the
 * legacy PHP model) combined with the category and nominee IDs. This differs
 * from ModernRockMadnessVotes which uses an Auth0 sub claim.
 *
 * `nomineeId` stores the Payload-generated ID of the nominee array item in the
 * category's `nominees` array. This is a stable identifier assigned by Payload
 * to each array row.
 *
 * `userId` is the voter identity token used for duplicate prevention. It is set
 * to the voter's IP address to match the legacy PHP model. `ipAddress` stores the
 * same raw IP separately so it remains available for auditing even if `userId`
 * is later changed to a different identifier (e.g., a session token).
 *
 * Voting is public (no authentication required), unlike MRM which requires Auth0.
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
      'Individual vote records for Year End Poll categories. One record per nominee selected.',
  },
  access: {
    read: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    create: () => true, // Public voting — no authentication required (IP-based deduplication)
    update: ({ req }) => hasRole(req.user, ['admin']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
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
          'Voter identifier used for duplicate prevention. Stores the voter\'s IP address, matching the legacy PHP model (unlike MRM which uses an Auth0 sub claim).',
      },
    },
    {
      name: 'ipAddress',
      type: 'text',
      admin: {
        description: 'Raw IP address of the voter for auditing purposes.',
      },
    },
  ],
  timestamps: true,
};
