import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'show',
  title: 'Show',
  type: 'document',
  fields: [
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'startTime',
      title: 'Start Time',
      type: 'string',
      description: 'Start time in HH:MM format (24-hour)',
      validation: (Rule) => Rule.required().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        name: 'time format',
        invert: false,
      }).error('Please enter a valid time in HH:MM format (e.g., 09:00 or 14:30)'),
    }),
    defineField({
      name: 'endTime',
      title: 'End Time',
      type: 'string',
      description: 'End time in HH:MM format (24-hour)',
      validation: (Rule) => Rule.required().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        name: 'time format',
        invert: false,
      }).error('Please enter a valid time in HH:MM format (e.g., 09:00 or 14:30)'),
    }),
    defineField({
      name: 'name',
      title: 'Show Name',
      type: 'string',
      description: 'Name of the show (e.g., "The Nooner"). Required if no DJ is selected.',
      validation: (Rule) => Rule.custom((value, context) => {
        const dj = (context.document as { dj?: { _ref?: string } })?.dj;
        if (!value && !dj?._ref) {
          return 'Either a show name or a DJ must be provided';
        }
        return true;
      }),
    }),
    defineField({
      name: 'dj',
      title: 'DJ',
      type: 'reference',
      to: [{ type: 'dj' }],
      description: 'Reference to a DJ. Required if no show name is provided.',
      validation: (Rule) => Rule.custom((value, context) => {
        const name = (context.document as { name?: string })?.name;
        if (!value?._ref && !name) {
          return 'Either a show name or a DJ must be provided';
        }
        return true;
      }),
    }),
    defineField({
      name: 'note',
      title: 'Note',
      type: 'string',
      description: 'Additional notes about the show',
    }),
    defineField({
      name: 'legacyId',
      title: 'Legacy ID',
      type: 'number',
      description: 'Original ID from the legacy database, used for migration tracking',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'migratedAt',
      title: 'Migrated At',
      type: 'datetime',
      description: 'Timestamp when this record was migrated from the legacy system',
      readOnly: true,
      hidden: true,
    }),
  ],
  preview: {
    select: {
      date: 'date',
      name: 'name',
      djName: 'dj.person.name',
      startTime: 'startTime',
      endTime: 'endTime',
    },
    prepare(selection) {
      const {
        date, name, djName, startTime, endTime,
      } = selection;
      const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) : 'No date';
      const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : '';
      const subtitle = [formattedDate, timeRange].filter(Boolean).join(' | ');

      // Build title based on available fields
      let title: string;
      if (name && djName) {
        title = `${name} w/ ${djName}`;
      } else if (djName) {
        title = djName;
      } else if (name) {
        title = name;
      } else {
        title = 'Untitled Show';
      }

      return {
        title,
        subtitle,
      };
    },
  },
  orderings: [
    {
      title: 'Date & Time (Newest)',
      name: 'dateTimeDesc',
      by: [
        { field: 'date', direction: 'desc' },
        { field: 'startTime', direction: 'desc' },
      ],
    },
    {
      title: 'Date & Time (Oldest)',
      name: 'dateTimeAsc',
      by: [
        { field: 'date', direction: 'asc' },
        { field: 'startTime', direction: 'asc' },
      ],
    },
    {
      title: 'Show Name (A-Z)',
      name: 'nameAsc',
      by: [
        { field: 'name', direction: 'asc' },
      ],
    },
  ],
});
