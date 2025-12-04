import { defineType, defineField } from 'sanity';

/**
 * Year End Poll Schema
 *
 * Annual poll configuration managed by staff.
 * Contains categories defined in yearEndPollCategory documents.
 * Votes and entries are stored in Neon PostgreSQL.
 */
export default defineType({
  name: 'yearEndPoll',
  title: 'Year End Poll',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'e.g., "Year End Poll 2025"',
      validation: (Rule) => Rule.required(),
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
      year: 'year',
      status: 'status',
    },
    prepare(selection) {
      const { title, year, status } = selection;
      const statusEmoji: Record<string, string> = {
        draft: '📝',
        open: '🗳️',
        closed: '🔒',
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
