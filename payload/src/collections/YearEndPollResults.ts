import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { randomUUID } from 'node:crypto';
import type { Block, CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';

/**
 * Block for ranked songs list
 * Used for "Top N Songs of Year" type content
 */
const RankedSongsBlock: Block = {
  slug: 'rankedSongs',
  labels: {
    singular: 'Ranked Songs Section',
    plural: 'Ranked Songs Sections',
  },
  fields: [
    {
      name: 'categoryName',
      type: 'text',
      required: true,
      defaultValue: 'Top Songs',
      admin: {
        description: 'Section title (e.g., "Top 225 Songs", "Best New Songs")',
      },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      admin: {
        description: 'Ranked list of songs',
      },
      fields: [
        {
          name: 'rank',
          type: 'number',
          required: true,
          admin: {
            description: 'Position in the ranking (1, 2, 3, etc.)',
            width: '20%',
          },
        },
        {
          name: 'song',
          type: 'relationship',
          relationTo: 'songs',
          required: true,
          admin: {
            description: 'Select the song',
            width: '50%',
          },
        },
        {
          name: 'note',
          type: 'text',
          admin: {
            description: 'Optional note or comment about this ranking',
            width: '30%',
          },
        },
      ],
    },
  ],
};

/**
 * Block for ranked records/albums list
 * Used for "Top Albums of Year" type content
 */
const RankedRecordsBlock: Block = {
  slug: 'rankedRecords',
  labels: {
    singular: 'Ranked Records Section',
    plural: 'Ranked Records Sections',
  },
  fields: [
    {
      name: 'categoryName',
      type: 'text',
      required: true,
      defaultValue: 'Top Albums',
      admin: {
        description: 'Section title (e.g., "Top 50 Albums", "Best Debut Albums")',
      },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      admin: {
        description: 'Ranked list of albums/records',
      },
      fields: [
        {
          name: 'rank',
          type: 'number',
          required: true,
          admin: {
            description: 'Position in the ranking (1, 2, 3, etc.)',
            width: '20%',
          },
        },
        {
          name: 'record',
          type: 'relationship',
          relationTo: 'records',
          required: true,
          admin: {
            description: 'Select the album/record',
            width: '50%',
          },
        },
        {
          name: 'note',
          type: 'text',
          admin: {
            description: 'Optional note or comment about this ranking',
            width: '30%',
          },
        },
      ],
    },
  ],
};

/**
 * Block for individual DJ staff picks
 * Used for "Staff Picks" pages where each DJ shares their favorites
 */
const StaffPicksBlock: Block = {
  slug: 'staffPicks',
  labels: {
    singular: 'Staff Picks Section',
    plural: 'Staff Picks Sections',
  },
  fields: [
    {
      name: 'dj',
      type: 'relationship',
      relationTo: 'djs',
      required: true,
      admin: {
        description: 'The DJ sharing their picks',
      },
    },
    {
      name: 'introduction',
      type: 'richText',
      editor: lexicalEditor(),
      admin: {
        description: 'Optional intro text from the DJ',
      },
    },
    {
      name: 'onDemandShows',
      type: 'array',
      admin: {
        description:
          "On-demand audio embeds of the DJ's show where they present their picks (usually just 1)",
      },
      fields: [
        {
          name: 'onDemand',
          type: 'relationship',
          relationTo: 'ondemand',
          required: true,
          admin: {
            description: 'Select the on-demand show',
          },
        },
      ],
    },
    {
      name: 'songPicks',
      type: 'array',
      admin: {
        description: 'Song picks from this DJ',
      },
      fields: [
        {
          name: 'song',
          type: 'relationship',
          relationTo: 'songs',
          required: true,
          admin: {
            width: '60%',
          },
        },
        {
          name: 'comment',
          type: 'text',
          admin: {
            description: "DJ's comment about this pick",
            width: '40%',
          },
        },
      ],
    },
    {
      name: 'recordPicks',
      type: 'array',
      admin: {
        description: 'Album picks from this DJ',
      },
      fields: [
        {
          name: 'record',
          type: 'relationship',
          relationTo: 'records',
          required: true,
          admin: {
            width: '60%',
          },
        },
        {
          name: 'comment',
          type: 'text',
          admin: {
            description: "DJ's comment about this pick",
            width: '40%',
          },
        },
      ],
    },
  ],
};

/**
 * Block for rich text content
 * Used for introductions, explanations, or narrative sections
 */
const TextContentBlock: Block = {
  slug: 'textContent',
  labels: {
    singular: 'Text Section',
    plural: 'Text Sections',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      admin: {
        description: 'Optional section heading',
      },
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor(),
      required: true,
      admin: {
        description: 'Rich text content for this section',
      },
    },
  ],
};

/**
 * YearEndPollResults Collection
 *
 * Stores published Year End Poll results and specialty recap pages.
 * Uses Payload blocks to allow flexible composition of different content types:
 * - Ranked lists of songs and records
 * - Staff picks sections for DJ-curated favorites (with optional on-demand audio embeds)
 * - Text content for introductions and narratives
 *
 * This replaces the need for content managers to edit HTML manually
 * for pages like /pages.php?page=top225of2025
 */
export const YearEndPollResults: CollectionConfig = {
  slug: 'year-end-poll-results',
  enableRichTextLink: false,
  enableRichTextRelationship: false,
  enableQueryPresets: true,
  labels: {
    singular: 'Year End Poll Result',
    plural: 'Year End Poll Results',
  },
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'year', 'pageType', 'publishedAt', 'updatedAt'],
    group: 'Polls & Contests',
    description: 'Year-end poll results and staff picks pages.',
    groupBy: true,
    hidden: true, // Temporarily hidden from navigation
  },
  access: {
    read: () => true, // Public read access
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
        description: 'Page title (e.g., "Top 225 Songs of 2025")',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'year',
          type: 'number',
          required: true,
          min: 2000,
          max: 2100,
          admin: {
            description: 'Year this poll covers',
            placeholder: '2025',
            width: '20%',
          },
        },
        {
          name: 'pageType',
          type: 'select',
          required: true,
          options: [
            {
              label: 'Countdown (Top N Songs/Albums)',
              value: 'countdown',
            },
            {
              label: 'Poll Results (Multiple Categories)',
              value: 'poll-results',
            },
            {
              label: 'Staff Picks (DJ Curated)',
              value: 'staff-picks',
            },
          ],
          admin: {
            description: 'Type of results page',
            width: '80%',
          },
        },
      ],
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      hooks: {
        beforeDuplicate: [({ value }) => `${String(value)}-copy-${randomUUID().slice(0, 8)}`],
      },
      admin: {
        position: 'sidebar',
        description: 'URL identifier (e.g., "top225of2025")',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'When the results were/will be published',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Featured image for this results page',
      },
    },
    {
      name: 'introduction',
      type: 'richText',
      editor: lexicalEditor(),
      admin: {
        description: 'Optional introduction text for the page',
      },
    },
    {
      name: 'sections',
      type: 'blocks',
      required: true,
      minRows: 1,
      blocks: [RankedSongsBlock, RankedRecordsBlock, StaffPicksBlock, TextContentBlock],
      admin: {
        description:
          'Add sections to build your results page. Each section can be a ranked list, staff picks, or text content.',
      },
    },
  ],
  timestamps: true,
};
