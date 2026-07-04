import type { CollectionConfig } from 'payload';
import { slugField } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { hasRole } from '../utils/auth';
import { EmbedFeature } from '../features/embed';
import { pageSlugify } from './hooks/slugUtils';
import { legacyIdField } from './shared/legacyIdField';

/**
 * Evergreen custom-text pages addressed by a stable permalink (slug).
 *
 * Distinct from `Posts` (front-page stories with date windows): Pages are
 * long-lived reference / marketing pages. Minimum fields per Chapter 15:
 * title, slug (unique, matching legacy `custom_texts.permalink` values),
 * content (richText + embed blocks), status, legacyId.
 *
 * PostgresCustomText reads from this table once content is migrated;
 * `use_postgres_customtext` is the feature-flag safety net while migration
 * happens per archetype.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: {
    singular: 'Page',
    plural: 'Pages',
  },
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    group: 'Content',
    listSearchableFields: ['title', 'slug'],
    description:
      'Evergreen custom-text pages (donate, contests, rodney, etc.) addressed by a stable permalink.',
  },
  defaultSort: ['title'],
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin', 'editor']),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Page title displayed in the <h1>',
      },
    },
    slugField({ useAsSlug: 'title', slugify: pageSlugify }),
    {
      name: 'headerImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Optional banner graphic shown above the title. Some legacy pages used a '
          + 'stylized image in place of a real text title — this preserves that banner '
          + 'without losing a plain-text `title` for admin lists, search, and SEO.',
      },
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures, EmbedFeature()],
      }),
      admin: {
        description:
          'Page body — use the rich text editor for formatted text, images, and embedded media',
      },
    },
    legacyIdField,
  ],
  timestamps: true,
};
