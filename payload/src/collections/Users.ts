import type { CollectionConfig } from 'payload/types';

type AppUserRole = 'admin' | 'editor' | 'dj' | 'readonly';

const hasRole = (user: unknown, role: AppUserRole): boolean => {
  if (typeof user !== 'object' || user === null) {
    return false;
  }

  if (!('role' in user)) {
    return false;
  }

  const { role: userRole } = user as { role?: string };
  return userRole === role;
};

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    defaultColumns: ['email', 'role', 'lastLoggedIn', 'updatedAt'],
    useAsTitle: 'email',
  },
  auth: {
    tokenExpiration: 60 * 60 * 4, // 4 hours
    verify: true,
  },
  access: {
    read: () => false,
    create: ({ req }) => hasRole(req.user, 'admin'),
    update: ({ req }) => !!req.user,
    delete: ({ req }) => hasRole(req.user, 'admin'),
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Administrator', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'DJ', value: 'dj' },
        { label: 'Read Only', value: 'readonly' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'lastLoggedIn',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
};
