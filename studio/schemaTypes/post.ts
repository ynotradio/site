import { defineType, defineField, defineArrayMember } from 'sanity';

/**
 * Post Schema
 *
 * A unified content type for front page stories and custom text pages.
 * Posts support:
 * - Slugs for standalone URLs (e.g., /donate)
 * - Publication date ranges (start/end dates)
 * - Rich text content or HTML embeds
 * - Images
 * - Priority-based ordering
 *
 * Migrated from legacy "stories" and "custom_texts" tables.
 */
export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      description: 'The headline or title of the post',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      description: 'URL-friendly identifier (e.g., "donate" for /donate)',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'postType',
      title: 'Post Type',
      description: 'The type of post determines how it is displayed',
      type: 'string',
      options: {
        list: [
          { title: 'Story (Front Page)', value: 'story' },
          { title: 'Custom Page', value: 'custom' },
        ],
        layout: 'radio',
      },
      initialValue: 'story',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      description: 'Rich text content for the post',
      type: 'array',
      of: [defineArrayMember({ type: 'block' })],
    }),
    defineField({
      name: 'htmlEmbed',
      title: 'HTML Embed',
      description: 'Raw HTML content for embeds (use sparingly)',
      type: 'text',
      rows: 10,
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
      description: 'External image URL (legacy, hidden)',
      type: 'url',
      hidden: true,
    }),
    defineField({
      name: 'linkUrl',
      title: 'Link URL',
      description: 'URL to link to when clicking the post',
      type: 'url',
    }),
    defineField({
      name: 'startDate',
      title: 'Start Date',
      description: 'When this post becomes visible',
      type: 'datetime',
    }),
    defineField({
      name: 'endDate',
      title: 'End Date',
      description: 'When this post stops being visible',
      type: 'datetime',
    }),
    defineField({
      name: 'priority',
      title: 'Priority',
      description: 'Display order (lower numbers appear first)',
      type: 'number',
      initialValue: 10,
    }),
    defineField({
      name: 'legacyId',
      title: 'Legacy ID',
      type: 'number',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'legacySource',
      title: 'Legacy Source',
      description: 'Which legacy table this was imported from',
      type: 'string',
      options: {
        list: [
          { title: 'Stories', value: 'stories' },
          { title: 'Custom Texts', value: 'custom_texts' },
        ],
      },
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
      postType: 'postType',
      slug: 'slug.current',
      media: 'image',
      startDate: 'startDate',
    },
    prepare(selection) {
      const {
        title, postType, slug, media, startDate,
      } = selection;
      const typeLabel = postType === 'custom' ? '📄 Custom' : '📰 Story';
      const formattedDate = startDate ? new Date(startDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) : '';
      return {
        title: title || 'Untitled',
        subtitle: `${typeLabel} • /${slug || ''}${formattedDate ? ` • ${formattedDate}` : ''}`,
        media,
      };
    },
  },
  orderings: [
    {
      title: 'Priority',
      name: 'priorityAsc',
      by: [{ field: 'priority', direction: 'asc' }],
    },
    {
      title: 'Start Date (Newest)',
      name: 'startDateDesc',
      by: [{ field: 'startDate', direction: 'desc' }],
    },
    {
      title: 'Start Date (Oldest)',
      name: 'startDateAsc',
      by: [{ field: 'startDate', direction: 'asc' }],
    },
    {
      title: 'Title A-Z',
      name: 'titleAsc',
      by: [{ field: 'title', direction: 'asc' }],
    },
  ],
});
