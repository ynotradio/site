import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appendBulkNominees, validateNominees } from './yearEndPollCategoryHooks';

type HookArgs = Parameters<typeof validateNominees>[0];

describe('appendBulkNominees', () => {
  const find = vi.fn();
  const run = async (data: Record<string, unknown>, originalDoc?: Record<string, unknown>) => (await appendBulkNominees({
    data,
    originalDoc,
    req: { user: null, payload: { find } } as unknown as HookArgs['req'],
    operation: 'update',
    collection: {} as any,
  } as HookArgs)) as Record<string, unknown>;

  beforeEach(() => {
    find.mockReset().mockResolvedValue({ docs: [] });
  });

  it('links a line that matches exactly one song and keeps the rest as labels', async () => {
    find.mockImplementation(async ({ where }) => ({
      docs: /cpr/i.test(where.displayName.like)
        ? [
          { id: 5, displayName: 'Wet Leg - CPR' },
          { id: 6, displayName: 'Wet Leg - CPR (Live)' },
        ]
        : [],
    }));
    const result = await run({
      categoryType: 'songs',
      nominees: [],
      bulkNominees: 'wet leg – CPR\nWet Leg - CPR\nBeck - Run Away',
    });
    expect(find.mock.calls[0][0].collection).toBe('songs');
    expect(result.nominees).toEqual([{ song: 5 }, { customLabel: 'Beck - Run Away' }]);
  });

  it('does not link when more than one document has the same name', async () => {
    find.mockResolvedValue({
      docs: [
        { id: 1, name: 'Metric' },
        { id: 2, name: 'metric' },
      ],
    });
    const result = await run({ categoryType: 'artists', nominees: [], bulkNominees: 'Metric' });
    expect(result.nominees).toEqual([{ customLabel: 'Metric' }]);
  });

  it('links an exact match and skips it when already linked', async () => {
    find.mockResolvedValue({ docs: [{ id: 9, name: 'Metric' }] });
    const result = await run({
      categoryType: 'artists',
      nominees: [{ artist: 9 }],
      bulkNominees: 'Metric\nMetric',
    });
    expect(result.nominees).toEqual([{ artist: 9 }]);
    const fresh = await run({ categoryType: 'artists', nominees: [], bulkNominees: 'Metric' });
    expect(fresh.nominees).toEqual([{ artist: 9 }]);
  });

  it('links an exact name even when many others contain it', async () => {
    const similar = Array.from({ length: 12 }, (_, i) => ({ id: 100 + i, name: `Rocket ${i}` }));
    find.mockImplementation(async ({ where }) => ({
      docs: where.name.equals ? [{ id: 3, name: 'Rocket' }] : similar,
    }));
    const result = await run({ categoryType: 'artists', nominees: [], bulkNominees: 'Rocket' });
    expect(result.nominees).toEqual([{ artist: 3 }]);
    expect(find.mock.calls[0][0]).not.toHaveProperty('limit');
  });

  it('falls back to a case-insensitive match when the case differs', async () => {
    find.mockImplementation(async ({ where }) => ({
      docs: where.name.like
        ? [
          { id: 8, name: 'HAIM' },
          { id: 9, name: 'Haim Brothers' },
        ]
        : [],
    }));
    const result = await run({ categoryType: 'artists', nominees: [], bulkNominees: 'haim' });
    expect(result.nominees).toEqual([{ artist: 8 }]);
  });

  it('never looks anything up for a custom category', async () => {
    await run({ categoryType: 'custom', nominees: [], bulkNominees: 'The Studio' });
    expect(find).not.toHaveBeenCalled();
  });

  it('reads an artist/title CSV', async () => {
    const result = await run({
      categoryType: 'custom',
      nominees: [],
      bulkNominees: 'Artist,Title\nWet Leg,CPR\n"Beck, Jr.",Run Away',
    });
    expect(result.nominees).toEqual([
      { customLabel: 'Wet Leg - CPR' },
      { customLabel: 'Beck, Jr. - Run Away' },
    ]);
  });

  it('appends one custom-label nominee per non-blank line', async () => {
    const result = await run({
      nominees: [{ song: 1 }],
      bulkNominees: 'Beck - Run Away\n\n  Blondshell - Violins \r\n',
    });
    expect(result.nominees).toEqual([
      { song: 1 },
      { customLabel: 'Beck - Run Away' },
      { customLabel: 'Blondshell - Violins' },
    ]);
    expect(result).not.toHaveProperty('bulkNominees');
  });

  it('skips lines already on the list or repeated, ignoring case', async () => {
    const result = await run({
      nominees: [{ customLabel: 'Beck - Run Away' }],
      bulkNominees: 'beck - run away\nKurt Vile - Zoom 97\nKURT VILE - ZOOM 97',
    });
    expect(result.nominees).toEqual([
      { customLabel: 'Beck - Run Away' },
      { customLabel: 'Kurt Vile - Zoom 97' },
    ]);
  });

  it('appends to the saved nominees when the update omits them', async () => {
    const result = await run(
      { bulkNominees: 'Caroline Rose - Chow Mein' },
      { nominees: [{ song: 7 }] },
    );
    expect(result.nominees).toEqual([{ song: 7 }, { customLabel: 'Caroline Rose - Chow Mein' }]);
  });

  it('leaves data untouched when nothing was pasted', async () => {
    expect(await run({ nominees: [{ song: 1 }], bulkNominees: '  ' })).toEqual({
      nominees: [{ song: 1 }],
    });
  });
});

const makeArgs = (nominees: unknown[]): HookArgs => ({
  data: { nominees },
  req: { user: null, payload: {} } as HookArgs['req'],
  operation: 'create',
  collection: {} as any,
}) as HookArgs;

describe('validateNominees', () => {
  it('passes when all nominees have a song', () => {
    expect(() => validateNominees(makeArgs([{ song: 1 }, { song: 2 }]))).not.toThrow();
  });

  it('passes when nominees have varied typed fields', () => {
    expect(() => validateNominees(
      makeArgs([
        { song: 1 },
        { record: 2 },
        { artist: 3 },
        { concert: 4 },
        { customLabel: 'Movie' },
      ]),
    )).not.toThrow();
  });

  it('throws when a nominee row has no populated field', () => {
    expect(() => validateNominees(makeArgs([{ song: 1 }, {}]))).toThrow('position 2');
  });

  it('throws when customLabel is an empty string', () => {
    expect(() => validateNominees(makeArgs([{ customLabel: '   ' }]))).toThrow('position 1');
  });

  it('passes when nominees array is empty', () => {
    expect(() => validateNominees(makeArgs([]))).not.toThrow();
  });

  it('passes when data.nominees is undefined', () => {
    const args = makeArgs([]);
    (args as any).data = {};
    expect(() => validateNominees(args)).not.toThrow();
  });
});
