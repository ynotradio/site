import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'ad',
  title: 'Ad',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'date',
    }),
    defineField({
      name: 'endDate',
      title: 'End Date',
      type: 'date',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
    }),
    defineField({
      name: 'priority',
      title: 'Priority',
      type: 'number',
      description: 'Higher numbers are displayed first',
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
      title: 'name',
      subtitle: 'url',
      media: 'image',
    },
  },
  orderings: [
    {
      title: 'Priority',
      name: 'priorityDesc',
      by: [
        { field: 'priority', direction: 'desc' },
      ],
    },
    {
      title: 'Start Date',
      name: 'startDateDesc',
      by: [
        { field: 'startDate', direction: 'desc' },
      ],
    },
  ],
});
