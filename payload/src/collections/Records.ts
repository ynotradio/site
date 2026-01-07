import type { CollectionConfig } from 'payload';
import { slugField } from 'payload';
import { hasRole } from '../utils/auth';

export const Records: CollectionConfig = {
  slug: 'records',
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'artist', 'label', 'releaseDate', 'updatedAt'],
    group: 'Music',
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        // Generate display name from artist relationship and title
        const updatedData = data;

        let artistName = '';
        if (updatedData.artist) {
          const artistId = typeof updatedData.artist === 'object' ? updatedData.artist.id : updatedData.artist;

          try {
            const artist = await req.payload.findByID({
              collection: 'artists',
              id: artistId,
            });

            if (artist) {
              artistName = artist.name;
            }
          } catch (error) {
            // Error fetching artist name for Record
            if (process.env.NODE_ENV !== 'production') {
              // eslint-disable-next-line no-console
              console.error('Error fetching artist name for Record:', error);
            }
          }
        }

        if (artistName && updatedData.title) {
          updatedData.displayName = `${artistName} - ${updatedData.title}`;
        } else if (updatedData.title) {
          updatedData.displayName = updatedData.title;
        } else {
          updatedData.displayName = `Record #${updatedData.id || 'New'}`;
        }

        return updatedData;
      },
    ],
  },
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      admin: {
        position: 'sidebar',
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
      name: 'label',
      type: 'text',
      admin: {
        description: 'Record label',
      },
    },
    {
      name: 'releaseDate',
      type: 'date',
      admin: {
        description: 'Date the album was released',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Album cover image',
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
