import type { CollectionConfig } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { hasRole, adminOnlyCondition } from '../utils/auth';

export const CdOfTheWeek: CollectionConfig = {
  slug: 'cdoftheweek',
  labels: {
    singular: 'CD of the Week',
    plural: 'CDs of the Week',
  },
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: 'date',
    defaultColumns: ['date', 'record', 'reviewer', 'updatedAt'],
    group: 'Music',
    description: 'Weekly album reviews featured as CD of the Week.',
  },
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  fields: [
    {
      name: 'record',
      type: 'relationship',
      relationTo: 'records',
      required: true,
      admin: {
        description: 'Album being reviewed',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
          index: true,
          admin: {
            description: 'Review date',
            date: {
              displayFormat: 'yyyy-MM-dd',
            },
            width: '40%',
          },
        },
        {
          name: 'reviewer',
          type: 'relationship',
          relationTo: 'people',
          admin: {
            description: 'Reviewer',
            width: '60%',
          },
        },
      ],
    },
    {
      name: 'review',
      type: 'richText',
      editor: lexicalEditor(),
      required: true,
      admin: {
        description: 'Album review content',
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
        condition: adminOnlyCondition,
      },
    },
    {
      name: 'migratedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Timestamp of migration from MySQL',
        condition: adminOnlyCondition,
      },
    },
  ],
  timestamps: true,
};
