import type { Block, CollectionConfig } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
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
 * Block for ranked DJs list
 * Used for "DJ of the Year" type content
 */
const RankedDJsBlock: Block = {
  slug: 'rankedDJs',
  labels: {
    singular: 'Ranked DJs Section',
    plural: 'Ranked DJs Sections',
  },
  fields: [
    {
      name: 'categoryName',
      type: 'text',
      required: true,
      defaultValue: 'Top DJs',
      admin: {
        description: 'Section title (e.g., "DJ of the Year", "Best New DJs")',
      },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      admin: {
        description: 'Ranked list of DJs',
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
          name: 'dj',
          type: 'relationship',
          relationTo: 'djs',
          required: true,
          admin: {
            description: 'Select the DJ',
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
 * Block for ranked on-demand content list
 * Used for "Best Interviews" or "Top On-Demand Content" type sections
 */
const RankedOnDemandBlock: Block = {
  slug: 'rankedOnDemand',
  labels: {
    singular: 'Ranked On-Demand Section',
    plural: 'Ranked On-Demand Sections',
  },
  fields: [
    {
      name: 'categoryName',
      type: 'text',
      required: true,
      defaultValue: 'Top On-Demand',
      admin: {
        description: 'Section title (e.g., "Best Interviews", "Top On-Demand Content")',
      },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      admin: {
        description: 'Ranked list of on-demand content',
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
          name: 'onDemand',
          type: 'relationship',
          relationTo: 'ondemand',
          required: true,
          admin: {
            description: 'Select the on-demand content',
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
            description: 'DJ\'s comment about this pick',
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
            description: 'DJ\'s comment about this pick',
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
 * - Ranked lists of songs, records, DJs, and on-demand content
 * - Staff picks sections for DJ-curated favorites
 * - Text content for introductions and narratives
 *
 * This replaces the need for content managers to edit HTML manually
 * for pages like /pages.php?page=top225of2025
 */
export const YearEndPollResults: CollectionConfig = {
  slug: 'year-end-poll-results',
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'year', 'pageType', 'publishedAt', 'updatedAt'],
    group: 'Polls & Contests',
  },
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
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
      name: 'year',
      type: 'number',
      required: true,
      min: 2000,
      max: 2100,
      admin: {
        description: 'The year this poll covers',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly identifier (e.g., "top225of2025")',
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
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
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
      blocks: [
        RankedSongsBlock,
        RankedRecordsBlock,
        RankedDJsBlock,
        RankedOnDemandBlock,
        StaffPicksBlock,
        TextContentBlock,
      ],
      admin: {
        description: 'Add sections to build your results page. Each section can be a ranked list, staff picks, or text content.',
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
      },
    },
    {
      name: 'migratedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Timestamp of migration from MySQL',
      },
    },
  ],
  timestamps: true,
};
