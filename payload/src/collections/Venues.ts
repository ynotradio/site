import type { CollectionConfig } from 'payload';
import { slugField } from 'payload';
import { hasRole } from '../utils/auth';

export const Venues: CollectionConfig = {
  slug: 'venues',
  labels: {
    singular: 'Venue',
    plural: 'Venues',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'city', 'updatedAt'],
    defaultSort: 'name',
    group: 'Events',
    description: 'Concert venues and locations.',
  },
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
    },
    slugField(),
    {
      type: 'row',
      fields: [
        {
          name: 'address',
          type: 'text',
          admin: {
            description: 'Street address',
            width: '60%',
          },
        },
        {
          name: 'city',
          type: 'text',
          index: true,
          admin: {
            description: 'City',
            width: '40%',
          },
        },
      ],
    },
    {
      name: 'website',
      type: 'text',
      admin: {
        description: 'Venue website URL',
        placeholder: 'https://',
      },
    },

  ],
  timestamps: true,
};
