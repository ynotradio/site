import type { CollectionConfig } from 'payload';
import { slugField } from 'payload';
import { hasRole, adminOnlyCondition } from '../utils/auth';

export const Songs: CollectionConfig = {
  slug: 'songs',
  labels: {
    singular: 'Song',
    plural: 'Songs',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['displayName', 'artist', 'releaseDate', 'featureOnNewMusic', 'updatedAt'],
    group: 'Music',
    description:
      'Songs in the system. Filter by "featureOnNewMusic" to see songs on the New Music page.',
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
      virtual: true,
      admin: {
        hidden: true,
      },
      hooks: {
        afterRead: [
          async ({ data, req }) => {
            if (!data) return 'Untitled';

            let artistName = '';
            if (data.artist) {
              // Artist may be populated or just an ID
              if (typeof data.artist === 'object' && data.artist.name) {
                artistName = data.artist.name;
              } else if (data.artist) {
                try {
                  const artist = await req.payload.findByID({
                    collection: 'artists',
                    id: typeof data.artist === 'object' ? data.artist.id : data.artist,
                  });
                  if (artist) {
                    artistName = artist.name;
                  }
                } catch {
                  // Silently handle errors
                }
              }
            }

            if (artistName && data.title) {
              return `${artistName} - ${data.title}`;
            }
            return data.title || `Song #${data.id || 'New'}`;
          },
        ],
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
          Field:
            '/payload/src/components/fields/MusicBrainzRecordingField#MusicBrainzRecordingField',
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
