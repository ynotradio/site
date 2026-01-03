import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';

export const Concerts: CollectionConfig = {
  slug: 'concerts',
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'venue', 'featured', 'updatedAt'],
    group: 'Events',
  },
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
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Should this concert be featured on the homepage?',
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
