import { defineType, defineField, defineArrayMember } from 'sanity';

/**
 * Top 11 Result Schema
 *
 * Published weekly Top 11 results.
 * Shows the final placements after voting closes.
 */
export default defineType({
  name: 'top11Result',
  title: 'Top 11 Result',
  type: 'document',
  fields: [
    defineField({
      name: 'contest',
      title: 'Contest',
      type: 'reference',
      to: [{ type: 'top11Contest' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'placements',
      title: 'Placements',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'rank',
              title: 'Rank',
              type: 'number',
              validation: (Rule) => Rule.required().min(1).max(11),
            }),
            defineField({
              name: 'song',
              title: 'Song',
              type: 'reference',
              to: [{ type: 'song' }],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'artist',
              title: 'Artist',
              type: 'reference',
              to: [{ type: 'artist' }],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'note',
              title: 'Note',
              type: 'string',
              description: 'Optional note (e.g., "New Entry", "Moved up 3 spots")',
            }),
          ],
          preview: {
            select: {
              rank: 'rank',
              songTitle: 'song.title',
              artistName: 'artist.name',
              note: 'note',
            },
            prepare(selection) {
              const {
                rank, songTitle, artistName, note,
              } = selection;
              return {
                title: `#${rank}: ${songTitle || 'Unknown Song'}`,
                subtitle: `${artistName || 'Unknown Artist'}${note ? ` • ${note}` : ''}`,
              };
            },
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(11).max(11),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
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
      contestTitle: 'contest.title',
      publishedAt: 'publishedAt',
    },
    prepare(selection) {
      const { contestTitle, publishedAt } = selection;
      const date = publishedAt
        ? new Date(publishedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
        : 'Not published';
      return {
        title: contestTitle || 'Top 11 Result',
        subtitle: date,
      };
    },
  },
});
