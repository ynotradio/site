import type { CollectionConfig } from 'payload';
import { APIError, slugField } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import {
  assertPublishedContestImmutability,
  findAllDocs,
  getTop11ContestStatusFromData,
  parseTop11Id,
  requireTop11Manager,
  validateTop11StatusTransition,
} from '../features/top11/utils';
import { hasRole } from '../utils/auth';

type ContestEntry = {
  displayOrder: number;
  song: number;
  weeklyNote?: unknown;
};

type ContestDoc = {
  id: number;
  title: string;
  status: string;
  settings?: {
    excludePriorWinners?: boolean;
  };
  entries?: ContestEntry[];
  messageSnapshot?: unknown;
};

type VoteDoc = {
  id: number;
  song: number;
  voterUserId?: string | null;
  voterAuth0Id?: string | null;
  voterEmail?: string | null;
};

type ContestantDoc = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  enteredContest: boolean;
  newsletterOptIn: boolean;
};

type WriteInDoc = {
  id: number;
  writeIn: string;
};

type WinnerDrawDoc = {
  contestantEmail?: string | null;
};

const setContestStatus = async (req: Parameters<NonNullable<CollectionConfig['endpoints']>[number]['handler']>[0], status: string): Promise<Response> => {
  requireTop11Manager(req);
  const contestId = parseTop11Id(req.routeParams?.id, 'contest id');

  const updatedContest = await req.payload.update({
    collection: 'top11-contests',
    id: contestId,
    data: { status },
    req,
    user: req.user,
    overrideAccess: false,
  });

  return Response.json(updatedContest);
};

const validateContestEntries = (value: unknown): true | string => {
  if (!Array.isArray(value)) {
    return 'Entries must be an array';
  }

  if (value.length < 1 || value.length > 11) {
    return 'Top 11 contests must have between 1 and 11 entries';
  }

  const orders = new Set<number>();
  const songs = new Set<number>();

  for (const row of value) {
    if (!row || typeof row !== 'object') {
      return 'Each entry must be an object';
    }

    const typedRow = row as { displayOrder?: unknown; song?: unknown };
    if (typeof typedRow.displayOrder !== 'number') {
      return 'Each entry requires a numeric display order';
    }

    if (orders.has(typedRow.displayOrder)) {
      return 'Display order must be unique per contest';
    }
    orders.add(typedRow.displayOrder);

    const songId = Number(typedRow.song);
    if (!Number.isInteger(songId) || songId <= 0) {
      return 'Each entry must reference a valid song';
    }

    if (songs.has(songId)) {
      return 'A song can only appear once in a Top 11 contest';
    }
    songs.add(songId);
  }

  return true;
};

