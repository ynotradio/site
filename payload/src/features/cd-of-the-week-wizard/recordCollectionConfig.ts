import type { Field } from 'payload';

export const recordInlineFields: Field[] = [
  {
    name: 'title',
    type: 'text',
    required: true,
    index: true,
    admin: {
      description: 'Album title',
    },
  },
  {
    name: 'artist',
    type: 'relationship',
    relationTo: 'artists',
    required: true,
    admin: {
      description: 'Select the artist — create them in the Artists collection first if needed',
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
          components: {
            Field: '/payload/src/components/fields/InlineDateField#InlineDateField',
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
      description:
        'Links to MusicBrainz for accurate metadata — use the search button to find the correct release',
      components: {
        Field: '/payload/src/components/fields/MusicBrainzReleaseField#MusicBrainzReleaseField',
        Cell: '/payload/src/components/cells/MusicBrainzCell#MusicBrainzReleaseCell',
      },
    },
  },
];

export const recordInlineCollectionConfig = {
  fields: recordInlineFields,
  labels: {
    singular: 'Record',
    plural: 'Records',
  },
};
