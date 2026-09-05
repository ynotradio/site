/**
 * Unit tests for editor-experience observability hooks.
 *
 * Cover the pure extraction logic and the decision gates that determine whether
 * an event is recorded — without a database (the write is mocked).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractValidationDetails,
  recordEditorError,
  recordEmptySearch,
  EDITOR_EVENTS_SLUG,
} from './observability';

function mockReq(overrides: Record<string, unknown> = {}) {
  return {
    user: { id: 7, email: 'josh@example.com' },
    method: 'PATCH',
    url: 'http://localhost:3000/api/songs/1',
    headers: { get: () => undefined },
    payload: { create: vi.fn().mockResolvedValue({ id: 1 }) },
    ...overrides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe('extractValidationDetails', () => {
  it('pulls field paths and details from a ValidationError shape', () => {
    const error = {
      message: 'The following field is invalid: slug',
      data: { errors: [{ path: 'slug', message: 'invalid slug' }, { path: 'title' }] },
    };
    expect(extractValidationDetails(error)).toEqual({
      fieldPath: 'slug, title',
      details: { errors: error.data.errors },
    });
  });

  it('returns an empty object when there are no structured errors', () => {
    expect(extractValidationDetails(new Error('boom'))).toEqual({});
    expect(extractValidationDetails({ data: { errors: [] } })).toEqual({});
    expect(extractValidationDetails(null)).toEqual({});
  });
});

describe('recordEditorError', () => {
  let req: ReturnType<typeof mockReq>;
  beforeEach(() => {
    req = mockReq();
  });

  it('records an error event for an authenticated editor', async () => {
    await recordEditorError({
      error: {
        message: 'The following field is invalid: slug',
        data: { errors: [{ path: 'slug' }] },
      },
      req,
      collection: { slug: 'songs' },
    });
    expect(req.payload.create).toHaveBeenCalledTimes(1);
    const arg = req.payload.create.mock.calls[0][0];
    expect(arg.collection).toBe(EDITOR_EVENTS_SLUG);
    expect(arg.overrideAccess).toBe(true);
    expect(arg.data).toMatchObject({
      type: 'error',
      collectionSlug: 'songs',
      fieldPath: 'slug',
      userEmail: 'josh@example.com',
      userId: '7',
    });
  });

  it('does nothing for unauthenticated (public) requests', async () => {
    const publicReq = mockReq({ user: null });
    await recordEditorError({
      error: { message: 'x' },
      req: publicReq,
      collection: { slug: 'songs' },
    });
    expect(publicReq.payload.create).not.toHaveBeenCalled();
  });

  it('skips its own collection to avoid recursion', async () => {
    await recordEditorError({
      error: { message: 'x' },
      req,
      collection: { slug: EDITOR_EVENTS_SLUG },
    });
    expect(req.payload.create).not.toHaveBeenCalled();
  });

  it('never throws when the write fails', async () => {
    req.payload.create.mockRejectedValueOnce(new Error('db down'));
    await expect(
      recordEditorError({ error: { message: 'x' }, req, collection: { slug: 'songs' } }),
    ).resolves.toBeUndefined();
  });
});

describe('recordEmptySearch', () => {
  let req: ReturnType<typeof mockReq>;
  beforeEach(() => {
    req = mockReq();
  });

  it('records an empty-search event for a filtered find that returns nothing', async () => {
    await recordEmptySearch({
      operation: 'find',
      result: { totalDocs: 0 },
      req,
      collection: { slug: 'artists' },
      args: { where: { name: { like: 'zzz' } } },
    });
    expect(req.payload.create).toHaveBeenCalledTimes(1);
    const arg = req.payload.create.mock.calls[0][0];
    expect(arg.data).toMatchObject({
      type: 'empty-search',
      collectionSlug: 'artists',
      operation: 'find',
    });
    expect(arg.data.searchQuery).toContain('zzz');
  });

  it('ignores non-find operations', async () => {
    await recordEmptySearch({
      operation: 'create',
      result: { totalDocs: 0 },
      req,
      collection: { slug: 'artists' },
      args: {},
    });
    expect(req.payload.create).not.toHaveBeenCalled();
  });

  it('ignores finds with no filter (an unfiltered browse)', async () => {
    await recordEmptySearch({
      operation: 'find',
      result: { totalDocs: 0 },
      req,
      collection: { slug: 'artists' },
      args: {},
    });
    expect(req.payload.create).not.toHaveBeenCalled();
  });

  it('ignores finds that returned results', async () => {
    await recordEmptySearch({
      operation: 'find',
      result: { totalDocs: 5 },
      req,
      collection: { slug: 'artists' },
      args: { where: { name: { like: 'the' } } },
    });
    expect(req.payload.create).not.toHaveBeenCalled();
  });

  it('skips its own collection', async () => {
    await recordEmptySearch({
      operation: 'find',
      result: { totalDocs: 0 },
      req,
      collection: { slug: EDITOR_EVENTS_SLUG },
      args: { where: { type: { equals: 'error' } } },
    });
    expect(req.payload.create).not.toHaveBeenCalled();
  });
});
