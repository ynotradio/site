import type { CollectionConfig } from 'payload';
import { slugField } from 'payload';
import { hasRole } from '../utils/auth';

export const Records: CollectionConfig = {
  slug: 'records',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['displayName', 'artist', 'label', 'releaseDate', 'updatedAt'],
    group: 'Music',
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
            return data.title || `Record #${data.id || 'New'}`;
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
