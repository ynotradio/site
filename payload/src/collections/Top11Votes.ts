import type { CollectionConfig } from 'payload';
import { APIError } from 'payload';
import { hasRole } from '../utils/auth';

type ContestWithStatus = {
  id: number;
  status?: string;
};

export const Top11Votes: CollectionConfig = {
  slug: 'top11-votes',
  enableRichTextLink: false,
  enableRichTextRelationship: false,
  enableQueryPresets: true,
  labels: {
    singular: 'Top 11 Vote',
    plural: 'Top 11 Votes',
  },
  admin: {
    defaultColumns: ['contest', 'song', 'voterEmail', 'voteSource', 'createdAt'],
    group: 'Polls & Contests',
    description: 'Top 11 votes tied to a specific weekly contest.',
    groupBy: true,
  },
  access: {
    read: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    create: () => true,
    update: ({ req }) => hasRole(req.user, ['admin']),
    delete: ({ req }) => hasRole(req.user, ['admin', 'editor']),
  },
  hooks: {
    beforeChange: [
      async ({ operation, data, req }) => {
        if (operation !== 'create' || !data) {
          return data;
        }

        const contestId = Number(data.contest);
        if (!Number.isInteger(contestId) || contestId <= 0) {
          throw new APIError('Votes must reference a valid Top 11 contest', 400);
        }

        const contest = (await req.payload.findByID({
          collection: 'top11-contests',
          id: contestId,
          depth: 0,
          req,
          overrideAccess: true,
        })) as ContestWithStatus;

        if (contest.status !== 'open') {
          throw new APIError('Top 11 voting is not currently open for this contest', 400);
        }

        const voterAuth0Id = typeof data.voterAuth0Id === 'string' ? data.voterAuth0Id.trim() : '';
        const voterUserId = typeof data.voterUserId === 'string' ? data.voterUserId.trim() : '';
        const voterEmail = typeof data.voterEmail === 'string' ? data.voterEmail.trim() : '';

        const voterIdentifier = voterAuth0Id || voterUserId || voterEmail;
        if (!voterIdentifier) {
          throw new APIError('A voter identifier is required (voterAuth0Id, voterUserId, or voterEmail)', 400);
        }

        let identityWhere: Record<string, unknown>;
        if (voterAuth0Id) {
          identityWhere = { voterAuth0Id: { equals: voterAuth0Id } };
        } else if (voterUserId) {
          identityWhere = { voterUserId: { equals: voterUserId } };
        } else {
          identityWhere = { voterEmail: { equals: voterEmail } };
        }

        const existingVotes = await req.payload.find({
          collection: 'top11-votes',
          where: {
            and: [{ contest: { equals: contestId } }, identityWhere],
          },
          req,
          overrideAccess: true,
          limit: 1,
          depth: 0,
        });

        if (existingVotes.docs.length > 0) {
          throw new APIError('This voter has already voted in the current Top 11 contest', 409);
        }

        return data;
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'contest',
          type: 'relationship',
          relationTo: 'top11-contests',
          required: true,
          index: true,
          admin: {
            width: '50%',
          },
        },
        {
          name: 'song',
          type: 'relationship',
          relationTo: 'songs',
          required: true,
          index: true,
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'voterEmail',
          type: 'email',
          index: true,
          admin: {
            width: '33%',
          },
        },
        {
          name: 'voterUserId',
          type: 'text',
          index: true,
          admin: {
            width: '33%',
            description: 'App-level user identifier if available.',
          },
        },
        {
          name: 'voterAuth0Id',
          type: 'text',
          index: true,
          admin: {
            width: '34%',
            description: 'Auth0 user id for duplicate prevention.',
          },
        },
      ],
    },
    {
      name: 'voteSource',
      type: 'select',
      required: true,
      defaultValue: 'web',
      options: [
        { label: 'Web Vote', value: 'web' },
        { label: 'Legacy Import', value: 'legacy-import' },
        { label: 'Admin Import', value: 'admin-import' },
      ],
      admin: {
        description: 'Manual CP voting is deprecated; use authenticated web or import sources only.',
      },
    },
  ],
  timestamps: true,
};
