import { defineType, defineField, defineArrayMember } from 'sanity';

/**
 * Year End Poll Category Schema
 *
 * Individual category within the Year End Poll.
 * Each category can have different types of options (songs, albums, artists).
 *
 * Document ID format: year-end-poll-{year}-{categorySlug} (e.g., year-end-poll-2025-song-of-the-year)
 */
export default defineType({
  name: 'yearEndPollCategory',
  title: 'Year End Poll Category',
  type: 'document',
  fields: [
    defineField({
      name: 'poll',
      title: 'Poll',
      type: 'reference',
      to: [{ type: 'yearEndPoll' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Category Name',
      type: 'string',
      description: 'e.g., "Songs", "Albums", "Artists", "Concerts"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'categoryType',
      title: 'Category Type',
      type: 'string',
      options: {
        list: [
          { title: 'Song', value: 'SONG' },
          { title: 'Album', value: 'ALBUM' },
          { title: 'Artist', value: 'ARTIST' },
          { title: 'Concert', value: 'CONCERT' },
          { title: 'New Artist', value: 'NEW_ARTIST' },
          { title: 'Philly Artist', value: 'PHILLY_ARTIST' },
          { title: 'Most Anticipated Album', value: 'MOST_ANTICIPATED_ALBUM' },
          { title: 'TV Drama', value: 'TV_DRAMA' },
          { title: 'TV Comedy', value: 'TV_COMEDY' },
          { title: 'Best Movie', value: 'BEST_MOVIE' },
          { title: 'Worst Movie', value: 'WORST_MOVIE' },
          { title: 'Unnecessary Sequel', value: 'UNNECESSARY_SEQUEL' },
          { title: 'Other (String)', value: 'OTHER' },
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Order in which this category appears in the poll',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'numSelections',
      title: 'Number of Selections',
      type: 'number',
      description: 'Exact number of items voters must select (e.g., 20 for songs, 10 for albums, 5 for artists)',
      initialValue: 20,
      validation: (Rule) => Rule.required().min(1).max(20),
    }),
    defineField({
      name: 'allowWriteIns',
      title: 'Allow Write-ins',
      type: 'boolean',
      description: 'Allow voters to submit their own options',
      initialValue: true,
    }),
    // Options for Song categories
    defineField({
      name: 'songOptions',
      title: 'Song Options',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'song' }],
        }),
      ],
      hidden: ({ document }) => document?.categoryType !== 'SONG',
    }),
    // Options for Album categories
    defineField({
      name: 'albumOptions',
      title: 'Album Options',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'record' }],
        }),
      ],
      hidden: ({ document }) => document?.categoryType !== 'ALBUM' && document?.categoryType !== 'MOST_ANTICIPATED_ALBUM',
    }),
    // Options for Artist/Concert/New Artist/Philly Artist categories
    defineField({
      name: 'artistOptions',
      title: 'Artist Options',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'artist' }],
        }),
      ],
      hidden: ({ document }) => {
        const catType = document?.categoryType;
        return !['ARTIST', 'CONCERT', 'NEW_ARTIST', 'PHILLY_ARTIST'].includes(catType);
      },
    }),
    // Options for categories that use simple strings (movies, TV shows, etc.)
    defineField({
      name: 'stringOptions',
      title: 'String Options',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'value',
              title: 'Option Value',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'displayOrder',
              title: 'Display Order',
              type: 'number',
              validation: (Rule) => Rule.required().min(1),
            }),
          ],
          preview: {
            select: {
              value: 'value',
              order: 'displayOrder',
            },
            prepare(selection) {
              const { value, order } = selection;
              return {
                title: value,
                subtitle: `Order: ${order}`,
              };
            },
          },
        }),
      ],
      hidden: ({ document }) => {
        const catType = document?.categoryType;
        return !['TV_DRAMA', 'TV_COMEDY', 'BEST_MOVIE', 'WORST_MOVIE', 'UNNECESSARY_SEQUEL', 'OTHER'].includes(catType);
      },
    }),
    defineField({
      name: 'legacyId',
      title: 'Legacy ID',
      type: 'number',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'migratedAt',
      title: 'Migrated At',
      type: 'datetime',
      readOnly: true,
      hidden: true,
    }),
  ],
  preview: {
    select: {
      name: 'name',
      pollYear: 'poll.year',
      displayOrder: 'displayOrder',
      categoryType: 'categoryType',
    },
    prepare(selection) {
      const {
        name, pollYear, displayOrder, categoryType,
      } = selection;
      const typeEmoji: Record<string, string> = {
        SONG: '🎵',
        ALBUM: '💿',
        ARTIST: '🎤',
        CONCERT: '🎸',
        NEW_ARTIST: '🌟',
        PHILLY_ARTIST: '🔔',
        MOST_ANTICIPATED_ALBUM: '⏳',
        TV_DRAMA: '📺',
        TV_COMEDY: '😂',
        BEST_MOVIE: '🎬',
        WORST_MOVIE: '👎',
        UNNECESSARY_SEQUEL: '🔁',
        OTHER: '📋',
      };
      const emoji = typeEmoji[categoryType] || '📋';
      return {
        title: name,
        subtitle: `${emoji} ${pollYear || 'Unknown Year'} • Order: ${displayOrder}`,
      };
    },
  },
  orderings: [
    {
      title: 'Display Order',
      name: 'displayOrder',
      by: [
        { field: 'displayOrder', direction: 'asc' },
      ],
    },
  ],
});
