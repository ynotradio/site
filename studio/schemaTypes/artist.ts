import { Rule as ValidationRule } from 'sanity';

export default {
  name: 'artist',
  title: 'Artist',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule: ValidationRule) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule: ValidationRule) => Rule.required(),
    },
    {
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'bio',
      title: 'Bio',
      type: 'array',
      of: [{ type: 'block' }],
    },
    {
      name: 'website',
      title: 'Website',
      type: 'url',
    },
    {
      name: 'members',
      title: 'Members',
      description: 'Band members (if applicable)',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'person' }],
        },
      ],
    },
    {
      name: '_legacyId',
      title: 'Legacy ID',
      type: 'number',
      readOnly: true,
      hidden: true,
    },
    {
      name: '_migratedAt',
      title: 'Migrated At',
      type: 'datetime',
      readOnly: true,
      hidden: true,
    },
  ],
  preview: {
    select: {
      title: 'name',
      media: 'photo',
    },
  },
};
