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
    description:
      'Concert listings. Toggle "Featured" in the sidebar to promote a show on the homepage.',
  },
  defaultSort: '-date',
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
        description: 'Who is playing? Select one or more artists from the catalog.',
      },
    },
    {
      name: 'venue',
      type: 'relationship',
      relationTo: 'venues',
      required: true,
      admin: {
        description: 'Where is it? Select a venue or create one first.',
      },
    },
    {
      name: 'ticketInfo',
      type: 'textarea',
      admin: {
        description: 'Pricing details shown on the website (e.g., "$25 advance, $30 door")',
      },
    },
    {
      name: 'ticketUrl',
      type: 'text',
      admin: {
        description: 'Link to the ticket purchase page — visitors see a "Buy Tickets" button',
        placeholder: 'https://',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'When checked, this concert is promoted on the homepage',
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
