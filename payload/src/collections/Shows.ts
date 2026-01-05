import type { CollectionConfig } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { hasRole } from '../utils/auth';

export const Shows: CollectionConfig = {
  slug: 'shows',
  admin: {
    useAsTitle: 'date',
    defaultColumns: ['date', 'startTime', 'endTime', 'host', 'updatedAt'],
    group: 'Radio',
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Auto-derive day from date
        if (data.date) {
          const dateObj = new Date(data.date);
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          data.day = days[dateObj.getDay()];
        }
        return data;
      },
    ],
  },
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor', 'dj']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
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
      },
    },

    {
      name: 'startTime',
      type: 'text',
      required: true,
      admin: {
        description: 'Start time (HH:MM format)',
      },
    },
    {
      name: 'endTime',
      type: 'text',
      required: true,
      admin: {
        description: 'End time (HH:MM format)',
      },
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
        description: 'DJ hosting the show (optional)',
      },
    },
    {
      name: 'note',
      type: 'richText',
      editor: lexicalEditor(),
      admin: {
        description: 'Additional notes or special information',
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
