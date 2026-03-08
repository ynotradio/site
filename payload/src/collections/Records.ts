import type { CollectionConfig } from 'payload';
import { slugField } from 'payload';
import { hasRole, adminOnlyCondition } from '../utils/auth';
import { generateMusicDisplayName } from './hooks/displayNameHooks';

export const Records: CollectionConfig = {
  slug: 'records',
  labels: {
    singular: 'Record',
    plural: 'Records',
  },
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'coverImage', 'artist', 'label', 'releaseDate', 'updatedAt'],
    group: 'Music',
    description: 'Album/record catalog.',
  },
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  hooks: {
    beforeChange: [generateMusicDisplayName('Record')],
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Auto-generated from artist and title',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Album title',
      },
    },
    slugField(),
    {
      name: 'artist',
      type: 'relationship',
      relationTo: 'artists',
      required: true,
      admin: {
        description: 'Artist or band who released the album',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'label',
          type: 'text',
          admin: {
            description: 'Record label',
            width: '60%',
          },
        },
        {
          name: 'releaseDate',
          type: 'date',
          admin: {
            description: 'Release date',
            date: {
              displayFormat: 'yyyy-MM-dd',
            },
            width: '40%',
          },
        },
      ],
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Album cover image',
        components: {
          Cell: '/payload/src/components/cells/ThumbnailCell#ThumbnailCell',
        },
      },
    },
    {
      name: 'musicbrainzId',
      type: 'text',
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'MusicBrainz release ID (MBID) - Search and select from MusicBrainz',
        components: {
          Field: '/payload/src/components/fields/MusicBrainzReleaseField#MusicBrainzReleaseField',
        },
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
        condition: adminOnlyCondition,
      },
    },
    {
      name: 'migratedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Timestamp of migration from MySQL',
        condition: adminOnlyCondition,
      },
    },
  ],
  timestamps: true,
};
