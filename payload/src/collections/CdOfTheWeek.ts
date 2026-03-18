import type { CollectionConfig } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { hasRole, adminOnlyCondition } from '../utils/auth';
import { setCdOfTheWeekSlugFromRecord } from './hooks/slugUtils';

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
    defaultColumns: ['date', 'record', 'reviewer', '_status', 'updatedAt'],
    group: 'Music',
    description:
      'Weekly album reviews. Pick a record, write the review, and set the date — only one should be current at a time.',
  },
  defaultSort: '-date',
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  hooks: {
    beforeChange: [setCdOfTheWeekSlugFromRecord],
  },
  fields: [
    {
      name: 'record',
      type: 'relationship',
      relationTo: 'records',
      required: true,
      admin: {
        description: 'Select the album to review — create it in Records first if needed',
      },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Auto-generated from the associated record slug',
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
            description: 'Who wrote the review? Select from People.',
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
        description: 'The review text shown on the website',
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
