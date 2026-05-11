import type { CollectionConfig } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { hasRole, adminOnlyCondition } from '../utils/auth';
import { generateDJDisplayName } from './hooks/displayNameHooks';

export const DJs: CollectionConfig = {
  slug: 'djs',
  enableQueryPresets: true,
  labels: {
    singular: 'DJ',
    plural: 'DJs',
  },
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'photo', 'onAir', 'sortOrder', '_status', 'updatedAt'],
    group: 'Radio',
    description:
      'DJ profiles shown on the website. Toggle "On Air" to control visibility. Use the DJ Order tool to set listing position.',
    groupBy: true,
    components: {
      beforeList: ['/payload/src/features/dj-order/DJsListHeader#DJsListHeader'],
    },
  },
  defaultSort: 'sortOrder',
  hooks: {
    beforeChange: [generateDJDisplayName],
  },
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor', 'dj']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description:
          'Shown on the website — generated automatically from the linked person name(s)',
      },
    },
    {
      name: 'person',
      type: 'relationship',
      relationTo: 'people',
      hasMany: true,
      admin: {
        description: 'The real person(s) behind this DJ name — select multiple for co-hosted shows',
      },
    },
    {
      name: 'description',
      type: 'richText',
      editor: lexicalEditor(),
      admin: {
        description:
          'Bio shown on the DJ page on the website — describe their show(s) and music style',
      },
    },
    {
      name: 'email',
      type: 'email',
      admin: {
        description: 'Contact email address',
      },
    },
    {
      name: 'externalConnectText',
      type: 'text',
      admin: {
        description: 'Text for the external link button on the DJ page (e.g., "Follow on Twitter")',
      },
    },
    {
      name: 'externalConnectUrl',
      type: 'text',
      admin: {
        description: 'URL for external link',
        placeholder: 'https://',
      },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'DJ photo',
        components: {
          Cell: '/payload/src/components/cells/ThumbnailCell#ThumbnailCell',
        },
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'onAir',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description:
              'When checked, this DJ appears on the website. Uncheck to hide without deleting.',
            width: '25%',
          },
        },
        {
          name: 'sortOrder',
          type: 'number',
          admin: {
            description:
              'Display order — use the DJ Sort Order tool (/admin/dj-order) to reorder visually',
            width: '25%',
          },
        },
      ],
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
