import { defineType, defineField, defineArrayMember } from 'sanity';

/**
 * Modern Rock Madness Group Schema
 *
 * Tournament participant (group/artist) with seeding and bracket information.
 * A group can represent one or more artists (e.g., Jack White / White Stripes).
 */
export default defineType({
  name: 'modernRockMadnessGroup',
  title: 'Modern Rock Madness Group',
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
      name: 'artists',
      title: 'Artists',
      type: 'array',
      description: 'One or more artists in this group (e.g., Jack White / White Stripes)',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'artist' }],
        }),
      ],
      validation: (Rule) => Rule.required().min(1),
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
      description: 'Sponsor name for this group',
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
      artists: 'artists',
      seed: 'seed',
      region: 'region',
      placement: 'placement',
    },
    prepare(selection) {
      const {
        artists, seed, region, placement,
      } = selection;
      // Get first artist name for display
      const artistName = artists && artists.length > 0 && artists[0].name 
        ? artists[0].name 
        : 'Unknown Artist';
      const multiArtist = artists && artists.length > 1 ? ' +' : '';
      const placementText = placement ? ` • ${placement}` : '';
      return {
        title: `#${seed} ${artistName}${multiArtist}`,
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
