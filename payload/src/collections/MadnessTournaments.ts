import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';

export const MadnessTournaments: CollectionConfig = {
  slug: 'madness-tournaments',
  labels: {
    singular: 'Tournament',
    plural: 'Tournaments',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'year', 'status', 'startDate', 'updatedAt'],
    group: 'Modern Rock Madness',
    description: 'Annual Modern Rock Madness tournament configuration.',
  },
  access: {
    read: () => true,
    create: ({ req }) => hasRole(req.user, ['admin']),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Tournament name (e.g., "Modern Rock Madness 2025")',
      },
    },
    {
      name: 'year',
      type: 'number',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Tournament year',
      },
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
      admin: {
        description: 'Tournament start date',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Complete', value: 'complete' },
      ],
      index: true,
      admin: {
        description: 'Tournament status. Only one tournament should be "active" at a time.',
      },
    },
    {
      name: 'bracketPdfUrl',
      type: 'text',
      admin: {
        description: 'URL to the printable bracket PDF',
      },
    },
    {
      name: 'bannerImageUrl',
      type: 'text',
      admin: {
        description: 'URL to the tournament banner image',
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
