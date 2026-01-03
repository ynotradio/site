import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';

export const OnDemand: CollectionConfig = {
  slug: 'ondemand',
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'artist', 'updatedAt'],
    group: 'Radio',
  },
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor', 'dj']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Title of the on-demand content',
      },
    },
    {
      name: 'artist',
      type: 'relationship',
      relationTo: 'artists',
      admin: {
        description: 'Featured artist or band',
      },
    },
    {
      name: 'streamUrl',
      type: 'text',
      required: true,
      admin: {
        description: 'URL for streaming the content',
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
