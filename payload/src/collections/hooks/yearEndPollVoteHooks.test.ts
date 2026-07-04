import { describe, expect, it, vi } from 'vitest';
import { enforceUserId, rejectDuplicateVote, enforceMaxPicks } from './yearEndPollVoteHooks';

type HookArgs = Parameters<typeof enforceUserId>[0];

const makeReq = (user: Record<string, unknown> | null) => ({
  user,
  payload: {} as HookArgs['req']['payload'],
  headers: {} as HookArgs['req']['headers'],
}) as HookArgs['req'];

describe('enforceUserId', () => {
  it('uses the Auth0 sub claim when available', () => {
    const data = { userId: 'client-supplied-id', nomineeId: 'n1', category: 1 };
    const result = enforceUserId({ data, req: makeReq({ id: 42, sub: 'auth0|abc' }), operation: 'create', collection: {} as any });
    expect((result as typeof data).userId).toBe('auth0|abc');
  });

  it('falls back to the Payload user id when sub is absent', () => {
    const data = { userId: 'client-supplied-id', nomineeId: 'n1', category: 1 };
    const result = enforceUserId({ data, req: makeReq({ id: 99 }), operation: 'create', collection: {} as any });
    expect((result as typeof data).userId).toBe('99');
  });

  it('throws when no user is present on the request', () => {
    expect(() => enforceUserId({ data: {}, req: makeReq(null), operation: 'create', collection: {} as any })).toThrow('Authentication required');
  });

  it('does not propagate a client-supplied userId', () => {
    const data = { userId: 'spoofed-id', nomineeId: 'n1', category: 1 };
    const result = enforceUserId({ data, req: makeReq({ id: 7, sub: 'auth0|real' }), operation: 'create', collection: {} as any });
    expect((result as typeof data).userId).not.toBe('spoofed-id');
  });
});

describe('rejectDuplicateVote', () => {
  it('passes through on update operations', async () => {
    const data = { userId: 'u1', nomineeId: 'n1', category: 1 };
    const result = await rejectDuplicateVote({
      data,
      req: makeReq({ id: 1 }),
      operation: 'update',
      collection: {} as any,
    });
    expect(result).toEqual(data);
  });

  it('throws when a duplicate vote exists', async () => {
    const payloadMock = {
      find: vi.fn().mockResolvedValue({ totalDocs: 1, docs: [{}] }),
    };
    const req = { ...makeReq({ id: 1 }), payload: payloadMock as any };

    await expect(
      rejectDuplicateVote({ data: { userId: 'u1', nomineeId: 'n1', category: 1 }, req, operation: 'create', collection: {} as any }),
    ).rejects.toThrow('already voted');
  });

  it('allows voting when no duplicate exists', async () => {
    const payloadMock = {
      find: vi.fn().mockResolvedValue({ totalDocs: 0, docs: [] }),
    };
    const req = { ...makeReq({ id: 1 }), payload: payloadMock as any };
    const data = { userId: 'u1', nomineeId: 'n1', category: 1 };

    const result = await rejectDuplicateVote({ data, req, operation: 'create', collection: {} as any });
    expect(result).toEqual(data);
  });
});

describe('enforceMaxPicks', () => {
  it('passes through on update operations', async () => {
    const data = { userId: 'u1', nomineeId: 'n1', category: 1 };
    const result = await enforceMaxPicks({
      data,
      req: makeReq({ id: 1 }),
      operation: 'update',
      collection: {} as any,
    });
    expect(result).toEqual(data);
  });

  it('throws when the voter has reached maxPicks', async () => {
    const payloadMock = {
      findByID: vi.fn().mockResolvedValue({ maxPicks: 2 }),
      find: vi.fn().mockResolvedValue({ totalDocs: 2, docs: [] }),
    };
    const req = { ...makeReq({ id: 1 }), payload: payloadMock as any };

    await expect(
      enforceMaxPicks({ data: { userId: 'u1', nomineeId: 'n2', category: 1 }, req, operation: 'create', collection: {} as any }),
    ).rejects.toThrow('Maximum of 2');
  });

  it('allows voting when under the limit', async () => {
    const payloadMock = {
      findByID: vi.fn().mockResolvedValue({ maxPicks: 3 }),
      find: vi.fn().mockResolvedValue({ totalDocs: 1, docs: [] }),
    };
    const req = { ...makeReq({ id: 1 }), payload: payloadMock as any };
    const data = { userId: 'u1', nomineeId: 'n2', category: 1 };

    const result = await enforceMaxPicks({ data, req, operation: 'create', collection: {} as any });
    expect(result).toEqual(data);
  });
});
