import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';

export const MadnessVotes: CollectionConfig = {
  slug: 'madness-votes',
  labels: {
    singular: 'Vote',
    plural: 'Votes',
  },
  admin: {
    defaultColumns: ['match', 'band', 'voterIp', 'createdAt'],
    group: 'Modern Rock Madness',
    description: 'Individual vote records for tournament matches.',
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
      relationTo: 'madness-matches',
      required: true,
      index: true,
      admin: {
        description: 'Match this vote was cast in',
      },
    },
    {
      name: 'band',
      type: 'relationship',
      relationTo: 'madness-bands',
      required: true,
      admin: {
        description: 'Band voted for',
      },
    },
    {
      name: 'voterIp',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Voter IP address (used for duplicate prevention)',
      },
    },
    {
      name: 'voterEmail',
      type: 'email',
      index: true,
      admin: {
        description: 'Voter email address (if authenticated)',
      },
    },
    {
      name: 'legacyId',
      type: 'number',
      unique: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Original MySQL ID for migration tracking',
      },
    },
    {
      name: 'migratedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Timestamp of migration from MySQL',
      },
    },
  ],
  timestamps: true,
};
