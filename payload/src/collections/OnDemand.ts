import type { CollectionConfig } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { hasRole, adminOnlyCondition } from '../utils/auth';

export const OnDemand: CollectionConfig = {
  slug: 'ondemand',
  labels: {
    singular: 'On Demand Recording',
    plural: 'On Demand Recordings',
  },
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: 'headline',
    defaultColumns: ['headline', 'image', 'date', 'djs', '_status', 'updatedAt'],
    group: 'Radio',
    description:
      'Archived recordings for on-demand listening. Link an audio source and tag the DJs and artists.',
  },
  defaultSort: '-date',
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor', 'dj']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  fields: [
    {
      name: 'date',
      type: 'date',
      required: true,
      index: true,
      admin: {
        description: 'Date of the on-demand recording',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Image/thumbnail for the on-demand content',
        components: {
          Cell: '/payload/src/components/cells/ThumbnailCell#ThumbnailCell',
        },
      },
    },
    {
      name: 'headline',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Title shown in the on-demand listing on the website',
      },
    },
    {
      name: 'description',
      type: 'richText',
      editor: lexicalEditor(),
      admin: {
        description: 'Description or note about the content',
      },
    },
    {
      name: 'djs',
      type: 'relationship',
      relationTo: 'djs',
      hasMany: true,
      admin: {
        description: 'Which DJs were on air? Used for filtering by DJ on the website.',
      },
    },
    {
      name: 'artists',
      type: 'relationship',
      relationTo: 'artists',
      hasMany: true,
      admin: {
        description: 'Featured artists — selecting artists here narrows the song picker below',
      },
    },
    {
      name: 'songs',
      type: 'relationship',
      relationTo: 'songs',
      hasMany: true,
      admin: {
        description:
          'Songs performed in this on-demand recording (filtered to selected artists when artists are chosen above)',
      },
      filterOptions: ({ data }) => {
        const artists = data?.artists;
        if (Array.isArray(artists) && artists.length > 0) {
          const artistIds = artists.map((a: string | { id: string }) => (typeof a === 'object' ? a.id : a));
          return { artist: { in: artistIds } };
        }
        return true;
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'audioUrl',
          type: 'text',
          admin: {
            description:
              'The audio file ID or URL — for OpenDrive, paste the file ID; for others, the full URL',
            placeholder: 'file-id or URL',
            width: '70%',
          },
        },
        {
          name: 'source',
          type: 'select',
          options: [
            { label: 'OpenDrive', value: 'opendrive' },
            { label: 'SoundCloud', value: 'soundcloud' },
            { label: 'Other', value: 'other' },
          ],
          admin: {
            description: 'Where is the audio hosted? Determines how the player loads the file.',
            width: '30%',
          },
        },
      ],
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
