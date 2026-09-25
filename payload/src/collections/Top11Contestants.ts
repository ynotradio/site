import type { CollectionConfig } from 'payload';
import { APIError } from 'payload';
import {
  buildCsv, findAllDocs, parseTop11Id, requireTop11Manager,
} from '../features/top11/utils';
import { hasRole } from '../utils/auth';

type ContestantDoc = {
  id: number;
  contest: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  enteredContest: boolean;
  newsletterOptIn: boolean;
  display: boolean;
  createdAt: string;
};

export const Top11Contestants: CollectionConfig = {
  slug: 'top11-contestants',
  enableRichTextLink: false,
  enableRichTextRelationship: false,
  enableQueryPresets: true,
  labels: {
    singular: 'Contestant',
    plural: 'Contestants',
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: [
      'firstName',
      'lastName',
      'email',
      'enteredContest',
      'newsletterOptIn',
      'createdAt',
    ],
    group: 'Top 11',
    description:
      'Top 11 contestants and newsletter signups. CSV export available via custom endpoint.',
    groupBy: true,
  },
  access: {
    read: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    create: () => true,
    update: ({ req }) => hasRole(req.user, ['admin', 'editor']),
    delete: ({ req }) => hasRole(req.user, ['admin', 'editor']),
  },
  hooks: {
    beforeChange: [
      async ({ operation, data, req }) => {
        if (operation !== 'create' || !data) {
          return data;
        }

        const contestId = Number(data.contest);
        const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';

        if (!Number.isInteger(contestId) || contestId <= 0 || !email) {
          return data;
        }

        const existingEntries = await req.payload.find({
          collection: 'top11-contestants',
          where: {
            and: [{ contest: { equals: contestId } }, { email: { equals: email } }],
          },
          req,
          overrideAccess: true,
          limit: 1,
          depth: 0,
        });

        if (existingEntries.docs.length > 0) {
          throw new APIError('This email has already entered the current Top 11 contest', 409);
        }

        return data;
      },
    ],
  },
  endpoints: [
    {
      path: '/export',
      method: 'get',
      handler: async (req) => {
        requireTop11Manager(req);

        const url = new URL(req.url);
        const contestIdParam = url.searchParams.get('contestId');

        const where = contestIdParam
          ? {
            contest: {
              equals: parseTop11Id(contestIdParam, 'contestId'),
            },
          }
          : undefined;

        const contestants = await findAllDocs<ContestantDoc>({
          payload: req.payload,
          collection: 'top11-contestants',
          where,
          sort: 'createdAt',
          req,
          user: req.user,
        });

        if (contestants.length === 0) {
          throw new APIError('No contestants found for CSV export', 404);
        }

        const csv = buildCsv(
          [
            'Contest ID',
            'First Name',
            'Last Name',
            'Email',
            'Phone',
            'Entered Contest',
            'Newsletter Opt-in',
            'Display',
            'Created At',
          ],
          contestants.map((contestant) => [
            String(contestant.contest),
            contestant.firstName,
            contestant.lastName,
            contestant.email,
            contestant.phone ?? '',
            contestant.enteredContest ? 'yes' : 'no',
            contestant.newsletterOptIn ? 'yes' : 'no',
            contestant.display ? 'yes' : 'no',
            contestant.createdAt,
          ]),
        );

        return new Response(csv, {
          headers: {
            'content-type': 'text/csv; charset=utf-8',
            'content-disposition': 'attachment; filename="top11-contestants.csv"',
          },
        });
      },
    },
  ],
  fields: [
    {
      name: 'contest',
      type: 'relationship',
      relationTo: 'top11-contests',
      required: true,
      index: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'firstName',
          type: 'text',
          required: true,
          admin: {
            width: '50%',
          },
        },
        {
          name: 'lastName',
          type: 'text',
          required: true,
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
          name: 'email',
          type: 'email',
          required: true,
          index: true,
          admin: {
            width: '50%',
          },
        },
        {
          name: 'phone',
          type: 'text',
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
          name: 'enteredContest',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            width: '33%',
          },
        },
        {
          name: 'newsletterOptIn',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            width: '33%',
          },
        },
        {
          name: 'display',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            width: '34%',
          },
        },
      ],
    },
  ],
  timestamps: true,
};
