import { defineType, defineField } from 'sanity';

/**
 * OnDemand Schema
 *
 * Audio content featuring artists in sessions, interviews, or takeovers.
 * References Artist documents rather than storing artist names as strings.
 */

/**
 * Extract content type label from note field for display purposes.
 * Note: The migration script (bin/migrations/importOnDemand.ts) has a similar
 * function `determineContentType` that extracts the enum value for the contentType field.
 */
function extractContentTypeLabel(note: string | null | undefined): string {
  if (!note) return '';
  if (note.includes('Session')) return 'Session';
  if (note.includes('Interview')) return 'Interview';
  if (note.includes('Takeover')) return 'Takeover';
  // Fallback: use text before any HTML
  return note.split('<')[0].trim();
}

export default defineType({
  name: 'onDemand',
  title: 'On Demand',
  type: 'document',
  fields: [
    defineField({
      name: 'headline',
      title: 'Headline',
      description: 'The artist or band name as displayed',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'artist',
      title: 'Artist',
      description: 'Reference to the Artist document',
      type: 'reference',
      to: [{ type: 'artist' }],
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'contentType',
      title: 'Content Type',
      type: 'string',
      options: {
        list: [
          { title: 'Y-Not Session', value: 'session' },
          { title: 'Interview', value: 'interview' },
          { title: 'Radio Takeover', value: 'takeover' },
          { title: 'Other', value: 'other' },
        ],
        layout: 'dropdown',
      },
    }),
    defineField({
      name: 'note',
      title: 'Note',
      description: 'Additional details (e.g., location, video link)',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'songs',
      title: 'Songs',
      description: 'List of songs performed (separated by /)',
      type: 'string',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'imageUrl',
      title: 'Image URL',
      description: 'External image URL (legacy)',
      type: 'url',
      hidden: true,
    }),
    defineField({
      name: 'audioId',
      title: 'Audio ID',
      description: 'OpenDrive audio file ID',
      type: 'string',
    }),
    defineField({
      name: 'audioSource',
      title: 'Audio Source',
      type: 'string',
      initialValue: 'opendrive',
      hidden: true,
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      description: 'Link to video of the session (if available)',
      type: 'url',
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
      headline: 'headline',
      date: 'date',
      note: 'note',
      media: 'image',
      artistName: 'artist.name',
    },
    prepare(selection) {
      const {
        headline, date, note, media, artistName,
      } = selection;
      const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) : '';

      // Extract content type from note for subtitle using helper function
      const contentType = extractContentTypeLabel(note);

      return {
        title: headline || artistName || 'Untitled',
        subtitle: `${formattedDate}${contentType ? ` — ${contentType}` : ''}`,
        media,
      };
    },
  },
  orderings: [
    {
      title: 'Date (Newest)',
      name: 'dateDesc',
      by: [{ field: 'date', direction: 'desc' }],
    },
    {
      title: 'Date (Oldest)',
      name: 'dateAsc',
      by: [{ field: 'date', direction: 'asc' }],
    },
    {
      title: 'Headline A-Z',
      name: 'headlineAsc',
      by: [{ field: 'headline', direction: 'asc' }],
    },
  ],
});
