import type { CollectionConfig } from 'payload';
import { slugField } from 'payload';
import { hasRole } from '../utils/auth';

export const Songs: CollectionConfig = {
  slug: 'songs',
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'artist', 'releaseDate', 'updatedAt'],
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
            // Error fetching artist name for Song
            if (process.env.NODE_ENV !== 'production') {
              // eslint-disable-next-line no-console
              console.error('Error fetching artist name for Song:', error);
            }
          }
        }

        if (artistName && updatedData.title) {
          updatedData.displayName = `${artistName} - ${updatedData.title}`;
        } else if (updatedData.title) {
          updatedData.displayName = updatedData.title;
        } else {
          updatedData.displayName = `Song #${updatedData.id || 'New'}`;
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
        description: 'Song title',
      },
    },
    slugField(),
    {
      name: 'artist',
      type: 'relationship',
      relationTo: 'artists',
      admin: {
        description: 'Artist or band who performed the song',
      },
    },
    {
      name: 'streamUrl',
      type: 'text',
      admin: {
        description: 'URL for streaming the song',
      },
    },
    {
      name: 'releaseDate',
      type: 'date',
      admin: {
        description: 'Date the song was released',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'featureOnNewMusic',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Should this song be featured on the New Music page?',
      },
    },
    {
      name: 'musicbrainzId',
      type: 'text',
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'MusicBrainz recording ID (MBID) - Search and select from MusicBrainz',
        components: {
          Field: '/payload/src/components/fields/MusicBrainzRecordingField#MusicBrainzRecordingField',
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
