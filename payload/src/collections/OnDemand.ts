import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';

export const OnDemand: CollectionConfig = {
  slug: 'ondemand',
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: 'headline',
    defaultColumns: ['headline', 'date', 'updatedAt'],
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
      name: 'date',
      type: 'date',
      required: true,
      index: true,
      admin: {
        description: 'Date of the on-demand recording',
      },
    },
    {
      name: 'image',
      type: 'text',
      required: true,
      admin: {
        description: 'URL of the image/thumbnail',
      },
    },
    {
      name: 'headline',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Headline/title of the on-demand content',
      },
    },
    {
      name: 'note',
      type: 'text',
      required: true,
      admin: {
        description: 'Description or note about the content',
      },
    },
    {
      name: 'songs',
      type: 'text',
      required: true,
      admin: {
        description: 'List of songs performed',
      },
    },
    {
      name: 'audioUrl',
      type: 'text',
      required: true,
      admin: {
        description: 'Audio stream identifier (e.g., OpenDrive ID)',
      },
    },
    {
      name: 'source',
      type: 'text',
      admin: {
        description: 'Source platform (e.g., opendrive)',
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
