import { defineType, defineField, defineArrayMember } from 'sanity';

/**
 * Modern Rock Madness Tournament Schema
 *
 * Annual tournament configuration.
 * Defines rounds, dates, and overall tournament status.
 * Participants are defined in mrmBand documents, matchups in mrmMatch documents.
 */
export default defineType({
  name: 'mrmTournament',
  title: 'MRM Tournament',
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
      name: 'year',
      title: 'Year',
      type: 'number',
      validation: (Rule) => Rule.required().min(2000).max(2100),
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
              description: '1 = First Round, 2 = Second Round, etc.',
              validation: (Rule) => Rule.required().min(1),
            }),
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
              description: 'e.g., "Round of 64", "Sweet 16", "Final Four"',
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
              endsAt: 'endsAt',
            },
            prepare(selection) {
              const {
                roundNumber, name, startsAt, endsAt,
              } = selection;
              const startDate = startsAt
                ? new Date(startsAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
                : '';
              const endDate = endsAt
                ? new Date(endsAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
                : '';
              return {
                title: `Round ${roundNumber}: ${name}`,
                subtitle: `${startDate} – ${endDate}`,
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
      year: 'year',
      status: 'status',
    },
    prepare(selection) {
      const { title, year, status } = selection;
      const statusEmoji: Record<string, string> = {
        draft: '📝',
        active: '🏆',
        complete: '✅',
        archived: '📦',
      };
      const emoji = statusEmoji[status] || '❓';
      return {
        title,
        subtitle: `${year} • ${emoji} ${status}`,
      };
    },
  },
  orderings: [
    {
      title: 'Most Recent',
      name: 'mostRecent',
      by: [{ field: 'year', direction: 'desc' }],
    },
  ],
});
