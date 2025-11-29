import { defineType, defineField, defineArrayMember } from 'sanity';

export default defineType({
  name: 'artist',
  title: 'Artist',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'array',
      of: [defineArrayMember({ type: 'block' })],
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
    }),
    defineField({
      name: 'members',
      title: 'Members',
      description: 'Band members (if applicable)',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'person' }],
        }),
      ],
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
      title: 'name',
      media: 'photo',
    },
  },
});
