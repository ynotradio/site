import { defineType, defineField, defineArrayMember } from 'sanity';

/**
 * Top 11 Contest Schema
 *
 * Weekly Top 11 contest configuration managed by staff.
 * Votes and entries are stored in Neon PostgreSQL.
 *
 * Document ID format: top11-{year}-{month}-{date} (e.g., top11-2025-11-20)
 * Max selections: Always 11 (hard-coded)
 * Write-ins: Always allowed
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
      name: 'date',
      title: 'Contest Date',
      type: 'date',
      description: 'Date of the contest (used in document ID: top11-YYYY-MM-DD)',
      validation: (Rule) => Rule.required(),
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
      name: 'summary',
      title: 'Summary',
      type: 'array',
      description: 'Summary text with links and embeds (e.g., Mixcloud player)',
      of: [defineArrayMember({ type: 'block' })],
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
      date: 'date',
      status: 'status',
    },
    prepare(selection) {
      const {
        title, date, status,
      } = selection;
      const statusEmoji: Record<string, string> = {
        draft: '📝',
        open: '🗳️',
        closed: '🔒',
        archived: '📦',
      };
      const emoji = statusEmoji[status] || '❓';
      const formattedDate = date
        ? new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
        : 'No date';
      return {
        title,
        subtitle: `${formattedDate} • ${emoji} ${status}`,
      };
    },
  },
  orderings: [
    {
      title: 'Most Recent',
      name: 'mostRecent',
      by: [
        { field: 'date', direction: 'desc' },
      ],
    },
  ],
});
