import type { CollectionConfig } from 'payload';
import { hasRole, adminOnlyNav } from '../utils/auth';

export const Top11WinnerDraws: CollectionConfig = {
  slug: 'top11-winner-draws',
  enableRichTextLink: false,
  enableRichTextRelationship: false,
  enableQueryPresets: true,
  labels: {
    singular: 'Winner Draw',
    plural: 'Winner Draws',
  },
  admin: {
    hidden: adminOnlyNav,
    defaultColumns: ['contest', 'contestantEmail', 'contestantPhone', 'drawnBy', 'createdAt'],
    group: 'Top 11',
    description: 'Auditable winner selection log for Top 11 contests.',
    groupBy: true,
  },
  access: {
    read: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    create: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    update: ({ req }) => hasRole(req.user, ['admin']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  fields: [
    {
      name: 'contest',
      type: 'relationship',
      relationTo: 'top11-contests',
      required: true,
      index: true,
    },
    {
      name: 'contestant',
      type: 'relationship',
      relationTo: 'top11-contestants',
      required: true,
      index: true,
    },
    {
      name: 'contestantEmail',
      type: 'email',
      required: true,
      index: true,
    },
    {
      name: 'contestantPhone',
      type: 'text',
    },
    {
      name: 'drawnBy',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: {
        description: 'Editor/admin account that initiated the draw.',
      },
    },
    {
      // Historical only: draws no longer exclude prior winners (#899), so
      // new draws leave this unset. Kept so past draws' records survive.
      name: 'excludePriorWinners',
      type: 'checkbox',
      admin: {
        readOnly: true,
        description: 'Legacy: whether this past draw excluded recent prior winners.',
      },
    },
  ],
  timestamps: true,
};
