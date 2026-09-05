import type { PayloadRequest } from 'payload';

/**
 * Editor-experience observability.
 *
 * Captures the two things editors actually feel — errors on save and searches
 * that come back empty — into the `editor-events` collection so the team can
 * see how often (and where) the admin is tripping people up, and get ahead of
 * it. Everything here is best-effort: observability must NEVER break or slow the
 * request that triggered it, so every write is wrapped and failures are
 * swallowed.
 *
 * The hooks are typed structurally (rather than with Payload's hook types) so
 * they can be attached to both the root config (`afterError`) and individual
 * collections (`afterOperation`) without fighting the operation-result unions;
 * they are cast to the exact hook type at their registration sites.
 */

export const EDITOR_EVENTS_SLUG = 'editor-events';

type EditorEventType = 'error' | 'empty-search';

type EditorEventInput = {
  type: EditorEventType;
  collectionSlug?: string;
  operation?: string;
  message: string;
  fieldPath?: string;
  searchQuery?: string;
  details?: unknown;
};

function getUserEmail(req: PayloadRequest): string | undefined {
  const user = req.user as { email?: unknown } | null | undefined;
  return typeof user?.email === 'string' ? user.email : undefined;
}

function getUserId(req: PayloadRequest): string | undefined {
  const user = req.user as { id?: unknown } | null | undefined;
  if (user?.id == null) return undefined;
  return String(user.id);
}

function getHeader(req: PayloadRequest, name: string): string | undefined {
  const value = req.headers?.get?.(name);
  return typeof value === 'string' && value ? value : undefined;
}

function requestUrl(req: PayloadRequest): string | undefined {
  // Prefer the referer (the admin page the editor was actually on) over the
  // API route the request hit.
  return getHeader(req, 'referer') ?? (typeof req.url === 'string' ? req.url : undefined);
}

/**
 * Write one event. Never throws. Runs in its own transaction (we intentionally
 * do NOT pass `req`) so it is unaffected by — and cannot interfere with — the
 * originating request, which may itself be erroring or rolling back.
 */
async function writeEvent(req: PayloadRequest, event: EditorEventInput): Promise<void> {
  try {
    await req.payload.create({
      collection: EDITOR_EVENTS_SLUG,
      overrideAccess: true,
      data: {
        type: event.type,
        collectionSlug: event.collectionSlug,
        operation: event.operation,
        // Keep messages sane even though varchar is unbounded in Postgres.
        message: event.message.slice(0, 2000),
        fieldPath: event.fieldPath,
        searchQuery: event.searchQuery,
        userEmail: getUserEmail(req),
        userId: getUserId(req),
        url: requestUrl(req),
        userAgent: getHeader(req, 'user-agent'),
        details: event.details ?? undefined,
      },
    });
  } catch {
    // Observability is best-effort; a logging failure must not surface to the user.
  }
}

/**
 * Pull field-level validation info out of a Payload error, when present.
 * Payload's ValidationError carries `data.errors: [{ path, message, label }]`.
 */
export function extractValidationDetails(error: unknown): {
  fieldPath?: string;
  details?: unknown;
} {
  const data = (error as { data?: unknown })?.data as { errors?: unknown } | undefined;
  const errors = data?.errors;
  if (!Array.isArray(errors) || errors.length === 0) return {};

  const paths = errors
    .map((e) => (e as { path?: unknown; field?: unknown }).path ?? (e as { field?: unknown }).field)
    .filter((p): p is string => typeof p === 'string' && p.length > 0);

  return {
    fieldPath: paths.length > 0 ? paths.join(', ') : undefined,
    details: { errors },
  };
}

type AfterErrorArgs = {
  error?: { message?: unknown; data?: unknown };
  req?: PayloadRequest;
  collection?: { slug?: string } | null;
};

/**
 * Root `afterError` hook: record errors surfaced to authenticated editors.
 *
 * Scoped to requests with a `req.user` so we capture the admin/editor
 * experience (a failed save, an "invalid slug", a permission error) rather than
 * anonymous public-API traffic. Skips its own collection to avoid recursion.
 */
export async function recordEditorError({ error, req, collection }: AfterErrorArgs): Promise<void> {
  if (!req?.user) return;
  if (collection?.slug === EDITOR_EVENTS_SLUG) return;

  const { fieldPath, details } = extractValidationDetails(error);
  const message = typeof error?.message === 'string' && error.message ? error.message : 'Unknown error';

  await writeEvent(req, {
    type: 'error',
    collectionSlug: collection?.slug,
    operation: typeof req.method === 'string' ? req.method : undefined,
    message,
    fieldPath,
    details,
  });
}

function whereHasKeys(where: unknown): boolean {
  return Boolean(where && typeof where === 'object' && Object.keys(where as object).length > 0);
}

type AfterOperationArgs = {
  operation?: string;
  result?: { totalDocs?: number };
  req?: PayloadRequest;
  collection?: { slug?: string } | null;
  args?: { where?: unknown };
};

/**
 * Collection `afterOperation` logic: record admin searches/filters that return
 * zero results. Attached to the editor-facing content collections (see the
 * config). Only does work on the rare empty-result path, so it adds no
 * meaningful overhead to normal reads. Returns nothing — the caller passes the
 * operation result straight through.
 */
export async function recordEmptySearch({
  operation,
  result,
  req,
  collection,
  args,
}: AfterOperationArgs): Promise<void> {
  if (operation !== 'find') return;
  if (!req?.user) return;
  if (collection?.slug === EDITOR_EVENTS_SLUG) return;

  const where = args?.where;
  // Only a filtered/searched query that found nothing is an "unexpected empty
  // result." An unfiltered browse of an empty collection is not noteworthy.
  if (!whereHasKeys(where) || result?.totalDocs !== 0) return;

  let searchQuery: string | undefined;
  try {
    searchQuery = JSON.stringify(where).slice(0, 2000);
  } catch {
    searchQuery = undefined;
  }

  await writeEvent(req, {
    type: 'empty-search',
    collectionSlug: collection?.slug,
    operation: 'find',
    message: 'Search returned no results',
    searchQuery,
    details: { where },
  });
}
