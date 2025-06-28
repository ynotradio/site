export default {
  name: 'dj',
  title: 'DJ',
  type: 'document',
  fields: [
    {
      name: 'person',
      title: 'Person',
      type: 'reference',
      to: [{ type: 'person' }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      description: 'Used to determine the display order of DJs (lower numbers appear first)',
      validation: (Rule) => Rule.required(),
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
        { field: 'sortOrder', direction: 'asc' }
      ]
    },
    {
      title: 'Name',
      name: 'nameAsc',
      by: [
        { field: 'person.name', direction: 'asc' }
      ]
    }
  ]
};
