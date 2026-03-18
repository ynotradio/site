import type { CollectionConfig } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { hasRole, adminOnlyCondition } from '../utils/auth';

export const Shows: CollectionConfig = {
  slug: 'shows',
  labels: {
    singular: 'Show',
    plural: 'Shows',
  },
  admin: {
    useAsTitle: 'date',
    defaultColumns: ['date', 'startTime', 'endTime', 'host', 'updatedAt'],
    group: 'Radio',
    description:
      'Weekly show schedule. Each entry is one time slot. Use Show Cloner to copy a full week to new dates.',

    components: {
      beforeList: ['/payload/src/features/show-cloner/ShowsListHeader#ShowsListHeader'],
    },
  },
  defaultSort: '-date',
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor', 'dj']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
          index: true,
          admin: {
            description: 'Show date',
            date: {
              displayFormat: 'yyyy-MM-dd',
            },
            width: '40%',
          },
        },
        {
          name: 'startTime',
          type: 'text',
          required: true,
          admin: {
            description: 'Start time',
            placeholder: 'HH:MM',
            width: '30%',
          },
        },
        {
          name: 'endTime',
          type: 'text',
          required: true,
          admin: {
            description: 'End time',
            placeholder: 'HH:MM',
            width: '30%',
          },
        },
      ],
    },
    {
      name: 'name',
      type: 'text',
      admin: {
        description: 'Show name (optional - use when show has a specific name)',
      },
    },
    {
      name: 'host',
      type: 'relationship',
      relationTo: 'djs',
      admin: {
        description: 'Which DJ is on air during this time slot?',
      },
    },
    {
      name: 'note',
      type: 'richText',
      editor: lexicalEditor(),
      admin: {
        description: 'Notes shown alongside this time slot (e.g., "Best Of" episode, guest DJ)',
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
