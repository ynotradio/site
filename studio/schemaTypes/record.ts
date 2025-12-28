import { defineType, defineField, defineArrayMember } from 'sanity';
import { MusicBrainzRecordInput } from '../components/MusicBrainzInput/MusicBrainzRecordInput';

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
      name: 'musicbrainzId',
      title: 'MusicBrainz Release ID',
      type: 'string',
      description: 'MusicBrainz Release MBID (e.g., 5b11f4ce-a62d-471e-81fc-a69a8278c7da)',
      components: {
        input: MusicBrainzRecordInput,
      },
      validation: (Rule) => Rule.regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
        name: 'UUID',
        invert: false,
      }).error('Must be a valid MusicBrainz ID (UUID format)'),
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
