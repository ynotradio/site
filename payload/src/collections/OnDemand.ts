import type { CollectionConfig } from 'payload';

// Helper function to check if user has specific role(s)
const hasRole = (user: any, roles: string | string[]): boolean => {
  if (!user || !user.role) return false;
  const userRoles = Array.isArray(user.role) ? user.role : [user.role];
  const checkRoles = Array.isArray(roles) ? roles : [roles];
  return userRoles.some((role: string) => checkRoles.includes(role));
};

export const OnDemand: CollectionConfig = {
  slug: 'ondemand',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'artist', 'updatedAt'],
  },
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor', 'dj']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Title of the on-demand content',
      },
    },
    {
      name: 'artist',
      type: 'relationship',
      relationTo: 'artists',
      admin: {
        description: 'Featured artist or band',
      },
    },
    {
      name: 'streamUrl',
      type: 'text',
      required: true,
      admin: {
        description: 'URL for streaming the content',
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
