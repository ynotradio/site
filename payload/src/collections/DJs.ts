import type { CollectionConfig } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { hasRole } from '../utils/auth';

export const DJs: CollectionConfig = {
  slug: 'djs',
  labels: {
    singular: 'DJ',
    plural: 'DJs',
  },
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'photo', 'onAir', 'sortOrder', 'updatedAt'],
    group: 'Radio',
    description: 'DJ profiles. Filter by "onAir" to see active DJs.',

    components: {
      beforeList: ['/payload/src/features/dj-order/DJsListHeader#DJsListHeader'],
    },
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        // Generate display name from person relationship
        // eslint-disable-next-line no-param-reassign
        const updatedData = data;

        if (
          updatedData.person &&
          Array.isArray(updatedData.person) &&
          updatedData.person.length > 0
        ) {
          const personIds = updatedData.person.map((p: any) => (typeof p === 'object' ? p.id : p));

          try {
            const people = await req.payload.find({
              collection: 'people',
              where: {
                id: {
                  in: personIds,
                },
              },
              limit: personIds.length,
            });

            if (people.docs.length > 0) {
              updatedData.displayName = people.docs.map((p: any) => p.name).join(', ');
            }
          } catch (error) {
            // Error fetching person names for DJ
            if (process.env.NODE_ENV !== 'production') {
              // eslint-disable-next-line no-console
              console.error('Error fetching person names for DJ:', error);
            }
          }
        }

        if (!updatedData.displayName) {
          updatedData.displayName = `DJ #${updatedData.id || 'New'}`;
        }

        return updatedData;
      },
    ],
  },
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor', 'dj']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Auto-generated from person names',
      },
    },
    {
      name: 'person',
      type: 'relationship',
      relationTo: 'people',
      hasMany: true,
      admin: {
        description: 'Link to the person record(s) - can be multiple for co-hosted shows',
      },
    },
    {
      name: 'description',
      type: 'richText',
      editor: lexicalEditor(),
      admin: {
        description:
          'Description of the show(s) hosted by this DJ - supports line breaks for multiple shows',
      },
    },
    {
      name: 'email',
      type: 'email',
      admin: {
        description: 'Contact email address',
      },
    },
    {
      name: 'externalConnectText',
      type: 'text',
      admin: {
        description: 'Text for external link (e.g., "Follow on Twitter")',
      },
    },
    {
      name: 'externalConnectUrl',
      type: 'text',
      admin: {
        description: 'URL for external link',
      },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'DJ photo',
        components: {
          Cell: '/payload/src/components/cells/ThumbnailCell#ThumbnailCell',
        },
      },
    },
    {
      name: 'onAir',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Is this DJ currently on air?',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      admin: {
        description: 'Display order (lower numbers appear first)',
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
