import type { CollectionConfig, FieldHook } from 'payload';
import { slugField } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { hasRole, adminOnlyCondition } from '../utils/auth';
import { setCdOfTheWeekSlugFromRecord, cdSlugify } from './hooks/slugUtils';

const isObjectLike = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const syncRecordText: FieldHook = async ({ siblingData, req }) => {
  const raw = (siblingData as { record?: unknown }).record;
  if (!raw) return '';
  const id = isObjectLike(raw) && 'id' in raw
    ? (raw as { id: unknown }).id
    : raw;
  try {
    const { docs } = await req.payload.find({
      collection: 'records',
      where: { id: { equals: id } },
      limit: 1,
      depth: 0,
    });
    return String(docs[0]?.displayName ?? docs[0]?.title ?? '');
  } catch {
    return '';
  }
};

export const CdOfTheWeek: CollectionConfig = {
  slug: 'cdoftheweek',
  labels: {
    singular: 'CD of the Week',
    plural: 'CDs of the Week',
  },
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: 'date',
    defaultColumns: ['date', 'record', 'reviewer', '_status', 'updatedAt'],
    listSearchableFields: ['recordText'],
    group: 'Music',
    description:
      'Weekly album reviews. Pick a record, write the review, and set the date — only one should be current at a time.',
  },
  defaultSort: '-date',
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  hooks: {
    beforeChange: [setCdOfTheWeekSlugFromRecord],
  },
  fields: [
    {
      name: 'record',
      type: 'relationship',
      relationTo: 'records',
      required: true,
      admin: {
        description: 'Select the album to review — create it in Records first if needed',
      },
    },
    {
      name: 'recordText',
      type: 'text',
      admin: {
        hidden: true,
        readOnly: true,
      },
      hooks: {
        beforeChange: [syncRecordText],
      },
    },
    slugField({ useAsSlug: 'date', slugify: cdSlugify }),
    {
      type: 'row',
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
          index: true,
          admin: {
            description: 'Review date',
            date: {
              displayFormat: 'yyyy-MM-dd',
            },
            width: '40%',
          },
        },
        {
          name: 'reviewer',
          type: 'relationship',
          relationTo: 'people',
          admin: {
            description: 'Who wrote the review? Select from People.',
            width: '60%',
          },
        },
      ],
    },
    {
      name: 'review',
      type: 'richText',
      editor: lexicalEditor(),
      required: true,
      admin: {
        description: 'The review text shown on the website',
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
