import type { CollectionConfig, FieldHook } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { hasRole, adminOnlyCondition } from '../utils/auth';
import { legacyIdField } from './shared/legacyIdField';

const syncArtistsText: FieldHook = async ({ siblingData, req }) => {
  const raw = (siblingData as { artists?: unknown[] }).artists ?? [];
  if (!raw.length) return '';
  const ids = raw.map((a) => {
    if (typeof a === 'object' && a !== null && 'id' in a) return (a as { id: unknown }).id;
    return a;
  });
  try {
    const { docs } = await req.payload.find({
      collection: 'artists',
      where: { id: { in: ids } },
      limit: ids.length,
      depth: 0,
    });
    return docs.map((a: { name?: unknown }) => String(a.name ?? '')).join(', ');
  } catch {
    return '';
  }
};

const syncSongsText: FieldHook = async ({ siblingData, req }) => {
  const raw = (siblingData as { songs?: unknown[] }).songs ?? [];
  if (!raw.length) return '';
  const ids = raw.map((s) => {
    if (typeof s === 'object' && s !== null && 'id' in s) return (s as { id: unknown }).id;
    return s;
  });
  try {
    const { docs } = await req.payload.find({
      collection: 'songs',
      where: { id: { in: ids } },
      limit: ids.length,
      depth: 0,
    });
    return docs
      .map((s: { displayName?: unknown; title?: unknown }) => String(s.displayName ?? s.title ?? ''))
      .join(', ');
  } catch {
    return '';
  }
};

export const OnDemand: CollectionConfig = {
  slug: 'ondemand',
  enableQueryPresets: true,
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
    listSearchableFields: ['headline', 'artistsText', 'songsText'],
    group: 'Radio',
    description:
      'Archived recordings for on-demand listening. Link an audio source and tag the DJs and artists.',
    groupBy: true,
  },
  defaultSort: '-date',
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor', 'dj']),
    delete: ({ req }) => hasRole(req.user, ['admin', 'editor']),
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
      name: 'artistsText',
      type: 'text',
      admin: {
        hidden: true,
        readOnly: true,
      },
      hooks: {
        beforeChange: [syncArtistsText],
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
      name: 'songsText',
      type: 'text',
      admin: {
        hidden: true,
        readOnly: true,
      },
      hooks: {
        beforeChange: [syncSongsText],
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
    legacyIdField,
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
