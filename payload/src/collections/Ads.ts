import type { CollectionConfig } from 'payload';
import { hasRole, adminOnlyCondition } from '../utils/auth';

export const Ads: CollectionConfig = {
  slug: 'ads',
  labels: {
    singular: 'Advertisement',
    plural: 'Advertisements',
  },
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'image', 'startDate', 'endDate', 'priority', '_status', 'updatedAt'],
    defaultSort: '-priority',
    group: 'Marketing',
    description: 'Advertisement and sponsor management.',
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
        components: {
          Cell: '/payload/src/components/cells/ThumbnailCell#ThumbnailCell',
        },
      },
    },
    {
      name: 'imageUrl',
      type: 'text',
      admin: {
        description: 'Legacy image URL (for migration)',
        condition: adminOnlyCondition,
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
        condition: adminOnlyCondition,
      },
    },
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
};
