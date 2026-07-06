import type { CollectionConfig } from 'payload';
import { slugField } from 'payload';
import { lexicalEditor, EXPERIMENTAL_TableFeature } from '@payloadcms/richtext-lexical';
import { hasRole, adminOnlyCondition } from '../utils/auth';
import { EmbedFeature } from '../features/embed';
import { ImageAlignmentUploadFeature } from '../features/image-alignment';
import { SmallTextFeature } from '../features/text-size';
import { normalizeFieldToNoon } from './hooks/showDateHooks';
import { postSlugify } from './hooks/slugUtils';
import { legacyIdField } from './shared/legacyIdField';

export const Posts: CollectionConfig = {
  slug: 'posts',
  enableQueryPresets: true,
  labels: {
    singular: 'Story',
    plural: 'Stories',
  },
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: 'headline',
    defaultColumns: [
      'headline',
      'image',
      'startDate',
      'endDate',
      'priority',
      '_status',
      'updatedAt',
    ],
    group: 'Content',
    listSearchableFields: ['headline', 'slug'],
    groupBy: true,
    description:
      'Front-page stories. Each story is visible on the site between its start and end dates.',
    components: {
      beforeList: ['/payload/src/features/story-order/PostsListHeader#PostsListHeader'],
    },
  },
  defaultSort: ['priority', '-startDate'],
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin', 'editor']),
  },
  fields: [
    {
      name: 'headline',
      type: 'text',
      required: true,
      maxLength: 100,
      admin: {
        description: 'Post headline (max 100 characters)',
      },
    },
    slugField({ useAsSlug: 'headline', slugify: postSlugify }),
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
          admin: {
            description: 'Story appears on the site starting this date',
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
            description: 'Story is removed from the site after this date',
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
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          // Swap the plain default UploadFeature for one with an alignment
          // field (see ../features/image-alignment) so inline images can
          // float left/right like the legacy <img align> markup did.
          ...defaultFeatures.filter((feature) => feature.key !== 'upload'),
          ImageAlignmentUploadFeature(),
          EmbedFeature(),
          EXPERIMENTAL_TableFeature(),
          SmallTextFeature(),
        ],
      }),
      required: true,
      admin: {
        description:
          'Story body — use the rich text editor for formatted text, images, and embedded media',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Featured image',
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
      name: 'linkUrl',
      type: 'text',
      admin: {
        description:
          'Optional — when set, clicking the story image links here instead of opening the story',
        placeholder: 'https://',
      },
    },
    {
      name: 'showOnFrontPage',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description:
          'Whether this post appears on the front page. Disable for standalone pages (e.g. custom text pages).',
      },
    },
    {
      name: 'priority',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description:
          'Display order on the front page — lower numbers appear first. Same priority sorts by date. Use the Story Order tool (/admin/story-order) to reorder visually.',
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
  hooks: {
    beforeChange: [normalizeFieldToNoon('startDate'), normalizeFieldToNoon('endDate')],
  },
  timestamps: true,
};
