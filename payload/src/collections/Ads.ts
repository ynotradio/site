import type { CollectionConfig } from 'payload';
import { hasRole, adminOnlyCondition } from '../utils/auth';
import { normalizeFieldToNoon } from './hooks/showDateHooks';

export const Ads: CollectionConfig = {
  slug: 'ads',
  enableRichTextLink: false,
  enableRichTextRelationship: false,
  enableQueryPresets: true,
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
    group: 'Marketing',
    description:
      'Site advertisements. Each ad is visible between its start and end dates. Higher priority appears first.',
    groupBy: true,
  },
  defaultSort: ['-startDate', '-priority'],
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
      admin: {
        description: 'Sponsor or advertisement name',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
          admin: {
            description: 'Ad is visible on the site starting this date',
            date: {
              displayFormat: 'yyyy-MM-dd',
              pickerAppearance: 'dayOnly',
            },
            width: '50%',
          },
        },
        {
          name: 'endDate',
          type: 'date',
          required: true,
          admin: {
            description: 'Ad is removed from the site after this date',
            date: {
              displayFormat: 'yyyy-MM-dd',
              pickerAppearance: 'dayOnly',
            },
            width: '50%',
          },
        },
      ],
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
        placeholder: 'https://',
      },
    },
    {
      name: 'priority',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Display order — higher numbers appear first. Same priority sorts by date.',
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
  hooks: {
    beforeChange: [normalizeFieldToNoon('startDate'), normalizeFieldToNoon('endDate')],
  },
  timestamps: true,
};
