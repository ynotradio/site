import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';

/**
 * YearEndPolls Collection
 *
 * Annual Year End Poll configuration. Each year a new poll is created here,
 * which contains one or more categories (via YearEndPollCategories).
 *
 * Modelled after ModernRockMadnessTournaments — one record drives the whole event.
 */
export const YearEndPolls: CollectionConfig = {
  slug: 'year-end-polls',
  labels: {
    singular: 'Year End Poll',
    plural: 'Year End Polls',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'year', 'status', 'votingOpensAt', 'votingClosesAt', 'updatedAt'],
    group: 'Polls & Contests',
    description: 'Annual Year End Poll configuration. One record per year.',
  },
  access: {
    read: () => true,
    create: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Poll name (e.g., "Y-Not Radio Year End Poll 2025")',
      },
    },
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
          admin: {
            description: 'Poll year',
            width: '20%',
          },
        },
        {
          name: 'slug',
          type: 'text',
          required: true,
          unique: true,
          admin: {
            description: 'URL identifier (e.g., "yep-2025")',
            width: '40%',
          },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'draft',
          index: true,
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Open', value: 'open' },
            { label: 'Closed', value: 'closed' },
            { label: 'Archived', value: 'archived' },
          ],
          admin: {
            description: 'Poll status. Only one poll should be "open" at a time.',
            width: '40%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'votingOpensAt',
          type: 'date',
          admin: {
            description: 'When voting opens',
            date: {
              pickerAppearance: 'dayAndTime',
            },
            width: '50%',
          },
        },
        {
          name: 'votingClosesAt',
          type: 'date',
          admin: {
            description: 'When voting closes',
            date: {
              pickerAppearance: 'dayAndTime',
            },
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'bannerImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Optional banner image for the poll',
      },
    },
  ],
  timestamps: true,
};
