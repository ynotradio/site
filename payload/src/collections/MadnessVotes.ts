import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';

export const ModernRockMadnessVotes: CollectionConfig = {
  slug: 'modern-rock-madness-votes',
  labels: {
    singular: 'Vote',
    plural: 'Votes',
  },
  admin: {
    defaultColumns: ['match', 'group', 'userId', 'createdAt'],
    group: 'Modern Rock Madness',
    description:
      'Individual vote records for tournament matches. Every voter is authenticated via Auth0.',
  },
  access: {
    read: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  fields: [
    {
      name: 'match',
      type: 'relationship',
      relationTo: 'modern-rock-madness-matches',
      required: true,
      index: true,
      admin: {
        description: 'Match this vote was cast in',
      },
    },
    {
      name: 'group',
      type: 'relationship',
      relationTo: 'modern-rock-madness-groups',
      required: true,
      admin: {
        description: 'Group voted for',
      },
    },
    {
      name: 'userId',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description:
          'Auth0 user ID (sub claim). Used as the unique voter identifier for duplicate prevention.',
      },
    },
  ],
  timestamps: true,
};

/** @deprecated Use ModernRockMadnessVotes */
export const MadnessVotes = ModernRockMadnessVotes;
