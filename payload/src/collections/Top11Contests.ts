import { randomInt } from 'node:crypto';
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
  id?: string;
  displayOrder: number;
  song: number;
  weeklyNote?: unknown;
};

type ContestDoc = {
  id: number;
  title: string;
  status: string;
  weekOf: string;
  settings?: {
    excludePriorWinners?: boolean;
    priorWinnerLookbackContests?: number;
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
  display: boolean;
};

type WinnerDrawDoc = {
  contestantEmail?: string | null;
  createdAt: string;
};

type CollectionEndpointHandler = NonNullable<CollectionConfig['endpoints']>[number]['handler'];
type EndpointRequest = Parameters<CollectionEndpointHandler>[0];

const setContestStatus = async (req: EndpointRequest, status: string): Promise<Response> => {
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
  let validationError: string | null = null;

  value.forEach((row) => {
    if (validationError) {
      return;
    }

    if (!row || typeof row !== 'object') {
      validationError = 'Each entry must be an object';
      return;
    }

    const typedRow = row as { displayOrder?: unknown; song?: unknown };
    if (typeof typedRow.displayOrder !== 'number') {
      validationError = 'Each entry requires a numeric display order';
      return;
    }

    if (orders.has(typedRow.displayOrder)) {
      validationError = 'Display order must be unique per contest';
      return;
    }
    orders.add(typedRow.displayOrder);

    const songId = Number(typedRow.song);
    if (!Number.isInteger(songId) || songId <= 0) {
      validationError = 'Each entry must reference a valid song';
      return;
    }

    if (songs.has(songId)) {
      validationError = 'A song can only appear once in a Top 11 contest';
      return;
    }
    songs.add(songId);
  });

  if (validationError) {
    return validationError;
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
    components: {
      views: {
        edit: {
          controls: {
            Component:
              '/payload/src/features/top11/Top11ContestControlsTab#Top11ContestControlsTab',
            path: '/controls',
            tab: {
              label: 'Contest Controls',
              href: '/controls',
            },
          },
        },
      },
    },
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

        const rawOriginalStatus = originalDoc.status;
        const originalStatus = typeof rawOriginalStatus === 'string' ? rawOriginalStatus : 'draft';
        const dataAsRecord = data as Record<string, unknown>;
        const nextStatus = getTop11ContestStatusFromData(dataAsRecord) ?? originalStatus;

        assertPublishedContestImmutability(originalStatus, dataAsRecord);
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

        const clonedTitle = body.title?.trim() || `${sourceContest.title} (Clone)`;
        const clonedSlugBase = clonedTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        // Strip each entry row's own sub-document id so Payload generates
        // fresh ones on create, instead of trying to reuse ids that already
        // belong to rows on the source contest.
        const clonedEntries = (sourceContest.entries ?? []).map(
          ({ id: _entryId, ...entry }) => entry,
        );

        const clonedContest = await req.payload.create({
          collection: 'top11-contests',
          data: {
            title: clonedTitle,
            // Explicit slug so repeated clones of the same source (which
            // produce the same default title) never collide on the
            // slugField's auto-generated slug.
            generateSlug: false,
            slug: `${clonedSlugBase}-${Date.now()}`,
            weekOf: body.weekOf || new Date().toISOString(),
            status: 'draft',
            messageSnapshot: sourceContest.messageSnapshot,
            entries: clonedEntries,
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
            req,
            user: req.user,
          }),
          findAllDocs<WriteInDoc>({
            payload: req.payload,
            collection: 'top11-write-ins',
            where: { contest: { equals: contestId } },
            sort: 'createdAt',
            req,
            user: req.user,
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
            req,
            user: req.user,
          }),
        ]);

        const voteCounts = new Map<number, number>();
        const voterKeys = new Set<string>();

        votes.forEach((vote) => {
          voteCounts.set(vote.song, (voteCounts.get(vote.song) ?? 0) + 1);

          const voterKey = vote.voterAuth0Id || vote.voterUserId || vote.voterEmail || `vote-${vote.id}`;
          voterKeys.add(voterKey);
        });

        const rankedSongs = (contest.entries ?? [])
          .map((entry) => ({
            song: entry.song,
            displayOrder: entry.displayOrder,
            votes: voteCounts.get(entry.song) ?? 0,
          }))
          .sort((a, b) => b.votes - a.votes || a.displayOrder - b.displayOrder);

        const newsletterOnlyCount = contestants.filter(
          (contestant) => contestant.newsletterOptIn,
        ).length;

        // Group write-ins by normalized text (trimmed, case-insensitive) so
        // repeat submissions of the same song tally together instead of
        // appearing as separate rows.
        type WriteInGroup = { text: string; count: number; hiddenCount: number };
        const writeInGroups = new Map<string, WriteInGroup>();
        writeIns.forEach((writeIn) => {
          const trimmed = writeIn.writeIn.trim();
          const key = trimmed.toLowerCase();
          const group = writeInGroups.get(key) ?? { text: trimmed, count: 0, hiddenCount: 0 };
          group.count += 1;
          if (!writeIn.display) {
            group.hiddenCount += 1;
          }
          writeInGroups.set(key, group);
        });

        const rankedWriteIns = Array.from(writeInGroups.values()).sort(
          (a, b) => b.count - a.count || a.text.localeCompare(b.text),
        );

        return Response.json({
          contestId,
          status: contest.status,
          totalVotes: votes.length,
          uniqueVoters: voterKeys.size,
          contestants: contestants.length,
          newsletterOptInContestants: newsletterOnlyCount,
          writeInCount: writeIns.length,
          rankedWriteIns,
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
          req,
          user: req.user,
        });

        if (contestants.length === 0) {
          throw new APIError('No eligible contestants found for this contest', 400);
        }

        const settingsExcludePriorWinners = contest.settings?.excludePriorWinners ?? true;
        const shouldExcludePriorWinners = body.excludePriorWinners ?? settingsExcludePriorWinners;

        let eligibleContestants = contestants;

        if (shouldExcludePriorWinners) {
          const lookbackContests = contest.settings?.priorWinnerLookbackContests ?? 8;

          const priorWinners = await findAllDocs<WinnerDrawDoc>({
            payload: req.payload,
            collection: 'top11-winner-draws',
            sort: '-createdAt',
            req,
            user: req.user,
          });

          // 0 means no lookback limit: check the full all-time winner history.
          const recentPriorWinners = lookbackContests > 0
            ? priorWinners.slice(0, lookbackContests) : priorWinners;

          const priorWinnerEmails = new Set(
            recentPriorWinners.map((winner) => winner.contestantEmail).filter(Boolean),
          );

          eligibleContestants = contestants.filter(
            (contestant) => !priorWinnerEmails.has(contestant.email),
          );

          if (eligibleContestants.length === 0) {
            throw new APIError('No eligible contestants remain after excluding prior winners', 400);
          }
        }

        // node:crypto randomInt provides cryptographically secure randomness for fair draws.
        const winnerIndex = randomInt(eligibleContestants.length);
        const winner = eligibleContestants[winnerIndex];

        const winnerLog = await req.payload.create({
          collection: 'top11-winner-draws',
          data: {
            contest: contestId,
            contestant: winner.id,
            contestantEmail: winner.email,
            drawnBy:
              req.user && typeof req.user === 'object' ? (req.user as { id?: unknown }).id : null,
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
          validate: (value) => {
            if (!value) {
              return true;
            }

            try {
              // eslint-disable-next-line no-new
              new URL(String(value));
              return true;
            } catch {
              return 'External template URL must be a valid URL';
            }
          },
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
        description:
          'Top 11 songs for the week. Songs must come from the canonical Songs collection.',
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
            description: 'Default winner draw behavior to exclude recent prior winners.',
          },
        },
        {
          name: 'priorWinnerLookbackContests',
          type: 'number',
          defaultValue: 8,
          min: 0,
          admin: {
            description:
              'How many of the most recent past contests to check for prior winners to exclude. 0 excludes winners from all contests ever.',
            condition: (_data, siblingData) => Boolean(siblingData?.excludePriorWinners),
          },
        },
      ],
    },
  ],
  timestamps: true,
};
