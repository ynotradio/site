import type { CollectionConfig } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { hasRole, adminOnlyCondition } from '../utils/auth';
import { EmbedFeature } from '../features/embed';

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: {
    singular: 'Story',
    plural: 'Stories',
  },
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: 'headline',
    defaultColumns: ['headline', 'image', 'startDate', 'endDate', 'priority', 'updatedAt'],
    group: 'Content',
    listSearchableFields: ['headline', 'slug'],

    description:
      'Stories appearing on the front page. Use date range to filter currently active posts.',
  },
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
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
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'URL-friendly slug (auto-generated from headline if not provided)',
      },
      hooks: {
        beforeValidate: [
          ({ data, operation, value }) => {
            // Auto-generate slug from headline if not provided or if creating new post
            if (operation === 'create' && !value && data?.headline) {
              return data.headline
                .replace(/<[^>]*>/g, '') // Remove HTML tags
                .toLowerCase()
                .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .replace(/-+/g, '-') // Replace multiple hyphens with single
                .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
                .trim();
            }
            return value;
          },
        ],
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
            description: 'Start displaying',
            date: {
              displayFormat: 'yyyy-MM-dd',
            },
            width: '50%',
          },
        },
        {
          name: 'endDate',
          type: 'date',
          required: true,
          admin: {
            description: 'Stop displaying',
            date: {
              displayFormat: 'yyyy-MM-dd',
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
        features: ({ defaultFeatures }) => [...defaultFeatures, EmbedFeature()],
      }),
      required: true,
      admin: {
        description: 'Post content (unified Story + CustomText from legacy)',
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
        description: 'Link URL when clicking the story image (legacy pic_url)',
        placeholder: 'https://',
      },
    },
    {
      name: 'priority',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Display priority (higher = first)',
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
