import type { CollectionConfig } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { hasRole, adminOnlyCondition } from '../utils/auth';
import { normalizeShowDate } from './hooks/showDateHooks';

function formatShowTitle(
  date: string | Date | null | undefined,
  startTime?: string,
  endTime?: string,
): string {
  if (!date) return 'Untitled show';
  const d = new Date(date);
  const datePart = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  if (!startTime) return datePart;
  const timePart = endTime ? `${startTime}–${endTime}` : startTime;
  return `${datePart} · ${timePart}`;
}

export const Shows: CollectionConfig = {
  slug: 'shows',
  enableQueryPresets: true,
  labels: {
    singular: 'Show',
    plural: 'Shows',
  },
  admin: {
    useAsTitle: 'title',
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
    afterRead: [
      ({ doc }) => ({
        ...doc,
        title: formatShowTitle(doc.date, doc.startTime, doc.endTime),
      }),
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
      name: 'title',
      type: 'text',
      virtual: true,
      admin: { hidden: true },
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
