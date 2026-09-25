import type { CollectionConfig } from 'payload';
import { hasRole, adminOnlyCondition } from '../utils/auth';
import { generateMusicDisplayName } from './hooks/displayNameHooks';
import { normalizeFieldToNoon, validateReleaseDateWhenFeatured } from './hooks/showDateHooks';
import {
  musicSlugify,
  generateMusicSlugBeforeChangeHook,
  dedupeMusicSlug,
} from './hooks/slugUtils';
import { legacyIdField } from './shared/legacyIdField';
import { slugField } from './shared/slugField';

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
    // Let the list-view search box match the artist + title (displayName holds
    // "Artist - Title") and the raw title, so editors find songs by either.
    listSearchableFields: ['displayName', 'title'],
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
    // De-duplicate the slug before validation so a collision never blocks a save.
    beforeValidate: [dedupeMusicSlug('songs')],
    beforeChange: [
      normalizeFieldToNoon('releaseDate'),
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
      required: true,
      admin: {
        allowCreate: true,
        allowEdit: true,
        description:
          'Start typing the artist\'s name. If they aren\'t listed yet, choose "Add new" to create them right here — no need to leave this form.',
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
      // New music is usually current, so default to today; the editor can change
      // it for back-catalog. This also pre-satisfies the "featured songs need a
      // release date" rule so featuring a new song never stops on a blank date.
      defaultValue: () => new Date(),
      validate: validateReleaseDateWhenFeatured,
      admin: {
        description:
          'Date the song was released (defaults to today — change it for older releases)',
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
      hooks: {
        beforeDuplicate: [() => null],
      },
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
