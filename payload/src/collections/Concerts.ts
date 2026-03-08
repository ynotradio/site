import type { CollectionConfig } from 'payload';
import { hasRole, adminOnlyCondition } from '../utils/auth';

export const Concerts: CollectionConfig = {
  slug: 'concerts',
  labels: {
    singular: 'Concert',
    plural: 'Concerts',
  },
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['artists', 'date', 'venue', 'featured', '_status', 'updatedAt'],
    group: 'Events',
    description: 'Concert listings. Filter by "featured" to see homepage concerts.',
  },
  defaultSort: 'date',
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Optional custom title for the concert (falls back to artist names)',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      index: true,
      admin: {
        description: 'Concert date',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'artists',
      type: 'relationship',
      relationTo: 'artists',
      hasMany: true,
      required: true,
      admin: {
        description: 'Performing artists or bands',
      },
    },
    {
      name: 'venue',
      type: 'relationship',
      relationTo: 'venues',
      required: true,
      admin: {
        description: 'Concert venue',
      },
    },
    {
      name: 'ticketInfo',
      type: 'textarea',
      admin: {
        description: 'Ticket pricing and availability information',
      },
    },
    {
      name: 'ticketUrl',
      type: 'text',
      admin: {
        description: 'URL to purchase tickets',
        placeholder: 'https://',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Feature on the homepage?',
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
