import { defineType, defineField } from 'sanity';

/**
 * Modern Rock Madness Match Schema
 *
 * Individual bracket matchup between two groups.
 * Votes are stored in Neon PostgreSQL.
 *
 * Document ID format: modern-rock-madness-{year}-match-{matchNumber} (e.g., modern-rock-madness-2025-match-1)
 */
export default defineType({
  name: 'modernRockMadnessMatch',
  title: 'Modern Rock Madness Match',
  type: 'document',
  fields: [
    defineField({
      name: 'tournament',
      title: 'Tournament',
      type: 'reference',
      to: [{ type: 'modernRockMadnessTournament' }],
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
      name: 'group1',
      title: 'Group 1',
      type: 'reference',
      to: [{ type: 'modernRockMadnessGroup' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'group2',
      title: 'Group 2',
      type: 'reference',
      to: [{ type: 'modernRockMadnessGroup' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'winner',
      title: 'Winner',
      type: 'reference',
      to: [{ type: 'modernRockMadnessGroup' }],
      description: 'Winning group (set after voting closes)',
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
      group1Artists: 'group1.artists',
      group2Artists: 'group2.artists',
      winnerArtists: 'winner.artists',
      matchNumber: 'matchNumber',
      round: 'round',
    },
    prepare(selection) {
      const {
        group1Artists, group2Artists, winnerArtists, matchNumber, round,
      } = selection;
      const group1Name = group1Artists && group1Artists.length > 0 && group1Artists[0].name
        ? group1Artists[0].name
        : 'TBD';
      const group2Name = group2Artists && group2Artists.length > 0 && group2Artists[0].name
        ? group2Artists[0].name
        : 'TBD';
      const winnerName = winnerArtists && winnerArtists.length > 0 && winnerArtists[0].name
        ? winnerArtists[0].name
        : null;
      const vs = `${group1Name} vs ${group2Name}`;
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
