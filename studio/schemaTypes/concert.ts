import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'concert',
  title: 'Concert',
  type: 'document',
  fields: [
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'artists',
      title: 'Artists',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'artist' }],
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'venue',
      title: 'Venue',
      type: 'reference',
      to: [{ type: 'venue' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'ticketInfo',
      title: 'Ticket Info',
      type: 'string',
      description: 'Price or ticket availability information',
    }),
    defineField({
      name: 'ticketUrl',
      title: 'Ticket URL',
      type: 'url',
      description: 'Link to purchase tickets',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Show this concert prominently on the site',
      initialValue: false,
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
      date: 'date',
      artist0: 'artists.0.name',
      artist1: 'artists.1.name',
      artist2: 'artists.2.name',
      artist3: 'artists.3.name',
      venueName: 'venue.name',
      venueCity: 'venue.city',
      artistPhoto: 'artists.0.photo',
    },
    prepare(selection) {
      const {
        date, artist0, artist1, artist2, artist3, venueName, venueCity, artistPhoto,
      } = selection;
      const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) : 'No date';
      const location = venueCity ? `${venueName}, ${venueCity}` : venueName;

      // Build artist names from individual selections
      const artists = [artist0, artist1, artist2, artist3].filter(Boolean);
      const artistNames = artists.length > 0
        ? artists.join(' & ')
        : 'Unknown Artist';

      return {
        title: artistNames,
        subtitle: `${formattedDate} @ ${location || 'Unknown Venue'}`,
        media: artistPhoto,
      };
    },
  },
  orderings: [
    {
      title: 'Date (Newest)',
      name: 'dateDesc',
      by: [
        { field: 'date', direction: 'desc' },
      ],
    },
    {
      title: 'Date (Oldest)',
      name: 'dateAsc',
      by: [
        { field: 'date', direction: 'asc' },
      ],
    },
  ],
});
