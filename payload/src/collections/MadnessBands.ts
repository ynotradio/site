import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';

export const ModernRockMadnessGroups: CollectionConfig = {
  slug: 'modern-rock-madness-groups',
  enableRichTextLink: false,
  enableRichTextRelationship: false,
  enableQueryPresets: true,
  labels: {
    singular: 'Group',
    plural: 'Groups',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'artists', 'seed', 'placement', 'tournament'],
    group: 'Modern Rock Madness',
    description:
      'Tournament participants. Each group can represent one or more artists (e.g., a supergroup).',
    groupBy: true,
  },
  access: {
    read: () => true,
    create: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  fields: [
    {
      name: 'tournament',
      type: 'relationship',
      relationTo: 'modern-rock-madness-tournaments',
      required: true,
      index: true,
      admin: {
        description: 'Tournament this group belongs to',
      },
    },
    {
      name: 'artists',
      type: 'relationship',
      relationTo: 'artists',
      hasMany: true,
      admin: {
        description:
          'Artist(s) competing as this group (e.g., Jack White + White Stripes → one group). Name and image below override artist record values when set.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'name',
          type: 'text',
          admin: {
            description:
              'Optional display name override. Useful for supergroups (e.g., "Jack White / White Stripes"). If blank, the name from the primary artist record is used.',
            width: '60%',
          },
        },
        {
          name: 'abbreviation',
          type: 'text',
          maxLength: 7,
          admin: {
            description: 'Short abbreviation for bracket display (max 7 chars)',
            width: '40%',
          },
        },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Optional image override. If blank, the primary artist photo is used.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'seed',
          type: 'number',
          required: true,
          admin: {
            description: 'Tournament seed (1-16 per region)',
            width: '50%',
          },
        },
        {
          name: 'placement',
          type: 'number',
          required: true,
          index: true,
          admin: {
            description: 'Overall bracket placement (1-64)',
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'url',
          type: 'text',
          admin: {
            description: 'Group or primary artist website URL',
            width: '60%',
          },
        },
        {
          name: 'sponsor',
          type: 'text',
          admin: {
            description: 'Group sponsor name',
            width: '40%',
          },
        },
      ],
    },
  ],
  timestamps: true,
};

/** @deprecated Use ModernRockMadnessGroups */
export const MadnessBands = ModernRockMadnessGroups;
