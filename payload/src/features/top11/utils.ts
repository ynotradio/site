import {
  APIError, type Payload, type PayloadRequest, type Where,
} from 'payload';
import { hasRole } from '../../utils/auth';

export const TOP11_MANAGER_ROLES = ['admin', 'editor'] as const;

export const requireTop11Manager = (req: PayloadRequest): void => {
  if (!hasRole(req.user, [...TOP11_MANAGER_ROLES])) {
    throw new APIError('Unauthorized', 401);
  }
};

export const parseTop11Id = (value: string | undefined, fieldName = 'id'): number => {
  if (!value) {
    throw new APIError(`${fieldName} is required`, 400);
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new APIError(`${fieldName} must be a positive integer`, 400);
  }

  return parsed;
};

const FORMULA_TRIGGER_CHARS = ['=', '+', '-', '@', '\t', '\r'];

const escapeCsvValue = (value: string): string => {
  // Prefix with a leading apostrophe when the value starts with a character
  // that Excel/Sheets interpret as a formula trigger, so untrusted input
  // (e.g. a public contestant's name) can't execute as a formula when the
  // exported CSV is opened in a spreadsheet app.
  const escaped = FORMULA_TRIGGER_CHARS.includes(value[0]) ? `'${value}` : value;

  if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
    return `"${escaped.replaceAll('"', '""')}"`;
  }

  return escaped;
};

export const buildCsv = (headers: string[], rows: string[][]): string => {
  const lines = [headers, ...rows].map((values) => values.map(escapeCsvValue).join(','));
  return `${lines.join('\n')}\n`;
};

export const findAllDocs = async <TDoc>(args: {
  payload: Payload;
  collection: string;
  where?: Where;
  depth?: number;
  sort?: string;
  select?: Record<string, true>;
  req?: PayloadRequest;
  user?: PayloadRequest['user'];
}): Promise<TDoc[]> => {
  const {
    payload, collection, where, depth = 0, sort, select, req, user,
  } = args;
  const result = await payload.find({
    collection,
    where,
    depth,
    sort,
    select,
    req,
    user,
    limit: 10000,
    pagination: false,
    overrideAccess: false,
  });

  return result.docs as TDoc[];
};
