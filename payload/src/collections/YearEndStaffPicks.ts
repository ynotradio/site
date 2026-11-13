import type { CollectionConfig, Field } from 'payload';
import { hasRole } from '../utils/auth';
import { appendPastedPicks } from './hooks/yearEndStaffPickHooks';

const pickList = (name: 'songs' | 'albums', label: string): Field[] => [
  {
    name,
    type: 'array',
    labels: { singular: label, plural: `${label}s` },
    admin: { description: 'In ranked order. Drag rows to reorder.' },
    fields: [
      {
        type: 'row',
        fields: [
          { name: 'artist', type: 'text', admin: { width: '50%' } },
          {
            name: 'title',
            type: 'text',
            required: true,
            admin: { width: '50%' },
          },
        ],
      },
    ],
  },
  {
    name: `${name}Paste`,
    type: 'textarea',
    virtual: true,
    admin: {
      description: `Paste ${name} one per line as Artist - Title or Artist "Title", then save. They're added to the end of the list.`,
    },
  },
];

export const YearEndStaffPicks: CollectionConfig = {
  slug: 'year-end-staff-picks',
  defaultSort: 'sortOrder',
  enableQueryPresets: true,
  labels: {
    singular: 'Staff Pick',
    plural: 'Staff Picks',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'year', 'showName', 'sortOrder', 'updatedAt'],
    group: 'Polls & Contests',
    description:
      "Each staff member's favorite songs and albums of the year, shown on the Staff Picks page.",
    groupBy: true,
  },
  access: {
    read: () => true,
    create: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin', 'editor']),
  },
  hooks: {
    beforeChange: [appendPastedPicks],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'year',
          type: 'number',
          required: true,
          index: true,
          min: 2000,
          max: 2100,
          defaultValue: () => new Date().getFullYear(),
          admin: { width: '20%' },
        },
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: { width: '40%' },
        },
        {
          name: 'dj',
          type: 'relationship',
          relationTo: 'djs',
          admin: { width: '40%', description: 'Optional link to their DJ profile.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'showName',
          type: 'text',
          admin: { width: '50%', description: 'Shown in italics under the name.' },
        },
        {
          name: 'sortOrder',
          type: 'number',
          defaultValue: 100,
          admin: { width: '50%', description: 'Lower numbers show first.' },
        },
      ],
    },
    {
      name: 'details',
      type: 'textarea',
      admin: { description: 'Role and time slot, one per line (e.g. "Music Director").' },
    },
    {
      name: 'mixcloudUrls',
      type: 'textarea',
      admin: {
        description:
          'Mixcloud show links, one per line (best-of show first). Each shows as a mini player.',
      },
    },
    ...pickList('songs', 'Song'),
    ...pickList('albums', 'Album'),
  ],
  timestamps: true,
};
