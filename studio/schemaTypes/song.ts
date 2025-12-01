import { defineType, defineField, defineArrayMember } from 'sanity';

/**
 * Song Schema
 *
 * A song can:
 * - Belong to a record (album)
 * - Appear in the Top 11 countdown
 * - Appear in the Year End Poll
 * - Appear in the "New Music" section
 */
export default defineType({
  name: 'song',
  title: 'Song',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Song Title',
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
      description: 'Artist(s) who performed this song',
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
      name: 'record',
      title: 'Record (Album)',
      description: 'The album this song appears on',
      type: 'reference',
      to: [{ type: 'record' }],
    }),
    defineField({
      name: 'trackNumber',
      title: 'Track Number',
      type: 'number',
      description: 'Position on the album',
      validation: (Rule) => Rule.positive().integer(),
    }),
    defineField({
      name: 'duration',
      title: 'Duration (seconds)',
      type: 'number',
      description: 'Length of the song in seconds',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'streamUrl',
      title: 'Stream URL',
      type: 'url',
      description: 'Link to listen to the song (e.g., Spotify, Bandcamp)',
    }),
    defineField({
      name: 'releaseDate',
      title: 'Release Date',
      type: 'date',
      description: 'Single release date (if different from album)',
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
      recordTitle: 'record.title',
      media: 'record.coverImage',
    },
    prepare(selection) {
      const {
        title, artist0, artist1, recordTitle, media,
      } = selection;
      const artists = [artist0, artist1].filter(Boolean);
      const artistNames = artists.length > 1
        ? `${artists[0]} + ${artists.length - 1} more`
        : artists[0] || 'Unknown Artist';
      return {
        title,
        subtitle: `${artistNames}${recordTitle ? ` — ${recordTitle}` : ''}`,
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
  ],
});
