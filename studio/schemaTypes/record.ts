import { defineType, defineField, defineArrayMember } from 'sanity';

/**
 * Record (Album) Schema
 *
 * A record can:
 * - Have many songs (via `songs` array reference)
 * - Be associated with one or more artists
 * - Be featured as CD of the Week (via cdOfTheWeekFeature reference from cdOfTheWeek)
 * - Appear in Year End Poll
 */
export default defineType({
  name: 'record',
  title: 'Record',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Album Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'artists',
      title: 'Artists',
      description: 'One or more artists associated with this record',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'artist' }],
        }),
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'releaseDate',
      title: 'Release Date',
      type: 'date',
    }),
    defineField({
      name: 'label',
      title: 'Record Label',
      type: 'string',
    }),
    defineField({
      name: 'coverImage',
      title: 'Album Cover',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'songs',
      title: 'Songs',
      description: 'Tracks on this record',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'song' }],
        }),
      ],
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [defineArrayMember({ type: 'block' })],
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
      title: 'title',
      artist0: 'artists.0.name',
      artist1: 'artists.1.name',
      media: 'coverImage',
      releaseDate: 'releaseDate',
    },
    prepare(selection) {
      const {
        title, artist0, artist1, media, releaseDate,
      } = selection;
      const artists = [artist0, artist1].filter(Boolean);
      const artistNames = artists.length > 1
        ? `${artists[0]} + ${artists.length - 1} more`
        : artists[0] || 'Unknown Artist';
      const year = releaseDate ? new Date(releaseDate).getFullYear() : '';
      return {
        title,
        subtitle: `${artistNames}${year ? ` (${year})` : ''}`,
        media,
      };
    },
  },
  orderings: [
    {
      title: 'Title A-Z',
      name: 'titleAsc',
      by: [{ field: 'title', direction: 'asc' }],
    },
    {
      title: 'Release Date (Newest)',
      name: 'releaseDateDesc',
      by: [{ field: 'releaseDate', direction: 'desc' }],
    },
    {
      title: 'Release Date (Oldest)',
      name: 'releaseDateAsc',
      by: [{ field: 'releaseDate', direction: 'asc' }],
    },
  ],
});
