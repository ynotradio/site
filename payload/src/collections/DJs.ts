import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';

export const DJs: CollectionConfig = {
  slug: 'djs',
  admin: {
    useAsTitle: 'showName',
    defaultColumns: ['showName', 'person', 'onAir', 'updatedAt'],
    group: 'Radio',
  },
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor', 'dj']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  fields: [
    {
      name: 'person',
      type: 'relationship',
      relationTo: 'people',
      admin: {
        description: 'Link to the person record',
      },
    },
    {
      name: 'showName',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Name of the radio show',
      },
    },
    {
      name: 'email',
      type: 'email',
      admin: {
        description: 'Contact email address',
      },
    },
    {
      name: 'externalConnectText',
      type: 'text',
      admin: {
        description: 'Text for external link (e.g., "Follow on Twitter")',
      },
    },
    {
      name: 'externalConnectUrl',
      type: 'text',
      admin: {
        description: 'URL for external link',
      },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'DJ photo',
      },
    },
    {
      name: 'onAir',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Is this DJ currently on air?',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      admin: {
        description: 'Display order (lower numbers appear first)',
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
