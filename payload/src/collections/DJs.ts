import type { CollectionConfig } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { hasRole, adminOnlyCondition } from '../utils/auth';
import { generateDJDisplayName, linkPersonToDJ } from './hooks/displayNameHooks';
import { legacyIdField } from './shared/legacyIdField';

// Scripts and legacy imports create DJs with only a linked person, and the
// beforeChange hook derives the name from them, so a name is required only
// when there is no person to derive it from.
export const validateDJNamePresent = (
  value: unknown,
  { data }: { data?: { person?: unknown } },
): string | true => {
  const hasName = typeof value === 'string' && value.trim() !== '';
  const hasPerson = Array.isArray(data?.person) && data.person.length > 0;
  return hasName || hasPerson ? true : 'Enter the DJ name.';
};

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
    beforeChange: [generateDJDisplayName, linkPersonToDJ],
  },
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor', 'dj']),
    delete: ({ req }) => hasRole(req.user, ['admin', 'editor']),
  },
  fields: [
    {
      name: 'displayName',
      label: 'Name',
      type: 'text',
      validate: validateDJNamePresent,
      admin: {
        description: 'The DJ name shown on the DJ page and in the schedule.',
      },
    },
    {
      type: 'collapsible',
      label: 'Linked people (optional)',
      admin: {
        initCollapsed: true,
        description:
          'A Person is created from the name when a new DJ is saved. Only open this to link '
          + 'an existing person or to add co-hosts.',
      },
      fields: [
        {
          name: 'person',
          type: 'relationship',
          relationTo: 'people',
          hasMany: true,
          admin: {
            description: 'The real person(s) behind this DJ — select several for co-hosted shows',
          },
        },
      ],
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
};
