import type { CollectionConfig } from 'payload';
import { slugField } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { hasRole } from '../utils/auth';

export const Artists: CollectionConfig = {
  slug: 'artists',
  labels: {
    singular: 'Artist',
    plural: 'Artists',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'photo', 'slug', 'updatedAt'],
    group: 'Music',
    description: 'Artists and bands in the music catalog.',
  },
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
    },
    slugField(),
    {
      name: 'bio',
      type: 'richText',
      editor: lexicalEditor(),
      admin: {
        description: 'Artist biography or description',
      },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Artist photo or band photo',
        components: {
          Cell: '/payload/src/components/cells/ThumbnailCell#ThumbnailCell',
        },
      },
    },
    {
      name: 'website',
      type: 'text',
      admin: {
        description: 'Official website URL',
        placeholder: 'https://',
      },
    },
    {
      name: 'members',
      type: 'relationship',
      relationTo: 'people',
      hasMany: true,
      admin: {
        description: 'Band members (many-to-many relationship)',
      },
    },
    {
      name: 'musicbrainzId',
      type: 'text',
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'MusicBrainz artist ID (MBID) - Search and select from MusicBrainz',
        components: {
          Field: '/payload/src/components/fields/MusicBrainzArtistField#MusicBrainzArtistField',
        },
      },
    },

  ],
  timestamps: true,
};
