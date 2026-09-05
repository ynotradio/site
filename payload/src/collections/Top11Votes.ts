import type { CollectionConfig } from 'payload';
import { APIError } from 'payload';
import { hasRole, adminOnlyNav } from '../utils/auth';

type ContestWithStatus = {
  id: number;
  status?: string;
  nominees?: { song: number | { id: number } }[];
};

function nomineeSongId(nominee: { song: number | { id: number } }): number {
  return typeof nominee.song === 'object' ? nominee.song.id : nominee.song;
}

export const Top11Votes: CollectionConfig = {
  slug: 'top11-votes',
  enableRichTextLink: false,
  enableRichTextRelationship: false,
  enableQueryPresets: true,
  labels: {
    singular: 'Vote',
    plural: 'Votes',
  },
  admin: {
    hidden: adminOnlyNav,
    defaultColumns: ['contest', 'song', 'voterEmail', 'voteSource', 'createdAt'],
    group: 'Top 11',
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
      async ({ operation, data: incomingData, req }) => {
        // voterKey is a Postgres GENERATED ALWAYS column (see migration
        // 20260701_170648_add_top11_vote_dedup_and_lookback) — Postgres computes
        // and writes it, so Payload must never attempt to set it itself.
        const data = incomingData;
        if (data) {
          delete (data as Record<string, unknown>).voterKey;
        }

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

        const songId = Number(data.song);
        const nomineeSongIds = (contest.nominees ?? []).map(nomineeSongId);
        // The DB-level trigger (top11_votes_song_is_nominee, see migration
        // 20260706_210000_add_top11_votes_nominee_constraint) is the real
        // source of truth -- this check just turns a constraint violation
        // into a clean API error.
        if (!nomineeSongIds.includes(songId)) {
          throw new APIError('This song is not on the ballot for this contest', 400);
        }

        const voterAuth0Id = typeof data.voterAuth0Id === 'string' ? data.voterAuth0Id.trim() : '';
        const voterUserId = typeof data.voterUserId === 'string' ? data.voterUserId.trim() : '';
        const voterEmail = typeof data.voterEmail === 'string' ? data.voterEmail.trim() : '';

        const voterIdentifier = voterAuth0Id || voterUserId || voterEmail;
        if (!voterIdentifier) {
          throw new APIError(
            'A voter identifier is required (voterAuth0Id, voterUserId, or voterEmail)',
            400,
          );
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
            and: [{ contest: { equals: contestId } }, { song: { equals: songId } }, identityWhere],
          },
          req,
          overrideAccess: true,
          limit: 1,
          depth: 0,
        });

        if (existingVotes.docs.length > 0) {
          throw new APIError('This voter has already voted for this song', 409);
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
      name: 'voterKey',
      type: 'text',
      admin: {
        readOnly: true,
        description:
          'Auto-generated dedup key (voterAuth0Id || voterUserId || voterEmail). Computed by Postgres, not editable.',
      },
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
        description:
          'Manual CP voting is deprecated; use authenticated web or import sources only.',
      },
    },
  ],
  timestamps: true,
};
