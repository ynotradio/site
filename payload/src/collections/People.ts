import type { CollectionConfig } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { hasRole } from '../utils/auth';
import { slugify } from '../utils/slugify';

export const People: CollectionConfig = {
  slug: 'people',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
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
      name: 'bio',
      type: 'richText',
      editor: lexicalEditor(),
      admin: {
        description: 'Biography or description',
      },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Profile photo',
      },
    },
    {
      name: 'djRecord',
      type: 'relationship',
      relationTo: 'djs',
      admin: {
        description: 'Link to DJ profile if this person is/was a DJ',
        position: 'sidebar',
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
