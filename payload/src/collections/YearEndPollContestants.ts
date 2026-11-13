import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';

export const YearEndPollContestants: CollectionConfig = {
  slug: 'year-end-poll-contestants',
  defaultSort: '-createdAt',
  enableQueryPresets: true,
  labels: {
    singular: 'Contestant',
    plural: 'Contestants',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: [
      'name',
      'email',
      'phone',
      'hometown',
      'enteredContest',
      'newsletterOptIn',
      'createdAt',
    ],
    group: 'Polls & Contests',
    description: 'Prize entries from voters who finished the first two rows of polls.',
    groupBy: true,
  },
  access: {
    read: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    create: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin', 'editor']),
  },
  fields: [
    {
      name: 'poll',
      type: 'relationship',
      relationTo: 'year-end-polls',
      required: true,
      index: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: { width: '50%' },
        },
        { name: 'hometown', type: 'text', admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'email',
          type: 'email',
          required: true,
          index: true,
          admin: { width: '50%' },
        },
        {
          name: 'phone',
          type: 'text',
          index: true,
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'enteredContest',
          type: 'checkbox',
          defaultValue: true,
          admin: { width: '25%' },
        },
        {
          name: 'newsletterOptIn',
          type: 'checkbox',
          defaultValue: false,
          admin: { width: '25%' },
        },
        {
          name: 'userId',
          type: 'text',
          index: true,
          admin: { width: '50%', description: 'Auth0 user ID of the voter.' },
        },
      ],
    },
  ],
  timestamps: true,
};
