import { defineType, defineField } from 'sanity';

/**
 * Modern Rock Madness Match Schema
 *
 * Individual bracket matchup between two bands.
 * Votes are stored in Neon PostgreSQL.
 *
 * Document ID format: mrm-{year}-match-{matchNumber} (e.g., mrm-2025-match-1)
 */
export default defineType({
  name: 'mrmMatch',
  title: 'MRM Match',
  type: 'document',
  fields: [
    defineField({
      name: 'tournament',
      title: 'Tournament',
      type: 'reference',
      to: [{ type: 'mrmTournament' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'matchNumber',
      title: 'Match Number',
      type: 'number',
      description: 'Unique match number within tournament',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'round',
      title: 'Round',
      type: 'number',
      description: 'Tournament round (1 = First Round, 2 = Second Round, etc.)',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'region',
      title: 'Region',
      type: 'string',
      description: 'Bracket region (e.g., "East", "West", "North", "South")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'band1',
      title: 'Band 1',
      type: 'reference',
      to: [{ type: 'mrmBand' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'band2',
      title: 'Band 2',
      type: 'reference',
      to: [{ type: 'mrmBand' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'winner',
      title: 'Winner',
      type: 'reference',
      to: [{ type: 'mrmBand' }],
      description: 'Winning band (set after voting closes)',
    }),
    defineField({
      name: 'startsAt',
      title: 'Voting Starts At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endsAt',
      title: 'Voting Ends At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'showScore',
      title: 'Show Score',
      type: 'boolean',
      description: 'Whether to display vote counts publicly',
      initialValue: false,
    }),
    defineField({
      name: 'sponsor',
      title: 'Sponsor',
      type: 'string',
      description: 'Match sponsor name',
    }),
    defineField({
      name: 'sponsorMessage',
      title: 'Sponsor Message',
      type: 'text',
      description: 'Message from match sponsor',
      rows: 3,
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
      band1Name: 'band1.artist.name',
      band2Name: 'band2.artist.name',
      winnerName: 'winner.artist.name',
      matchNumber: 'matchNumber',
      round: 'round',
    },
    prepare(selection) {
      const {
        band1Name, band2Name, winnerName, matchNumber, round,
      } = selection;
      const vs = `${band1Name || 'TBD'} vs ${band2Name || 'TBD'}`;
      const winnerText = winnerName ? ` • Winner: ${winnerName}` : '';
      return {
        title: `Match ${matchNumber}: ${vs}`,
        subtitle: `Round ${round}${winnerText}`,
      };
    },
  },
  orderings: [
    {
      title: 'Match Number',
      name: 'matchNumber',
      by: [
        { field: 'matchNumber', direction: 'asc' },
      ],
    },
    {
      title: 'Round',
      name: 'round',
      by: [
        { field: 'round', direction: 'asc' },
        { field: 'matchNumber', direction: 'asc' },
      ],
    },
  ],
});
