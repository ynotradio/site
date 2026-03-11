import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';

export const ModernRockMadnessTournaments: CollectionConfig = {
  slug: 'modern-rock-madness-tournaments',
  labels: {
    singular: 'Tournament',
    plural: 'Tournaments',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'year', 'status', 'startDate', 'updatedAt'],
    group: 'Modern Rock Madness',
    description: 'Annual Modern Rock Madness tournament configuration.',
    components: {
      beforeList: ['/payload/src/features/mrm-bracket/TournamentsListHeader#TournamentsListHeader'],
      views: {
        edit: {
          bracket: {
            Component:
              '/payload/src/features/mrm-bracket/TournamentBracketTab#TournamentBracketTab',
            path: '/bracket',
            tab: {
              label: 'Bracket',
              href: '/bracket',
            },
          },
        },
      },
    },
  },
  access: {
    read: () => true,
    create: ({ req }) => hasRole(req.user, ['admin']),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Tournament name (e.g., "Modern Rock Madness 2025")',
      },
    },
    {
      name: 'year',
      type: 'number',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Tournament year',
      },
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
      admin: {
        description: 'Tournament start date',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Complete', value: 'complete' },
      ],
      index: true,
      admin: {
        description: 'Tournament status. Only one tournament should be "active" at a time.',
      },
    },
    {
      name: 'bracketPdfUrl',
      type: 'text',
      admin: {
        description: 'URL to the printable bracket PDF',
      },
    },
    {
      name: 'bannerImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Tournament banner image',
      },
    },
  ],
  timestamps: true,
};

/** @deprecated Use ModernRockMadnessTournaments */
export const MadnessTournaments = ModernRockMadnessTournaments;
