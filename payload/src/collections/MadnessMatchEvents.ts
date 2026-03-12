import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';

export const ModernRockMadnessMatchEvents: CollectionConfig = {
  slug: 'modern-rock-madness-match-events',
  labels: {
    singular: 'Match Event',
    plural: 'Match Events',
  },
  admin: {
    defaultColumns: ['match', 'eventType', 'createdAt'],
    group: 'Modern Rock Madness',
    description: 'Audit log for match admin actions (overtime, rematch, admin vote, close).',
  },
  access: {
    read: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    create: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    // Events are append-only — no editing or deleting
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'match',
          type: 'relationship',
          relationTo: 'modern-rock-madness-matches',
          required: true,
          index: true,
          admin: {
            description: 'Match this event relates to',
            width: '50%',
          },
        },
        {
          name: 'eventType',
          type: 'select',
          required: true,
          index: true,
          options: [
            { label: 'Overtime Extended', value: 'overtime_extended' },
            { label: 'Rematch', value: 'rematch' },
            { label: 'Admin Vote', value: 'admin_vote' },
            { label: 'Match Closed', value: 'match_closed' },
          ],
          admin: {
            description: 'Type of admin action performed',
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'snapshot',
      type: 'json',
      admin: {
        description:
          'State snapshot at the time of the event. Contents vary by event type (e.g., previous vote counts for rematch, previous end time for overtime).',
      },
    },
  ],
  timestamps: true,
};

/** @deprecated Use ModernRockMadnessMatchEvents */
export const MadnessMatchEvents = ModernRockMadnessMatchEvents;
