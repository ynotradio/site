import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';
import { slugify } from '../utils/slugify';

export const Songs: CollectionConfig = {
  slug: 'songs',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'artist', 'releaseDate', 'updatedAt'],
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
        description: 'Song title',
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
      admin: {
        description: 'Artist or band who performed the song',
      },
    },
    {
      name: 'streamUrl',
      type: 'text',
      admin: {
        description: 'URL for streaming the song',
      },
    },
    {
      name: 'releaseDate',
      type: 'date',
      admin: {
        description: 'Date the song was released',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'featureOnNewMusic',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Should this song be featured on the New Music page?',
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
