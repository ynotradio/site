import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';

export const MadnessBands: CollectionConfig = {
  slug: 'madness-bands',
  labels: {
    singular: 'Band',
    plural: 'Bands',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'seed', 'placement', 'tournament', 'sponsor'],
    group: 'Modern Rock Madness',
    description: 'Tournament participants (64 bands per tournament).',
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
      relationTo: 'madness-tournaments',
      required: true,
      index: true,
      admin: {
        description: 'Tournament this band belongs to',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Band name',
      },
    },
    {
      name: 'abbreviation',
      type: 'text',
      maxLength: 7,
      admin: {
        description: 'Short abbreviation for bracket display (max 7 chars)',
      },
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        description: 'Band website URL',
      },
    },
    {
      name: 'imageUrl',
      type: 'text',
      admin: {
        description: 'Band image URL',
      },
    },
    {
      name: 'seed',
      type: 'number',
      required: true,
      admin: {
        description: 'Tournament seed (1-16 per region)',
      },
    },
    {
      name: 'placement',
      type: 'number',
      required: true,
      index: true,
      admin: {
        description: 'Overall bracket placement (1-64)',
      },
    },
    {
      name: 'sponsor',
      type: 'text',
      admin: {
        description: 'Band sponsor name',
      },
    },
    {
      name: 'legacyId',
      type: 'number',
      unique: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Original MySQL ID for migration tracking',
      },
    },
    {
      name: 'migratedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Timestamp of migration from MySQL',
      },
    },
  ],
  timestamps: true,
};
