import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';

export const Top11WriteIns: CollectionConfig = {
  slug: 'top11-write-ins',
  enableRichTextLink: false,
  enableRichTextRelationship: false,
  enableQueryPresets: true,
  labels: {
    singular: 'Top 11 Write-in',
    plural: 'Top 11 Write-ins',
  },
  admin: {
    defaultColumns: ['contest', 'writeIn', 'voterEmail', 'display', 'createdAt'],
    group: 'Top 11',
    description: 'Write-in submissions for Top 11 contests.',
    groupBy: true,
  },
  access: {
    read: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    create: () => true,
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin', 'editor']),
  },
  fields: [
    {
      name: 'contest',
      type: 'relationship',
      relationTo: 'top11-contests',
      required: true,
      index: true,
    },
    {
      name: 'writeIn',
      type: 'text',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'voterEmail',
          type: 'email',
          admin: {
            width: '50%',
          },
        },
        {
          name: 'display',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            width: '50%',
            description: 'Internal visibility toggle for moderation.',
          },
        },
      ],
    },
  ],
  timestamps: true,
};
