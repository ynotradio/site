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
      name: 'host',
      title: 'Host',
      type: 'string',
      description: 'Name of the show host or DJ',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'note',
      title: 'Note',
      type: 'string',
      description: 'Additional notes about the show (e.g., show name or special info)',
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
      host: 'host',
      startTime: 'startTime',
      endTime: 'endTime',
      note: 'note',
    },
    prepare(selection) {
      const {
        date, host, startTime, endTime, note,
      } = selection;
      const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) : 'No date';
      const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : '';
      const subtitle = [formattedDate, timeRange].filter(Boolean).join(' | ');
      return {
        title: note ? `${host} - ${note}` : host || 'Unknown Host',
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
      title: 'Host (A-Z)',
      name: 'hostAsc',
      by: [
        { field: 'host', direction: 'asc' },
      ],
    },
  ],
});
