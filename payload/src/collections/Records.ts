import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';
import { slugify } from '../utils/slugify';

export const Records: CollectionConfig = {
  slug: 'records',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'artist', 'label', 'releaseDate', 'updatedAt'],
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
          if (data?.title && (!data?.slug || data.slug === '')) {
            data.slug = slugify(data.title);
          }
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Album title',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Auto-generated from title, but can be customized',
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
      name: 'artist',
      type: 'relationship',
      relationTo: 'artists',
      required: true,
      admin: {
        description: 'Artist or band who released the album',
      },
    },
    {
      name: 'label',
      type: 'text',
      admin: {
        description: 'Record label',
      },
    },
    {
      name: 'releaseDate',
      type: 'date',
      admin: {
        description: 'Date the album was released',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Album cover image',
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
