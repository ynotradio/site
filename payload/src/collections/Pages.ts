import type { CollectionConfig } from 'payload';
import {
  lexicalEditor,
  EXPERIMENTAL_TableFeature,
  BlocksFeature,
} from '@payloadcms/richtext-lexical';
import { hasRole } from '../utils/auth';
import { slugField } from './shared/slugField';
import { EmbedBlock } from '../features/embed';
import { ImageAlignmentUploadFeature } from '../features/image-alignment';
import { PayPalButtonBlock } from '../features/paypal-button/server';
import { PayPalSmartButtonsBlock } from '../features/paypal-smart-buttons/server';
import { SmallTextFeature } from '../features/text-size';
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
        features: ({ defaultFeatures }) => [
          // Swap the plain default UploadFeature for one with an alignment
          // field (see ../features/image-alignment) so inline images can
          // float left/right like the legacy <img align> markup did.
          ...defaultFeatures.filter((feature) => feature.key !== 'upload'),
          ImageAlignmentUploadFeature(),
          // A single BlocksFeature() call registers all block-type nodes —
          // Payload keys block-node validation by Lexical nodeType, not by
          // feature key, so multiple separate BlocksFeature() calls silently
          // overwrite each other's validators and only the last-registered
          // block type survives ("Block embed not found" on save/import).
          BlocksFeature({
            blocks: [EmbedBlock, PayPalButtonBlock, PayPalSmartButtonsBlock],
          }),
          EXPERIMENTAL_TableFeature(),
          SmallTextFeature(),
        ],
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
