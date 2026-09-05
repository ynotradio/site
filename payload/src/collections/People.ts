import type { CollectionConfig } from 'payload';
import { slugField } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { hasRole, adminOnlyCondition } from '../utils/auth';
import { legacyIdField } from './shared/legacyIdField';

export const People: CollectionConfig = {
  slug: 'people',
  enableQueryPresets: true,
  labels: {
    singular: 'Person',
    plural: 'People',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'photo', 'slug', 'updatedAt'],
    group: 'People',
    description:
      'Real people behind DJs and reviewers. Create a person here, then link them from a DJ profile.',
    groupBy: true,
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
    slugField({ useAsSlug: 'name' }),
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
        components: {
          Cell: '/payload/src/components/cells/ThumbnailCell#ThumbnailCell',
        },
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
    legacyIdField,
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
  versions: false,
};