export const Top11Contests: CollectionConfig = {
  slug: 'top11-contests',
  enableRichTextLink: false,
  enableRichTextRelationship: false,
  enableQueryPresets: true,
  labels: {
    singular: 'Top 11 Contest',
    plural: 'Top 11 Contests',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'weekOf', 'status', 'votingOpensAt', 'votingClosesAt', 'updatedAt'],
    group: 'Polls & Contests',
    description: 'Immutable weekly Top 11 contests and published results snapshots.',
    groupBy: true,
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin']),
  },
  hooks: {
    beforeChange: [
      ({ data, operation, originalDoc }) => {
        if (operation !== 'update' || !originalDoc) {
          return data;
        }

        const originalStatus =
          typeof originalDoc.status === 'string' ? originalDoc.status : 'draft';
        const nextStatus =
          getTop11ContestStatusFromData(data as Record<string, unknown>) ?? originalStatus;

        assertPublishedContestImmutability(originalStatus, data as Record<string, unknown>);
        validateTop11StatusTransition(originalStatus, nextStatus);

        return data;
      },
    ],
  },
  endpoints: [
    {
      path: '/:id/open',
      method: 'post',
      handler: async (req) => setContestStatus(req, 'open'),
    },
    {
      path: '/:id/close',
      method: 'post',
      handler: async (req) => setContestStatus(req, 'closed'),
    },
    {
      path: '/:id/publish',
      method: 'post',
      handler: async (req) => setContestStatus(req, 'published'),
    },
    {
      path: '/:id/archive',
      method: 'post',
      handler: async (req) => setContestStatus(req, 'archived'),
    },
    {
      path: '/clone',
      method: 'post',
      handler: async (req) => {
        requireTop11Manager(req);
        const body = (await req.json()) as {
          sourceContestId?: string | number;
          title?: string;
          weekOf?: string;
        };

        const sourceContestId = parseTop11Id(String(body.sourceContestId ?? ''), 'sourceContestId');

        const sourceContest = (await req.payload.findByID({
          collection: 'top11-contests',
          id: sourceContestId,
          depth: 0,
          req,
          user: req.user,
          overrideAccess: false,
        })) as ContestDoc;

        const clonedContest = await req.payload.create({
          collection: 'top11-contests',
          data: {
            title: body.title?.trim() || `${sourceContest.title} (Clone)`,
            weekOf: body.weekOf || new Date().toISOString(),
            status: 'draft',
            messageSnapshot: sourceContest.messageSnapshot,
            entries: sourceContest.entries,
            settings: sourceContest.settings,
          },
          req,
          user: req.user,
          overrideAccess: false,
        });

        return Response.json(clonedContest);
      },
    },
    {
      path: '/:id/stats',
      method: 'get',
      handler: async (req) => {
        requireTop11Manager(req);
        const contestId = parseTop11Id(req.routeParams?.id, 'contest id');

        const contest = (await req.payload.findByID({
          collection: 'top11-contests',
          id: contestId,
          depth: 0,
          req,
          user: req.user,
          overrideAccess: false,
        })) as ContestDoc;

        const [votes, writeIns, contestants] = await Promise.all([
          findAllDocs<VoteDoc>({
            payload: req.payload,
            collection: 'top11-votes',
            where: { contest: { equals: contestId } },
            sort: 'createdAt',
          }),
          findAllDocs<WriteInDoc>({
            payload: req.payload,
            collection: 'top11-write-ins',
            where: { contest: { equals: contestId } },
            sort: 'createdAt',
          }),
          findAllDocs<ContestantDoc>({
            payload: req.payload,
            collection: 'top11-contestants',
            where: {
              and: [
                { contest: { equals: contestId } },
                { display: { equals: true } },
                { enteredContest: { equals: true } },
              ],
            },
          }),
        ]);

        const voteCounts = new Map<number, number>();
        const voterKeys = new Set<string>();

        for (const vote of votes) {
          voteCounts.set(vote.song, (voteCounts.get(vote.song) ?? 0) + 1);

          const voterKey = vote.voterAuth0Id || vote.voterUserId || vote.voterEmail || `vote-${vote.id}`;
          voterKeys.add(voterKey);
        }

        const rankedSongs = (contest.entries ?? [])
          .map((entry) => ({
            song: entry.song,
            displayOrder: entry.displayOrder,
            votes: voteCounts.get(entry.song) ?? 0,
          }))
          .sort((a, b) => b.votes - a.votes || a.displayOrder - b.displayOrder);

        const newsletterOnlyCount = contestants.filter((contestant) => contestant.newsletterOptIn).length;

        return Response.json({
          contestId,
          status: contest.status,
          totalVotes: votes.length,
          uniqueVoters: voterKeys.size,
          contestants: contestants.length,
          newsletterOptInContestants: newsletterOnlyCount,
          writeInCount: writeIns.length,
          rankedSongs,
        });
      },
    },
    {
      path: '/:id/pick-winner',
      method: 'post',
      handler: async (req) => {
        requireTop11Manager(req);

        const contestId = parseTop11Id(req.routeParams?.id, 'contest id');
        const body = (await req.json()) as { excludePriorWinners?: boolean };

        const contest = (await req.payload.findByID({
          collection: 'top11-contests',
          id: contestId,
          depth: 0,
          req,
          user: req.user,
          overrideAccess: false,
        })) as ContestDoc;

        const contestants = await findAllDocs<ContestantDoc>({
          payload: req.payload,
          collection: 'top11-contestants',
          where: {
            and: [
              { contest: { equals: contestId } },
              { display: { equals: true } },
              { enteredContest: { equals: true } },
            ],
          },
        });

        if (contestants.length === 0) {
          throw new APIError('No eligible contestants found for this contest', 400);
        }

        const shouldExcludePriorWinners =
          body.excludePriorWinners ?? contest.settings?.excludePriorWinners ?? true;

        let eligibleContestants = contestants;

        if (shouldExcludePriorWinners) {
          const priorWinners = await findAllDocs<WinnerDrawDoc>({
            payload: req.payload,
            collection: 'top11-winner-draws',
          });
          const priorWinnerEmails = new Set(
            priorWinners.map((winner) => winner.contestantEmail).filter(Boolean),
          );

          eligibleContestants = contestants.filter(
            (contestant) => !priorWinnerEmails.has(contestant.email),
          );

          if (eligibleContestants.length === 0) {
            throw new APIError('No eligible contestants remain after excluding prior winners', 400);
          }
        }

        const winnerIndex = Math.floor(Math.random() * eligibleContestants.length);
        const winner = eligibleContestants[winnerIndex];

        const winnerLog = await req.payload.create({
          collection: 'top11-winner-draws',
          data: {
            contest: contestId,
            contestant: winner.id,
            contestantEmail: winner.email,
            drawnBy: req.user && typeof req.user === 'object' ? (req.user as { id?: unknown }).id : null,
            excludePriorWinners: shouldExcludePriorWinners,
          },
          req,
          user: req.user,
          overrideAccess: false,
        });

        return Response.json({
          winner,
          drawLogId: winnerLog.id,
          totalEntries: contestants.length,
          eligibleEntries: eligibleContestants.length,
          excludePriorWinners: shouldExcludePriorWinners,
        });
      },
    },
  ],
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Name for this Top 11 week (for admin use and API clients).',
      },
    },
    slugField(),
    {
      type: 'row',
      fields: [
        {
          name: 'weekOf',
          type: 'date',
          required: true,
          index: true,
          admin: {
            width: '33%',
            date: {
              displayFormat: 'yyyy-MM-dd',
              pickerAppearance: 'dayOnly',
            },
            description: 'Week represented by this contest.',
          },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'draft',
          index: true,
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Open', value: 'open' },
            { label: 'Closed', value: 'closed' },
            { label: 'Published', value: 'published' },
            { label: 'Archived', value: 'archived' },
          ],
          admin: {
            width: '33%',
            description: 'Contest lifecycle state.',
          },
        },
        {
          name: 'externalTemplateUrl',
          type: 'text',
          admin: {
            width: '34%',
            description: 'Link to external templated message source document.',
            placeholder: 'https://',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'votingOpensAt',
          type: 'date',
          admin: {
            width: '50%',
            description: 'When public voting opens.',
          },
        },
        {
          name: 'votingClosesAt',
          type: 'date',
          admin: {
            width: '50%',
            description: 'When public voting closes.',
          },
        },
      ],
    },
    {
      name: 'messageSnapshot',
      type: 'group',
      fields: [
        {
          name: 'headline',
          type: 'text',
        },
        {
          name: 'body',
          type: 'richText',
          editor: lexicalEditor(),
        },
        {
          name: 'bandLinks',
          type: 'array',
          fields: [
            {
              name: 'bandName',
              type: 'text',
              required: true,
            },
            {
              name: 'websiteUrl',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
      admin: {
        description: 'Weekly Top 11 message snapshot, including links to band websites.',
      },
    },
    {
      name: 'entries',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 11,
      validate: validateContestEntries,
      fields: [
        {
          name: 'displayOrder',
          type: 'number',
          required: true,
          min: 1,
          max: 11,
          admin: {
            width: '20%',
          },
        },
        {
          name: 'song',
          type: 'relationship',
          relationTo: 'songs',
          required: true,
          admin: {
            width: '40%',
          },
        },
        {
          name: 'weeklyNote',
          type: 'richText',
          editor: lexicalEditor(),
          admin: {
            width: '40%',
            description: 'Optional weekly context note (e.g., pinch-hit note).',
          },
        },
      ],
      admin: {
        description: 'Top 11 songs for the week. Songs must come from the canonical Songs collection.',
      },
    },
    {
      name: 'settings',
      type: 'group',
      fields: [
        {
          name: 'excludePriorWinners',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Default winner draw behavior to exclude all historical prior winners.',
          },
        },
      ],
    },
  ],
  timestamps: true,
};
