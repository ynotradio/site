import { describe, expect, it, vi } from 'vitest';
import { APIError } from 'payload';
import { Top11Votes } from './Top11Votes';

describe('Top11Votes', () => {
  it('has expected slug and group', () => {
    expect(Top11Votes.slug).toBe('top11-votes');
    expect(Top11Votes.admin?.group).toBe('Top 11');
  });

  it('permits public vote creation and restricts read to managers', () => {
    const createFn = Top11Votes.access?.create as () => boolean;
    const readFn = Top11Votes.access?.read as (args: { req: { user: unknown } }) => boolean;

    expect(createFn()).toBe(true);
    expect(readFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(readFn({ req: { user: null } })).toBe(false);
  });

  describe('beforeChange validation hook', () => {
    const beforeChangeHook = Top11Votes.hooks?.beforeChange?.[0];

    const openContestWithNominees = {
      id: 1,
      status: 'open',
      nominees: [{ song: 10 }, { song: 20 }, { song: 30 }],
    };

    function makeReq(contest: unknown, findResult: { docs: unknown[] } = { docs: [] }) {
      const findByID = vi.fn().mockResolvedValue(contest);
      const find = vi.fn().mockResolvedValue(findResult);
      return { payload: { findByID, find } };
    }

    it('strips a client-supplied voterKey before writing', async () => {
      const req = makeReq(openContestWithNominees);
      const data: Record<string, unknown> = {
        contest: 1,
        song: 10,
        voterEmail: 'jane@example.com',
        voterKey: 'attacker-supplied',
      };

      const result = await beforeChangeHook?.({ operation: 'create', data, req } as never);
      expect(result).not.toHaveProperty('voterKey');
    });

    it('rejects a vote against a closed contest', async () => {
      const req = makeReq({ ...openContestWithNominees, status: 'closed' });
      const data = { contest: 1, song: 10, voterEmail: 'jane@example.com' };

      await expect(beforeChangeHook?.({ operation: 'create', data, req } as never)).rejects.toThrow(
        'Top 11 voting is not currently open for this contest',
      );
    });

    it('rejects a vote for a song not in the contest nominees', async () => {
      const req = makeReq(openContestWithNominees);
      const data = { contest: 1, song: 999, voterEmail: 'jane@example.com' };

      await expect(beforeChangeHook?.({ operation: 'create', data, req } as never)).rejects.toThrow(
        'This song is not on the ballot for this contest',
      );
    });

    it('accepts a vote for a song in the contest nominees', async () => {
      const req = makeReq(openContestWithNominees);
      const data = { contest: 1, song: 20, voterEmail: 'jane@example.com' };

      const result = await beforeChangeHook?.({ operation: 'create', data, req } as never);
      expect(result).toMatchObject({ song: 20 });
    });

    it('resolves populated nominee relationship objects, not just raw ids', async () => {
      const req = makeReq({
        id: 1,
        status: 'open',
        nominees: [{ song: { id: 20 } }, { song: { id: 30 } }],
      });
      const data = { contest: 1, song: 20, voterEmail: 'jane@example.com' };

      const result = await beforeChangeHook?.({ operation: 'create', data, req } as never);
      expect(result).toMatchObject({ song: 20 });
    });

    it('rejects a vote when the contest has no nominees at all', async () => {
      const req = makeReq({ id: 1, status: 'open', nominees: [] });
      const data = { contest: 1, song: 10, voterEmail: 'jane@example.com' };

      await expect(beforeChangeHook?.({ operation: 'create', data, req } as never)).rejects.toThrow(
        'This song is not on the ballot for this contest',
      );
    });

    it('rejects a duplicate vote for the same song from the same voter identity', async () => {
      const req = makeReq(openContestWithNominees, { docs: [{ id: 5 }] });
      const data = { contest: 1, song: 10, voterEmail: 'jane@example.com' };

      await expect(beforeChangeHook?.({ operation: 'create', data, req } as never)).rejects.toThrow(
        'This voter has already voted for this song',
      );
      expect(req.payload.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            and: [
              { contest: { equals: 1 } },
              { song: { equals: 10 } },
              { voterEmail: { equals: 'jane@example.com' } },
            ],
          },
        }),
      );
    });

    it('allows a voter to vote for a second, different nominee song in the same contest', async () => {
      // Legacy MySQL lets one voter pick up to 3 songs (see
      // 20260706_220000_relax_top11_votes_voterkey_uniqueness); this hook's
      // dedup check must be scoped per-song, not per-contest, to match.
      const req = makeReq(openContestWithNominees, { docs: [] });
      const data = { contest: 1, song: 20, voterEmail: 'jane@example.com' };

      const result = await beforeChangeHook?.({ operation: 'create', data, req } as never);
      expect(result).toMatchObject({ song: 20 });
    });

    it('allows the first vote for a new voter identity', async () => {
      const req = makeReq(openContestWithNominees, { docs: [] });
      const data = { contest: 1, song: 10, voterEmail: 'jane@example.com' };

      const result = await beforeChangeHook?.({ operation: 'create', data, req } as never);
      expect(result).toMatchObject({ song: 10 });
    });

    it('requires at least one voter identifier', async () => {
      const req = makeReq(openContestWithNominees);
      const data = { contest: 1, song: 10 };

      await expect(beforeChangeHook?.({ operation: 'create', data, req } as never)).rejects.toThrow(
        APIError,
      );
    });

    it('skips validation on update operations', async () => {
      const findByID = vi.fn();
      const find = vi.fn();
      const req = { payload: { findByID, find } };
      const data = { contest: 1, song: 10, voterEmail: 'jane@example.com' };

      const result = await beforeChangeHook?.({ operation: 'update', data, req } as never);
      expect(result).toBe(data);
      expect(findByID).not.toHaveBeenCalled();
    });
  });
});
