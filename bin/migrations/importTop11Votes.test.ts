import { describe, expect, it, vi } from 'vitest';

vi.mock('mysql2/promise', () => ({}));
vi.mock('./shared/payloadClient', () => ({ getPayloadClient: vi.fn() }));
vi.mock('../../config/databases', () => ({ getMySQLConfig: vi.fn() }));

const { importVotesIncremental } = await import('./importTop11Votes');

function makePayload(existingVoteDocs: Record<string, unknown>[] = []) {
  const create = vi.fn().mockResolvedValue({ id: 1 });
  const find = vi
    .fn()
    .mockResolvedValue({ docs: existingVoteDocs, totalDocs: existingVoteDocs.length });
  return { create, find } as any;
}

describe('importVotesIncremental', () => {
  const nominees = [
    { id: 101, artist: 'A', song: 'Song A', value: 2 },
    { id: 102, artist: 'B', song: 'Song B', value: 1 },
  ];
  const songIdByLegacyId = new Map([
    [101, 1],
    [102, 2],
  ]);

  it('creates one vote row per counted slot on a fresh contest with no registered voters', async () => {
    const payload = makePayload([]);
    const voters: { user_email: string; user_auth0_id: string | null }[] = [];

    const result = await importVotesIncremental(payload, 5, nominees, songIdByLegacyId, voters);

    // 2 (Song A) + 1 (Song B) = 3 counted slots total, all synthetic
    expect(result.created).toBe(3);
    expect(result.skipped).toBe(0);
    expect(result.errors).toBe(0);
    expect(payload.create).toHaveBeenCalledTimes(3);
  });

  it('gives every registered voter a real-identity row, then tops up remaining counted total synthetically', async () => {
    const payload = makePayload([]);
    const voters = [{ user_email: 'real@example.com', user_auth0_id: 'auth0|abc' }];

    const result = await importVotesIncremental(payload, 5, nominees, songIdByLegacyId, voters);

    // 1 real-voter row + (3 counted total - 1 already covered by that row) = 3 total
    expect(result.created).toBe(3);
    const calls = payload.create.mock.calls.map((c: any[]) => c[0].data);
    expect(calls[0]).toMatchObject({ voterEmail: 'real@example.com', voterAuth0Id: 'auth0|abc' });
    expect(calls.slice(1).every((c: any) => typeof c.voterUserId === 'string')).toBe(true);
  });

  it('gives a write-in-only voter (zero counted checkbox votes) a dedup-guard row anyway', async () => {
    // This voter registered in top11_user_votes but cast no checkbox picks --
    // legacy's top11songs.value never reflects them, yet they must still get
    // a row so hasUserVotedThisWeek() blocks a post-cutover re-vote.
    const payload = makePayload([]);
    const voters = [
      { user_email: 'checkbox-voter@example.com', user_auth0_id: null },
      { user_email: 'writein-only@example.com', user_auth0_id: null },
      { user_email: 'another-checkbox-voter@example.com', user_auth0_id: null },
      { user_email: 'yet-another@example.com', user_auth0_id: null },
    ];

    const result = await importVotesIncremental(payload, 5, nominees, songIdByLegacyId, voters);

    const calls = payload.create.mock.calls.map((c: any[]) => c[0].data);
    const coveredEmails = calls.map((c: any) => c.voterEmail).filter(Boolean);
    expect(coveredEmails).toEqual(voters.map((v) => v.user_email));
    expect(result.created).toBeGreaterThanOrEqual(voters.length);
  });

  it('skips a real voter already imported by voterAuth0Id on a re-run', async () => {
    const payload = makePayload([
      { voterAuth0Id: 'auth0|abc', voterEmail: 'real@example.com', song: 1 },
    ]);
    const voters = [{ user_email: 'real@example.com', user_auth0_id: 'auth0|abc' }];

    const result = await importVotesIncremental(payload, 5, nominees, songIdByLegacyId, voters);

    expect(result.skipped).toBe(1);
    // 3 counted total - 1 already covered by the real voter's existing row = 2
    expect(result.created).toBe(2);
  });

  it('skips a real voter already imported by voterEmail when no auth0Id was recorded', async () => {
    const payload = makePayload([{ voterEmail: 'real@example.com', song: 1 }]);
    const voters = [{ user_email: 'real@example.com', user_auth0_id: null }];

    const result = await importVotesIncremental(payload, 5, nominees, songIdByLegacyId, voters);

    expect(result.skipped).toBe(1);
    expect(result.created).toBe(2);
  });

  it('is fully idempotent: a second run with the same inputs creates nothing new', async () => {
    // First run's output, as importVotesIncremental would have created it:
    // the real voter's row (arbitrary song) plus synthetic top-up rows for
    // Song A (2 total) and Song B (1 total).
    const firstRunDocs = [
      { voterEmail: 'real@example.com', voterAuth0Id: 'auth0|abc', song: 1 },
      { voterUserId: 'legacy-import:1', song: 1 },
      { voterUserId: 'legacy-import:2', song: 2 },
    ];
    const payload = makePayload(firstRunDocs);
    const voters = [{ user_email: 'real@example.com', user_auth0_id: 'auth0|abc' }];

    const result = await importVotesIncremental(payload, 5, nominees, songIdByLegacyId, voters);

    expect(result.created).toBe(0);
    expect(result.skipped).toBe(1);
    expect(payload.create).not.toHaveBeenCalled();
  });

  it('does not double-count a synthetic row already imported for a song when topping up', async () => {
    // Song A (target 2) already has 1 synthetic row; Song B (target 1) has 0.
    const payload = makePayload([{ voterUserId: 'legacy-import:1', song: 1 }]);
    const voters: { user_email: string; user_auth0_id: string | null }[] = [];

    const result = await importVotesIncremental(payload, 5, nominees, songIdByLegacyId, voters);

    // Song A needs 1 more, Song B needs 1 -- not 3 fresh rows
    expect(result.created).toBe(2);
  });

  it('skips nominees with no mapped song id', async () => {
    const payload = makePayload([]);
    const partialMap = new Map([[101, 1]]);
    const voters: { user_email: string; user_auth0_id: string | null }[] = [];

    const result = await importVotesIncremental(payload, 5, nominees, partialMap, voters);

    // Only Song A's 2 slots count; Song B's nominee has no mapped id
    expect(result.created).toBe(2);
  });

  it('throws if no nominee resolves to a song but voters are registered', async () => {
    const payload = makePayload([]);
    const voters = [{ user_email: 'real@example.com', user_auth0_id: null }];

    await expect(importVotesIncremental(payload, 5, nominees, new Map(), voters)).rejects.toThrow(
      'No nominee resolved to a song',
    );
  });
});
