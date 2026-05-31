import type { CollectionConfig } from 'payload';
import { slugField } from 'payload';
import { hasRole, adminOnlyCondition } from '../utils/auth';
import { generateMusicDisplayName } from './hooks/displayNameHooks';
import { normalizeDateToNoon } from './hooks/showDateHooks';
import { musicSlugify, generateMusicSlugBeforeChangeHook } from './hooks/slugUtils';
import { legacyIdField } from './shared/legacyIdField';

export const Songs: CollectionConfig = {
  slug: 'songs',
  enableQueryPresets: true,
  enableRichTextLink: false,
  enableRichTextRelationship: false,
  labels: {
    singular: 'Song',
    plural: 'Songs',
  },
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: [
      'displayName',
      'artist',
      'musicbrainzId',
      'releaseDate',
      'featureOnNewMusic',
      'updatedAt',
    ],
    group: 'Music',
    description:
      'Song catalog. Toggle "Feature on New Music" in the sidebar to control the New Music page.',
    groupBy: true,
  },
  defaultSort: '-releaseDate',
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin', 'editor']),
  },
  hooks: {
    beforeChange: [
      normalizeDateToNoon,
      generateMusicSlugBeforeChangeHook,
      generateMusicDisplayName('Song'),
    ],
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Auto-generated from artist and title',
        condition: adminOnlyCondition,
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
    slugField({ slugify: musicSlugify }),
    {
      name: 'artist',
      type: 'relationship',
      relationTo: 'artists',
      admin: {
        description: 'Select the artist — create them in the Artists collection first if needed',
      },
    },
    {
      name: 'streamUrl',
      type: 'text',
      admin: {
        description:
          'Paste a streaming URL (e.g., Spotify, YouTube) for the listen button on the site',
        placeholder: 'https://',
      },
    },
    {
      name: 'releaseDate',
      type: 'date',
      admin: {
        description: 'Date the song was released',
        date: {
          displayFormat: 'yyyy-MM-dd',
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'featureOnNewMusic',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'When checked, this song appears on the New Music page on the website',
      },
    },
    {
      name: 'musicbrainzId',
      type: 'text',
      unique: true,
      admin: {
        position: 'sidebar',
        description:
          'Links to MusicBrainz for accurate metadata — use the search button to find the correct recording',
        components: {
          Field:
            '/payload/src/components/fields/MusicBrainzRecordingField#MusicBrainzRecordingField',
          Cell: '/payload/src/components/cells/MusicBrainzCell#MusicBrainzRecordingCell',
        },
      },
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
