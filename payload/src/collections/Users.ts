import type { CollectionConfig } from 'payload';

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
  labels: {
    singular: 'User',
    plural: 'Users',
  },
  admin: {
    defaultColumns: ['email', 'role', 'lastLoggedIn', 'updatedAt'],
    useAsTitle: 'email',
    group: 'People',
    description: 'User accounts and access management.',
    hidden: ({ user }) => !hasRole(user, 'admin'),
  },
  auth: {
    tokenExpiration: 60 * 60 * 4, // 4 hours
    verify: true,
    depth: 0, // Ensure all user fields are loaded
  },
  access: {
    read: ({ req, id }) => {
      if (!req.user) {
        return false;
      }

      // Allow admins to read all users
      if (hasRole(req.user, 'admin')) {
        return true;
      }

      // Allow a user to read their own profile
      const currentUser = req.user as { id?: string | number };
      if (id && currentUser.id && String(currentUser.id) === String(id)) {
        return true;
      }

      return false;
    },
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
      saveToJWT: true,
      options: [
        { label: 'Administrator', value: 'admin' },
        { label: 'Editor', value: 'editor' },
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
