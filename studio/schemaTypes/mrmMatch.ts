import { defineType, defineField } from 'sanity';

/**
 * Modern Rock Madness Match Schema
 *
 * Individual matchup in the tournament bracket.
 * Votes are stored in Neon PostgreSQL.
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
      description: 'Unique match identifier within the tournament',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'round',
      title: 'Round',
      type: 'number',
      description: 'Round number (1 = First Round, 2 = Second Round, etc.)',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'region',
      title: 'Region',
      type: 'string',
      description: 'Tournament region/bracket',
      options: {
        list: [
          { title: 'East', value: 'east' },
          { title: 'West', value: 'west' },
          { title: 'North', value: 'north' },
          { title: 'South', value: 'south' },
          { title: 'Final Four', value: 'final-four' },
          { title: 'Championship', value: 'championship' },
        ],
        layout: 'dropdown',
      },
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
      description: 'Set when voting closes',
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
    defineField({
      name: 'showScore',
      title: 'Show Score',
      type: 'boolean',
      description: 'Display live vote counts',
      initialValue: true,
    }),
    defineField({
      name: 'sponsor',
      title: 'Sponsor',
      type: 'string',
      description: 'Match sponsor name (if applicable)',
    }),
    defineField({
      name: 'sponsorMessage',
      title: 'Sponsor Message',
      type: 'text',
      description: 'Sponsor message to display with the match',
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
      round: 'round',
      matchNumber: 'matchNumber',
      tournamentTitle: 'tournament.title',
    },
    prepare(selection) {
      const {
        band1Name, band2Name, round, matchNumber, tournamentTitle,
      } = selection;
      return {
        title: `Match #${matchNumber}: ${band1Name || 'TBD'} vs ${band2Name || 'TBD'}`,
        subtitle: `${tournamentTitle || 'Tournament'} • Round ${round}`,
      };
    },
  },
  orderings: [
    {
      title: 'Match Number',
      name: 'matchNumber',
      by: [
        { field: 'tournament.year', direction: 'desc' },
        { field: 'matchNumber', direction: 'asc' },
      ],
    },
    {
      title: 'Round',
      name: 'round',
      by: [
        { field: 'tournament.year', direction: 'desc' },
        { field: 'round', direction: 'asc' },
        { field: 'matchNumber', direction: 'asc' },
      ],
    },
  ],
});
