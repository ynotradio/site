import path from 'path';
import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';

const mediaDir = path.resolve(process.cwd(), 'payload', 'media');

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Media File',
    plural: 'Media Files',
  },
  access: {
    // Only authenticated users can create/update/delete media
    create: ({ req }) => Boolean(req.user),
    read: () => true, // Public read access for media files
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin', 'editor']),
  },
  upload: {
    staticDir: mediaDir,
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 320,
        height: 240,
        position: 'center',
      },
      {
        name: 'card',
        width: 768,
        height: 576,
        position: 'center',
      },
      {
        name: 'hero',
        width: 1600,
        height: 900,
        position: 'center',
      },
    ],
  },
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'filesize', 'updatedAt'],
    group: 'Content',
  },
  fields: [
    { name: 'alt', type: 'text', required: true },
    { name: 'caption', type: 'text' },
    {
      name: 'cloudinaryPublicId',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Cloudinary public ID for reference',
      },
    },
    {
      name: 'legacyUrl',
      type: 'text',
      admin: { position: 'sidebar' },
    },
    {
      name: 'legacyId',
      type: 'number',
      unique: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'migratedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
};
