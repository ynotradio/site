import { Rule as ValidationRule } from 'sanity';
import { SanityClient } from '@sanity/client';

interface SanityContext {
  getClient: (options: { apiVersion: string }) => SanityClient
}

export default {
  name: 'dj',
  title: 'DJ',
  type: 'document',
  // Add support for list ordering with the _ordering field
  fieldsets: [
    {
      name: 'ordering',
      title: 'Ordering',
      options: {
        collapsible: true,
        collapsed: false,
      },
    },
  ],
  fields: [
    {
      name: 'person',
      title: 'Person',
      type: 'reference',
      to: [{ type: 'person' }],
      validation: (Rule: ValidationRule) => Rule.required(),
    },
    {
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      description: 'Used to determine the display order of DJs (lower numbers appear first)',
      validation: (Rule: ValidationRule) => Rule.required(),
      // Make this field hidden as it will be managed by drag-and-drop
      hidden: true,
      // Add a default value to handle new DJ creation
      initialValue: async (_: unknown, context: SanityContext) => {
        // Query for the highest current sortOrder and add 1
        const client = context.getClient({ apiVersion: '2023-01-01' });
        const docs = await client.fetch('*[_type == "dj"] | order(sortOrder desc)[0...1] {sortOrder}');
        return docs.length > 0 ? (docs[0].sortOrder + 1) : 0;
      },
    },
    {
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'Whether this DJ is currently active',
      initialValue: true,
    },
  ],
  preview: {
    select: {
      title: 'person.name',
      subtitle: 'sortOrder',
      media: 'person.photo',
    },
  },
  orderings: [
    {
      title: 'Sort Order',
      name: 'sortOrderAsc',
      by: [
        { field: 'sortOrder', direction: 'asc' },
      ],
    },
    {
      title: 'Name',
      name: 'nameAsc',
      by: [
        { field: 'person.name', direction: 'asc' },
      ],
    },
  ],
};
