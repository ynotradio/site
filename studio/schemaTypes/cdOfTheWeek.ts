import { defineType, defineField, defineArrayMember } from 'sanity';

/**
 * CD of the Week Schema
 *
 * Features a record (album) as the CD of the Week with a review.
 * Links to a Record document instead of storing artist/title as strings.
 */
export default defineType({
  name: 'cdOfTheWeek',
  title: 'CD of the Week',
  type: 'document',
  fields: [
    defineField({
      name: 'record',
      title: 'Record',
      description: 'The album being featured',
      type: 'reference',
      to: [{ type: 'record' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Feature Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'review',
      title: 'Review',
      type: 'array',
      of: [defineArrayMember({ type: 'block' })],
    }),
    defineField({
      name: 'reviewer',
      title: 'Reviewer',
      type: 'string',
      description: 'Name of the person who wrote this review',
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
      recordTitle: 'record.title',
      artist0: 'record.artists.0.name',
      date: 'date',
      media: 'record.coverImage',
    },
    prepare(selection) {
      const {
        recordTitle, artist0, date, media,
      } = selection;
      const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) : '';
      return {
        title: `${artist0 || 'Unknown Artist'} - ${recordTitle || 'Unknown Album'}`,
        subtitle: formattedDate,
        media,
      };
    },
  },
  orderings: [
    {
      title: 'Date (Newest)',
      name: 'dateDesc',
      by: [{ field: 'date', direction: 'desc' }],
    },
    {
      title: 'Date (Oldest)',
      name: 'dateAsc',
      by: [{ field: 'date', direction: 'asc' }],
    },
  ],
});
