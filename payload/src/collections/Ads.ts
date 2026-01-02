import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';

export const Ads: CollectionConfig = {
  slug: 'ads',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'startDate', 'endDate', 'priority', 'updatedAt'],
    group: 'Marketing',
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
      admin: {
        description: 'Sponsor or advertisement name',
      },
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
      admin: {
        description: 'When the ad should start displaying',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'endDate',
      type: 'date',
      required: true,
      admin: {
        description: 'When the ad should stop displaying',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Advertisement image',
      },
    },
    {
      name: 'imageUrl',
      type: 'text',
      admin: {
        description: 'Legacy image URL (for migration)',
      },
    },
    {
      name: 'webUrl',
      type: 'text',
      admin: {
        description: 'URL where ad should link to',
      },
    },
    {
      name: 'priority',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Display priority (higher numbers appear first)',
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
