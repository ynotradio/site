import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';
import { slugify } from '../utils/slugify';

export const Venues: CollectionConfig = {
  slug: 'venues',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'city', 'updatedAt'],
  },
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        if (operation === 'create' || operation === 'update') {
          if (data?.name && (!data?.slug || data.slug === '')) {
            data.slug = slugify(data.name);
          }
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Auto-generated from name, but can be customized',
      },
      validate: (value) => {
        if (!value) return true;
        if (!/^[a-z0-9-]+$/.test(value)) {
          return 'Slug must contain only lowercase letters, numbers, and hyphens';
        }
        return true;
      },
    },
    {
      name: 'address',
      type: 'text',
      admin: {
        description: 'Street address',
      },
    },
    {
      name: 'city',
      type: 'text',
      index: true,
      admin: {
        description: 'City name',
      },
    },
    {
      name: 'website',
      type: 'text',
      admin: {
        description: 'Venue website URL',
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
