import type { CollectionConfig } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { hasRole, adminOnlyCondition } from '../utils/auth';
import { normalizeShowDate } from './hooks/showDateHooks';
import { legacyIdField } from './shared/legacyIdField';

export const Shows: CollectionConfig = {
  slug: 'shows',
  enableQueryPresets: true,
  labels: {
    singular: 'Show',
    plural: 'Shows',
  },
  admin: {
    useAsTitle: 'date',
    defaultColumns: ['date', 'startTime', 'endTime', 'host', 'name', 'updatedAt'],
    group: 'Radio',
    description:
      'Weekly show schedule. Each entry is one time slot. Use Show Cloner to copy a full week to new dates.',
    groupBy: true,
    components: {
      beforeList: ['/payload/src/features/show-cloner/ShowsListHeader#ShowsListHeader'],
    },
  },
  defaultSort: 'date',
  hooks: {
    beforeChange: [normalizeShowDate],
  },
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor', 'dj']),
    delete: ({ req }) => hasRole(req.user, ['admin', 'editor']),
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
              pickerAppearance: 'dayOnly',
            },
            width: '40%',
          },
        },
        {
          name: 'startTime',
          type: 'text',
          label: 'Start time',
          required: true,
          admin: {
            width: '30%',
            components: {
              Field: '/payload/src/components/fields/TimePickerField#TimePickerField',
              Cell: '/payload/src/components/cells/TimeCell#TimeCell',
            },
          },
        },
        {
          name: 'endTime',
          type: 'text',
          label: 'End time',
          required: true,
          admin: {
            width: '30%',
            components: {
              Field: '/payload/src/components/fields/TimePickerField#TimePickerField',
              Cell: '/payload/src/components/cells/TimeCell#TimeCell',
            },
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
    legacyIdField,
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
