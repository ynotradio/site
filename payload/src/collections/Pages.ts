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
 * An HTML page with an empty `contentHtml` body renders nothing on the site
 * (the legacy CP textarea had the same failure mode, silently). Block the
 * save rather than publish a blank page. Untyped pages count as HTML to
 * match the field's admin.condition and the collection's 'html' default.
 */
export const validateContentHtmlPresent = (
  value: unknown,
  { data }: { data?: { contentType?: unknown } },
): string | true => {
  const contentType = data?.contentType ?? 'html';
  const isEmpty = value === undefined || value === null || String(value).trim() === '';
  if (contentType !== 'richText' && isEmpty) {
    return 'HTML pages need a body — contentHtml is empty, which would render nothing on the site.';
  }
  return true;
};

/**
 * Evergreen custom-text pages addressed by a stable permalink (slug).
 *
 * Distinct from `Posts` (front-page stories with date windows): Pages are
 * long-lived reference / marketing pages. Minimum fields per Chapter 15:
 * title, slug (unique, matching legacy `custom_texts.permalink` values),
 * content, status, legacyId.
 *
 * Body authoring is hybrid, chosen per page via `contentType`:
 *   - 'html'     -> `contentHtml`, a raw-HTML blob rendered verbatim. This is
 *                   the legacy CP model (a `<textarea>` of hand-authored HTML)
 *                   and the right fit for the embed/iframe/table/form-heavy
 *                   pages that the HTML->Lexical->HTML round-trip mangled
 *                   (dropped embeds/images, mojibake, admin crashes). New
 *                   pages default here.
 *   - 'richText' -> `content`, the Lexical editor + embed blocks, for genuine
 *                   rich-text articles that benefit from a WYSIWYG.
 * PostgresCustomText reads the matching column per row and only runs the
 * Lexical->HTML converter for 'richText' pages.
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
      name: 'contentType',
      type: 'select',
      required: true,
      defaultValue: 'html',
      options: [
        { label: 'HTML', value: 'html' },
        { label: 'Rich Text', value: 'richText' },
      ],
      admin: {
        description:
          'How this page body is authored. HTML = raw HTML rendered verbatim '
          + '(best for embed/table/form-heavy legacy pages); Rich Text = the '
          + 'Lexical editor for formatted articles.',
      },
    },
    {
      name: 'contentHtml',
      type: 'code',
      validate: validateContentHtmlPresent,
      admin: {
        language: 'html',
        description:
          'Raw HTML page body, rendered verbatim on the site. Trusted editors '
          + 'only — markup is not sanitized (same as the legacy control panel).',
        // Show for HTML pages, and for any page that hasn't chosen a type yet
        // (new pages default to HTML).
        condition: (data) => data?.contentType !== 'richText',
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
        condition: (data) => data?.contentType === 'richText',
        description:
          'Page body — use the rich text editor for formatted text, images, and embedded media',
      },
    },
    legacyIdField,
  ],
  timestamps: true,
};
