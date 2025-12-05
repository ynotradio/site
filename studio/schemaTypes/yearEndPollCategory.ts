import { defineType, defineField, defineArrayMember } from 'sanity';

/**
 * Year End Poll Category Schema
 *
 * Individual categories within a Year End Poll (e.g., "Best Album", "Best Song").
 * Options can reference Sanity documents (songs, records, artists) or be freeform write-ins.
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
      title: 'Name',
      type: 'string',
      description: 'e.g., "Best Album", "Best Song", "Best Live Show"',
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
      description: 'Determines what kind of options are available',
      options: {
        list: [
          { title: 'Songs', value: 'SONGS' },
          { title: 'Albums', value: 'ALBUMS' },
          { title: 'Artists', value: 'ARTISTS' },
          { title: 'New Artists', value: 'NEW_ARTISTS' },
          { title: 'Philly Artists', value: 'PHILLY_ARTISTS' },
          { title: 'Concerts', value: 'CONCERTS' },
          { title: 'Music Videos', value: 'MUSIC_VIDEOS' },
          { title: 'Most Anticipated Albums', value: 'MOST_ANTICIPATED_ALBUMS' },
          { title: 'Biggest Comebacks', value: 'BIGGEST_COMEBACKS' },
          { title: 'TV Comedies', value: 'TV_COMEDIES' },
          { title: 'TV Dramas', value: 'TV_DRAMAS' },
          { title: 'Late Night TV', value: 'LATE_NIGHT_TV' },
          { title: 'Best Movies', value: 'BEST_MOVIES' },
          { title: 'Celebrity Deaths', value: 'CELEBRITY_DEATHS' },
          { title: 'Unnecessary Sequels', value: 'UNNECESSARY_SEQUELS' },
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
      name: 'maxSelections',
      title: 'Max Selections',
      type: 'number',
      description: 'Maximum number of items a user can vote for in this category',
      initialValue: 1,
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'allowWriteIns',
      title: 'Allow Write-Ins',
      type: 'boolean',
      description: 'Allow users to submit write-in votes',
      initialValue: true,
    }),
    defineField({
      name: 'options',
      title: 'Options',
      type: 'array',
      description: 'Available voting options (structure varies by category type)',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'song',
              title: 'Song',
              type: 'reference',
              to: [{ type: 'song' }],
              hidden: ({ document }) => document?.categoryType !== 'SONGS',
            }),
            defineField({
              name: 'record',
              title: 'Record (Album)',
              type: 'reference',
              to: [{ type: 'record' }],
              hidden: ({ document }) => !['ALBUMS', 'MOST_ANTICIPATED_ALBUMS'].includes(document?.categoryType),
            }),
            defineField({
              name: 'artist',
              title: 'Artist',
              type: 'reference',
              to: [{ type: 'artist' }],
              hidden: ({ document }) => !['ARTISTS', 'NEW_ARTISTS', 'PHILLY_ARTISTS', 'BIGGEST_COMEBACKS'].includes(document?.categoryType),
            }),
            defineField({
              name: 'concert',
              title: 'Concert',
              type: 'reference',
              to: [{ type: 'concert' }],
              hidden: ({ document }) => document?.categoryType !== 'CONCERTS',
            }),
            defineField({
              name: 'freeformLabel',
              title: 'Freeform Label',
              type: 'string',
              description: 'For non-music categories (movies, TV, etc.)',
              hidden: ({ document }) => ['SONGS', 'ALBUMS', 'MOST_ANTICIPATED_ALBUMS', 'ARTISTS', 'NEW_ARTISTS', 'PHILLY_ARTISTS', 'BIGGEST_COMEBACKS', 'CONCERTS', 'MUSIC_VIDEOS'].includes(document?.categoryType),
            }),
          ],
          preview: {
            select: {
              songTitle: 'song.title',
              recordTitle: 'record.title',
              artistName: 'artist.name',
              concertArtist: 'concert.artist.name',
              concertDate: 'concert.date',
              freeformLabel: 'freeformLabel',
            },
            prepare(selection) {
              const {
                songTitle,
                recordTitle,
                artistName,
                concertArtist,
                concertDate,
                freeformLabel,
              } = selection;

              if (songTitle) return { title: songTitle };
              if (recordTitle) return { title: recordTitle };
              if (artistName) return { title: artistName };
              if (concertArtist) {
                const date = concertDate
                  ? new Date(concertDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                  : '';
                return { title: `${concertArtist}${date ? ` (${date})` : ''}` };
              }
              if (freeformLabel) return { title: freeformLabel };
              return { title: 'Option' };
            },
          },
        }),
      ],
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
      pollTitle: 'poll.title',
      displayOrder: 'displayOrder',
      categoryType: 'categoryType',
    },
    prepare(selection) {
      const {
        name, pollTitle, displayOrder, categoryType,
      } = selection;
      return {
        title: name,
        subtitle: `${pollTitle || 'Poll'} • #${displayOrder} • ${categoryType}`,
      };
    },
  },
  orderings: [
    {
      title: 'Display Order',
      name: 'displayOrder',
      by: [
        { field: 'poll.year', direction: 'desc' },
        { field: 'displayOrder', direction: 'asc' },
      ],
    },
  ],
});
