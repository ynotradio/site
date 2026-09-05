import type { CollectionConfig } from 'payload';
import { slugField } from 'payload';
import { hasRole } from '../utils/auth';

export const Venues: CollectionConfig = {
  slug: 'venues',
  enableQueryPresets: true,
  labels: {
    singular: 'Venue',
    plural: 'Venues',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'city', 'updatedAt'],
    group: 'Events',
    description: 'Concert venues. Create a venue here, then select it when adding a concert.',
    groupBy: true,
  },
  defaultSort: 'name',
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin', 'editor']),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
    },
    slugField({ useAsSlug: 'name' }),
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
  versions: false,
};
