import type { CollectionConfig } from 'payload';
import { hasRole } from '../utils/auth';

export const ModernRockMadnessMatches: CollectionConfig = {
  slug: 'modern-rock-madness-matches',
  labels: {
    singular: 'Match',
    plural: 'Matches',
  },
  admin: {
    useAsTitle: 'matchNumber',
    defaultColumns: ['matchNumber', 'round', 'region', 'band1', 'band2', 'startTime', 'winner'],
    group: 'Modern Rock Madness',
    description: 'Tournament bracket matchups (63 matches per tournament).',
    components: {
      beforeList: ['/payload/src/features/mrm-live/MatchesListHeader#MatchesListHeader'],
      views: {
        edit: {
          controls: {
            Component: '/payload/src/features/mrm-live/MatchControlsTab#MatchControlsTab',
            tab: {
              label: 'Match Controls',
              href: '/controls',
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
      name: 'tournament',
      type: 'relationship',
      relationTo: 'modern-rock-madness-tournaments',
      required: true,
      index: true,
      admin: {
        description: 'Tournament this match belongs to',
      },
    },
    {
      name: 'matchNumber',
      type: 'number',
      required: true,
      index: true,
      admin: {
        description: 'Match number in bracket (1-63)',
      },
    },
    {
      name: 'round',
      type: 'select',
      required: true,
      options: [
        { label: 'Round 1 (64→32)', value: '1' },
        { label: 'Round 2 (32→16)', value: '2' },
        { label: 'Sweet 16 (16→8)', value: '3' },
        { label: 'Elusive 8 (8→4)', value: '4' },
        { label: 'Final 4 (4→2)', value: '5' },
        { label: 'Championship', value: '6' },
      ],
      admin: {
        description: 'Tournament round',
      },
    },
    {
      name: 'region',
      type: 'number',
      admin: {
        description: 'Tournament region (1-4 for early rounds, 5 for Final 4+)',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'band1',
          type: 'relationship',
          relationTo: 'modern-rock-madness-groups',
          admin: {
            description: 'First group (top seed in bracket)',
            width: '50%',
          },
        },
        {
          name: 'band2',
          type: 'relationship',
          relationTo: 'modern-rock-madness-groups',
          admin: {
            description: 'Second group (bottom seed in bracket)',
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'band1Votes',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Group 1 vote count',
            width: '50%',
          },
        },
        {
          name: 'band2Votes',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Group 2 vote count',
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startTime',
          type: 'date',
          required: true,
          admin: {
            description: 'Match voting opens at this time',
            date: {
              pickerAppearance: 'dayAndTime',
            },
            width: '50%',
          },
        },
        {
          name: 'endTime',
          type: 'date',
          required: true,
          admin: {
            description: 'Match voting closes at this time (can be extended for overtime)',
            date: {
              pickerAppearance: 'dayAndTime',
            },
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'winner',
      type: 'relationship',
      relationTo: 'modern-rock-madness-groups',
      admin: {
        description: 'Match winner (set when match is closed)',
      },
    },
    {
      name: 'showScore',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show vote scores publicly',
      },
    },
    {
      name: 'nextMatch',
      type: 'relationship',
      relationTo: 'modern-rock-madness-matches',
      admin: {
        description: 'Next match the winner advances to (replaces mrm_matches_flow table)',
      },
    },
    {
      name: 'sponsor',
      type: 'text',
      admin: {
        description: 'Match sponsor name',
      },
    },
    {
      name: 'sponsorMessage',
      type: 'textarea',
      admin: {
        description: 'Match sponsor message',
      },
    },
  ],
  timestamps: true,
};

/** @deprecated Use ModernRockMadnessMatches */
export const MadnessMatches = ModernRockMadnessMatches;
