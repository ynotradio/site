import type { CollectionConfig } from 'payload';

// Helper function to check if user has specific role(s)
const hasRole = (user: any, roles: string | string[]): boolean => {
  if (!user || !user.role) return false;
  const userRoles = Array.isArray(user.role) ? user.role : [user.role];
  const checkRoles = Array.isArray(roles) ? roles : [roles];
  return userRoles.some((role: string) => checkRoles.includes(role));
};

export const CdOfTheWeek: CollectionConfig = {
  slug: 'cdoftheweek',
  admin: {
    useAsTitle: 'date',
    defaultColumns: ['date', 'record', 'reviewer', 'updatedAt'],
  },
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  fields: [
    {
      name: 'record',
      type: 'relationship',
      relationTo: 'records',
      required: true,
      admin: {
        description: 'Album being reviewed',
      },
    },
    {
      name: 'review',
      type: 'richText',
      required: true,
      admin: {
        description: 'Album review content',
      },
    },
    {
      name: 'reviewer',
      type: 'text',
      admin: {
        description: 'Name of the reviewer',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      index: true,
      admin: {
        description: 'Date of the review',
        date: {
          displayFormat: 'yyyy-MM-dd',
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
