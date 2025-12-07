import { defineType, defineField, defineArrayMember } from 'sanity';

/**
 * Modern Rock Madness Tournament Schema
 *
 * Annual bracket-style tournament configuration.
 * Votes are stored in Neon PostgreSQL.
 *
 * Document ID format: modern-rock-madness-{year}-{month}-{date}
 * (e.g., modern-rock-madness-2025-03-31)
 */
export default defineType({
  name: 'modernRockMadnessTournament',
  title: 'Modern Rock Madness Tournament',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'e.g., "Modern Rock Madness 2025"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'date',
      description: 'Tournament start date (used in document ID: modern-rock-madness-{year}-{month}-{date})',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Active', value: 'active' },
          { title: 'Complete', value: 'complete' },
          { title: 'Archived', value: 'archived' },
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'rounds',
      title: 'Rounds',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'roundNumber',
              title: 'Round Number',
              type: 'number',
              validation: (Rule) => Rule.required().min(1),
            }),
            defineField({
              name: 'name',
              title: 'Round Name',
              type: 'string',
              description: 'e.g., "First Round", "Sweet Sixteen", "Elite Eight", "Final Four", "Championship"',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'startsAt',
              title: 'Starts At',
              type: 'datetime',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'endsAt',
              title: 'Ends At',
              type: 'datetime',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              roundNumber: 'roundNumber',
              name: 'name',
              startsAt: 'startsAt',
            },
            prepare(selection) {
              const { roundNumber, name, startsAt } = selection;
              const date = startsAt
                ? new Date(startsAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
                : 'TBD';
              return {
                title: `Round ${roundNumber}: ${name}`,
                subtitle: `Starts ${date}`,
              };
            },
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(1),
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
      startDate: 'startDate',
      status: 'status',
    },
    prepare(selection) {
      const {
        title, startDate, status,
      } = selection;
      const statusEmoji: Record<string, string> = {
        draft: '📝',
        active: '🏆',
        complete: '✅',
        archived: '📦',
      };
      const emoji = statusEmoji[status] || '❓';
      const year = startDate ? new Date(startDate).getFullYear() : 'Unknown';
      return {
        title: title || `Modern Rock Madness ${year}`,
        subtitle: `${emoji} ${status}`,
      };
    },
  },
  orderings: [
    {
      title: 'Most Recent',
      name: 'mostRecent',
      by: [
        { field: 'startDate', direction: 'desc' },
      ],
    },
  ],
});
