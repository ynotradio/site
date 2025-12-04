import { defineType, defineField } from 'sanity';

/**
 * Modern Rock Madness Band Schema
 *
 * Tournament participant with seeding and regional assignment.
 * References an Artist document for band information.
 */
export default defineType({
  name: 'mrmBand',
  title: 'MRM Band',
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
      name: 'artist',
      title: 'Artist',
      type: 'reference',
      to: [{ type: 'artist' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'seed',
      title: 'Seed',
      type: 'number',
      description: 'Tournament seed (1-16 in each region)',
      validation: (Rule) => Rule.required().min(1).max(16),
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
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'placement',
      title: 'Placement',
      type: 'number',
      description: 'Final tournament placement (1 = Winner, 2 = Runner-up, etc.)',
    }),
    defineField({
      name: 'sponsor',
      title: 'Sponsor',
      type: 'string',
      description: 'Band sponsor name (if applicable)',
    }),
    defineField({
      name: 'abbreviation',
      title: 'Abbreviation',
      type: 'string',
      description: 'Short abbreviation for display in bracket (e.g., "QOTSA")',
      validation: (Rule) => Rule.max(10),
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
      artistName: 'artist.name',
      seed: 'seed',
      region: 'region',
      tournamentTitle: 'tournament.title',
      artistPhoto: 'artist.photo',
    },
    prepare(selection) {
      const {
        artistName, seed, region, tournamentTitle, artistPhoto,
      } = selection;
      return {
        title: artistName || 'Unknown Artist',
        subtitle: `${tournamentTitle || 'Tournament'} • #${seed} ${region || ''}`,
        media: artistPhoto,
      };
    },
  },
  orderings: [
    {
      title: 'Seed',
      name: 'seed',
      by: [
        { field: 'tournament.year', direction: 'desc' },
        { field: 'region', direction: 'asc' },
        { field: 'seed', direction: 'asc' },
      ],
    },
  ],
});
