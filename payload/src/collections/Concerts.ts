import type { CollectionConfig } from 'payload';

// Helper function to check if user has specific role(s)
const hasRole = (user: any, roles: string | string[]): boolean => {
  if (!user || !user.role) return false;
  const userRoles = Array.isArray(user.role) ? user.role : [user.role];
  const checkRoles = Array.isArray(roles) ? roles : [roles];
  return userRoles.some((role: string) => checkRoles.includes(role));
};

export const Concerts: CollectionConfig = {
  slug: 'concerts',
  admin: {
    useAsTitle: 'date',
    defaultColumns: ['date', 'artist', 'venue', 'featured', 'updatedAt'],
  },
  access: {
    read: () => true, // Public read access
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  fields: [
    {
      name: 'date',
      type: 'date',
      required: true,
      index: true,
      admin: {
        description: 'Concert date',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'artist',
      type: 'relationship',
      relationTo: 'artists',
      required: true,
      admin: {
        description: 'Performing artist or band',
      },
    },
    {
      name: 'venue',
      type: 'relationship',
      relationTo: 'venues',
      required: true,
      admin: {
        description: 'Concert venue',
      },
    },
    {
      name: 'ticketInfo',
      type: 'textarea',
      admin: {
        description: 'Ticket pricing and availability information',
      },
    },
    {
      name: 'ticketUrl',
      type: 'text',
      admin: {
        description: 'URL to purchase tickets',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Should this concert be featured on the homepage?',
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
