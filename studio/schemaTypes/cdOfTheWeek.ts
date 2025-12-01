import { defineType, defineField, defineArrayMember } from 'sanity';

export default defineType({
  name: 'cdOfTheWeek',
  title: 'CD of the Week',
  type: 'document',
  fields: [
    defineField({
      name: 'artist',
      title: 'Artist',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
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
        source: (doc) => `${doc.artist}-${doc.title}`,
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'label',
      title: 'Record Label',
      type: 'string',
    }),
    defineField({
      name: 'review',
      title: 'Review',
      type: 'array',
      of: [defineArrayMember({ type: 'block' })],
    }),
    defineField({
      name: 'image',
      title: 'Album Cover',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'artistUrl',
      title: 'Artist Website',
      type: 'url',
      description: 'Link to the artist or band website',
    }),
    defineField({
      name: 'reviewer',
      title: 'Reviewer',
      type: 'string',
      description: 'Name of the person who wrote this review',
    }),
    defineField({
      name: 'date',
      title: 'Feature Date',
      type: 'date',
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
      artist: 'artist',
      title: 'title',
      date: 'date',
      media: 'image',
    },
    prepare(selection) {
      const {
        artist, title, date, media,
      } = selection;
      const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) : '';
      return {
        title: `${artist} - ${title}`,
        subtitle: formattedDate,
        media,
      };
    },
  },
  orderings: [
    {
      title: 'Date (Newest)',
      name: 'dateDesc',
      by: [
        { field: 'date', direction: 'desc' },
      ],
    },
    {
      title: 'Date (Oldest)',
      name: 'dateAsc',
      by: [
        { field: 'date', direction: 'asc' },
      ],
    },
    {
      title: 'Artist A-Z',
      name: 'artistAsc',
      by: [
        { field: 'artist', direction: 'asc' },
      ],
    },
  ],
});
