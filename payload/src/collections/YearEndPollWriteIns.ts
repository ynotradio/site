import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';

export const YearEndPollWriteIns: CollectionConfig = {
  slug: 'year-end-poll-write-ins',
  defaultSort: '-createdAt',
  enableQueryPresets: true,
  labels: {
    singular: 'Write-in',
    plural: 'Write-ins',
  },
  admin: {
    useAsTitle: 'writeIn',
    defaultColumns: ['writeIn', 'category', 'poll', 'createdAt'],
    group: 'Polls & Contests',
    description: 'Write-in answers voters typed instead of picking a nominee.',
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
      type: 'row',
      fields: [
        {
          name: 'poll',
          type: 'relationship',
          relationTo: 'year-end-polls',
          required: true,
          index: true,
          admin: { width: '50%' },
        },
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'year-end-poll-categories',
          required: true,
          index: true,
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'writeIn',
      type: 'text',
      required: true,
    },
    {
      name: 'userId',
      type: 'text',
      index: true,
      admin: { description: 'Auth0 user ID of the voter.' },
    },
  ],
  timestamps: true,
};
