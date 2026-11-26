import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';
import { appendBulkNominees, validateNominees } from './hooks/yearEndPollCategoryHooks';

/**
 * YearEndPollCategories Collection
 *
 * Each row represents one voting category within an annual poll (e.g., "Best Songs",
 * "Best Albums", "Best Artists", "Best Movies"). A category holds the full list of
 * nominees and stores a denormalized vote count on each nominee for fast display —
 * the same pattern used by ModernRockMadnessMatches (band1Votes / band2Votes).
 *
 * Nominees can be linked to existing Payload collections (Songs, Records, Artists,
 * Concerts) or left as plain-text labels for categories that don't have a matching
 * collection (e.g., TV shows, movies). Only one of the typed relationship fields
 * should be populated per nominee; `customLabel` is used for everything else.
 *
 * Per-category voting windows (votingOpensAt / votingClosesAt) are optional overrides;
 * if absent, the parent poll's window applies.
 *
 * Modelled after ModernRockMadnessMatches.
 */
export const YearEndPollCategories: CollectionConfig = {
  slug: 'year-end-poll-categories',
  labels: {
    singular: 'Year End Poll Category',
    plural: 'Year End Poll Categories',
  },
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'poll', 'categoryType', 'maxPicks', 'updatedAt'],
    group: 'Polls & Contests',
    description:
      'Voting categories within a Year End Poll. Each category holds its nominees and tracks vote counts.',
  },
  access: {
    read: () => true,
    create: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  hooks: {
    beforeChange: [appendBulkNominees, validateNominees],
  },
  fields: [
    {
      name: 'poll',
      type: 'relationship',
      relationTo: 'year-end-polls',
      required: true,
      index: true,
      admin: {
        description: 'Poll this category belongs to',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'slug',
          type: 'text',
          required: true,
          admin: {
            description: 'URL-friendly category identifier (e.g., "songs", "records", "artists")',
            width: '40%',
          },
        },
        {
          name: 'displayName',
          type: 'text',
          required: true,
          admin: {
            description: 'Human-readable category name shown to voters (e.g., "Best Songs")',
            width: '60%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'categoryType',
          type: 'select',
          required: true,
          options: [
            { label: 'Songs', value: 'songs' },
            { label: 'Albums / Records', value: 'albums' },
            { label: 'Artists', value: 'artists' },
            { label: 'Concerts', value: 'concerts' },
            { label: 'Custom (movies, TV, etc.)', value: 'custom' },
          ],
          admin: {
            description:
              'Type of nominees. Controls which relationship field is used on each nominee row.',
            width: '50%',
          },
        },
        {
          name: 'maxPicks',
          type: 'number',
          required: true,
          defaultValue: 3,
          min: 1,
          admin: {
            description: 'Maximum selections allowed per voter for this category',
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'votingOpensAt',
          type: 'date',
          admin: {
            description:
              'Optional per-category voting window override. If blank, uses the parent poll window.',
            date: {
              pickerAppearance: 'dayAndTime',
            },
            width: '50%',
          },
        },
        {
          name: 'votingClosesAt',
          type: 'date',
          admin: {
            description:
              'Optional per-category voting window override. If blank, uses the parent poll window.',
            date: {
              pickerAppearance: 'dayAndTime',
            },
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'requiredForContest',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Voters must finish this category before they can enter the prize drawing.',
      },
    },
    {
      name: 'bulkNominees',
      label: 'Add nominees from a list',
      type: 'textarea',
      virtual: true,
      admin: {
        // Payload makes virtual fields read-only in the admin unless told otherwise.
        readOnly: false,
        components: {
          Field: '/payload/src/components/fields/NomineeImportField#NomineeImportField',
        },
        description:
          'Upload a .txt or .csv (artist and title columns), or paste one nominee per line (e.g. "Artist - Song"), then save. In a songs, albums, artists or concerts category, lines that exactly match an existing entry are linked to it; the rest become text nominees. Lines already on the list are skipped.',
      },
    },
    {
      name: 'nominees',
      type: 'array',
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '/payload/src/components/YearEndNomineeRowLabel',
        },
        description:
          'Nominees for this category. Each row shows the field that matches the category type above (set the type first).',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'song',
              type: 'relationship',
              relationTo: 'songs',
              admin: {
                condition: (data) => data?.categoryType === 'songs',
                width: '70%',
              },
            },
            {
              name: 'record',
              label: 'Album / record',
              type: 'relationship',
              relationTo: 'records',
              admin: {
                condition: (data) => data?.categoryType === 'albums',
                width: '70%',
              },
            },
            {
              name: 'artist',
              type: 'relationship',
              relationTo: 'artists',
              admin: {
                condition: (data) => data?.categoryType === 'artists',
                width: '70%',
              },
            },
            {
              name: 'concert',
              type: 'relationship',
              relationTo: 'concerts',
              admin: {
                condition: (data) => data?.categoryType === 'concerts',
                width: '70%',
              },
            },
            {
              name: 'customLabel',
              label: 'Nominee',
              type: 'text',
              admin: {
                condition: (data, siblingData) => data?.categoryType === 'custom' || Boolean(siblingData?.customLabel),
                width: '70%',
              },
            },
            {
              name: 'voteCount',
              type: 'number',
              defaultValue: 0,
              admin: {
                description: 'Running vote total (updated when votes are cast)',
                readOnly: true,
                width: '30%',
              },
            },
          ],
        },
      ],
    },
  ],
  timestamps: true,
};
