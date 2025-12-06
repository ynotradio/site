import { defineType, defineField } from 'sanity';

/**
 * Modern Rock Madness Band Schema
 *
 * Tournament participant (band/artist) with seeding and bracket information.
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
      description: 'Tournament seed number (1-64 typical)',
      validation: (Rule) => Rule.required().min(1).max(128),
    }),
    defineField({
      name: 'region',
      title: 'Region',
      type: 'string',
      description: 'Bracket region (e.g., "East", "West", "North", "South")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'placement',
      title: 'Final Placement',
      type: 'string',
      description: 'Tournament result (e.g., "Champion", "Runner-up", "Elite Eight")',
    }),
    defineField({
      name: 'sponsor',
      title: 'Sponsor',
      type: 'string',
      description: 'Sponsor name for this band',
    }),
    defineField({
      name: 'abbreviation',
      title: 'Abbreviation',
      type: 'string',
      description: 'Short abbreviation for display (e.g., "QOTSA")',
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
      placement: 'placement',
    },
    prepare(selection) {
      const {
        artistName, seed, region, placement,
      } = selection;
      const placementText = placement ? ` • ${placement}` : '';
      return {
        title: `#${seed} ${artistName || 'Unknown Artist'}`,
        subtitle: `${region}${placementText}`,
      };
    },
  },
  orderings: [
    {
      title: 'Seed',
      name: 'seed',
      by: [
        { field: 'seed', direction: 'asc' },
      ],
    },
    {
      title: 'Region',
      name: 'region',
      by: [
        { field: 'region', direction: 'asc' },
        { field: 'seed', direction: 'asc' },
      ],
    },
  ],
});
