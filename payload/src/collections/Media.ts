import path from 'path';
import type { CollectionConfig } from 'payload/types';

const mediaDir = path.resolve(process.cwd(), 'payload', 'media');

export const Media: CollectionConfig = {
  slug: 'media',
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
    defaultColumns: ['filename', 'filesize', 'updatedAt'],
  },
  fields: [
    { name: 'alt', type: 'text', required: true },
    { name: 'caption', type: 'text' },
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
