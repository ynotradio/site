import type { CollectionConfig, FieldHook } from 'payload';
import {
  BoldFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  ParagraphFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical';
import type { SerializedEditorState } from 'lexical';
import { hasRole, adminOnlyCondition } from '../utils/auth';
import {
  convertConcertTitleToHtml,
  convertConcertTitleToPlain,
} from '../utils/concertTitle';

type ConcertSiblingData = { title?: SerializedEditorState | null; artists?: unknown[] };

const syncTitleHtml: FieldHook = ({ siblingData }) => convertConcertTitleToHtml(
  (siblingData as ConcertSiblingData).title,
);

const syncTitlePlain: FieldHook = ({ siblingData }) => convertConcertTitleToPlain(
  (siblingData as ConcertSiblingData).title,
);

const syncArtistsText: FieldHook = async ({ siblingData, req }) => {
  const { artists = [] } = siblingData as ConcertSiblingData;
  if (!artists.length) return '';
  const ids = artists.map((a) => {
    if (typeof a === 'object' && a !== null && 'id' in a) return (a as { id: unknown }).id;
    return a;
  });
  try {
    const { docs } = await req.payload.find({
      collection: 'artists',
      where: { id: { in: ids } },
      limit: ids.length,
      depth: 0,
    });
    return docs.map((a: { name?: string }) => a.name ?? '').join(', ');
  } catch {
    return '';
  }
};

export const Concerts: CollectionConfig = {
  slug: 'concerts',
  labels: {
    singular: 'Concert',
    plural: 'Concerts',
  },
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: 'titlePlain',
    defaultColumns: ['titlePlain', 'artists', 'date', 'venue', '_status', 'updatedAt'],
    listSearchableFields: ['titlePlain', 'artistsText'],
    group: 'Events',
    description: 'Concert listings.',
  },
  defaultSort: 'date',
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  fields: [
    {
      name: 'title',
      type: 'richText',
      editor: lexicalEditor({
        features: () => [
          ParagraphFeature(),
          BoldFeature(),
          ItalicFeature(),
          LinkFeature(),
          InlineToolbarFeature(),
        ],
      }),
      admin: {
        description:
          'Optional custom title for the concert (falls back to artist names). Supports bold, italics, and links.',
      },
    },
    {
      name: 'titleHtml',
      type: 'text',
      admin: {
        hidden: true,
        readOnly: true,
      },
      hooks: {
        beforeChange: [syncTitleHtml],
      },
    },
    {
      name: 'titlePlain',
      type: 'text',
      admin: {
        hidden: true,
        readOnly: true,
      },
      hooks: {
        beforeChange: [syncTitlePlain],
      },
    },
    {
      name: 'artistsText',
      type: 'text',
      admin: {
        hidden: true,
        readOnly: true,
      },
      hooks: {
        beforeChange: [syncArtistsText],
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      index: true,
      admin: {
        description: 'Concert date',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'artists',
      type: 'relationship',
      relationTo: 'artists',
      hasMany: true,
      required: true,
      admin: {
        description: 'Who is playing? Select one or more artists from the catalog.',
      },
    },
    {
      name: 'venue',
      type: 'relationship',
      relationTo: 'venues',
      required: true,
      admin: {
        description: 'Where is it? Select a venue or create one first.',
      },
    },
    {
      name: 'ticketInfo',
      type: 'textarea',
      admin: {
        description: 'Pricing details shown on the website (e.g., "$25 advance, $30 door")',
      },
    },
    {
      name: 'ticketUrl',
      type: 'text',
      admin: {
        description: 'Link to the ticket purchase page — visitors see a "Buy Tickets" button',
        placeholder: 'https://',
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
