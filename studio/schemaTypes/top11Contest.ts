import { defineType, defineField, defineArrayMember } from 'sanity';

/**
 * Top 11 Contest Schema
 *
 * Weekly Top 11 contest configuration managed by staff.
 * Votes and entries are stored in Neon PostgreSQL.
 */
export default defineType({
  name: 'top11Contest',
  title: 'Top 11 Contest',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'e.g., "Top 11 - Week 23, 2025"',
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
      name: 'weekNumber',
      title: 'Week Number',
      type: 'number',
      description: 'Week number of the year (1-52)',
      validation: (Rule) => Rule.required().min(1).max(52),
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      validation: (Rule) => Rule.required().min(2000).max(2100),
    }),
    defineField({
      name: 'votingOpensAt',
      title: 'Voting Opens At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'votingClosesAt',
      title: 'Voting Closes At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'maxSelections',
      title: 'Max Selections',
      type: 'number',
      description: 'Maximum number of songs a user can vote for',
      initialValue: 11,
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'allowWriteIns',
      title: 'Allow Write-Ins',
      type: 'boolean',
      description: 'Allow users to submit write-in votes',
      initialValue: true,
    }),
    defineField({
      name: 'songs',
      title: 'Songs',
      description: 'Songs available for voting',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'song' }],
        }),
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'contestPrize',
      title: 'Contest Prize',
      type: 'string',
      description: 'Description of the prize for contest entries',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Open', value: 'open' },
          { title: 'Closed', value: 'closed' },
          { title: 'Archived', value: 'archived' },
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
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
      title: 'title',
      weekNumber: 'weekNumber',
      year: 'year',
      status: 'status',
    },
    prepare(selection) {
      const {
        title, weekNumber, year, status,
      } = selection;
      const statusEmoji: Record<string, string> = {
        draft: '📝',
        open: '🗳️',
        closed: '🔒',
        archived: '📦',
      };
      const emoji = statusEmoji[status] || '❓';
      return {
        title,
        subtitle: `Week ${weekNumber}, ${year} • ${emoji} ${status}`,
      };
    },
  },
  orderings: [
    {
      title: 'Most Recent',
      name: 'mostRecent',
      by: [
        { field: 'year', direction: 'desc' },
        { field: 'weekNumber', direction: 'desc' },
      ],
    },
  ],
});
