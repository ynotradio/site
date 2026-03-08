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
    defaultColumns: ['date', 'record', 'reviewer', '_status', 'updatedAt'],
    defaultSort: '-date',
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
      name: 'review',
      type: 'richText',
      editor: lexicalEditor(),
      required: true,
      admin: {
        description: 'Album review content',
      },
    },
    {
      name: 'reviewer',
      type: 'relationship',
      relationTo: 'people',
      admin: {
        description: 'Person who reviewed this album',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      index: true,
      admin: {
        description: 'Date of the review',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
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
