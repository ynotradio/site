import { describe, expect, it } from 'vitest';
import { appendBulkNominees, validateNominees } from './yearEndPollCategoryHooks';

type HookArgs = Parameters<typeof validateNominees>[0];

describe('appendBulkNominees', () => {
  const run = (data: Record<string, unknown>, originalDoc?: Record<string, unknown>) => appendBulkNominees({
    data,
    originalDoc,
    req: { user: null, payload: {} } as HookArgs['req'],
    operation: 'update',
    collection: {} as any,
  } as HookArgs) as Record<string, unknown>;

  it('appends one custom-label nominee per non-blank line', () => {
    const result = run({
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

  it('skips lines already on the list or repeated, ignoring case', () => {
    const result = run({
      nominees: [{ customLabel: 'Beck - Run Away' }],
      bulkNominees: 'beck - run away\nKurt Vile - Zoom 97\nKURT VILE - ZOOM 97',
    });
    expect(result.nominees).toEqual([
      { customLabel: 'Beck - Run Away' },
      { customLabel: 'Kurt Vile - Zoom 97' },
    ]);
  });

  it('appends to the saved nominees when the update omits them', () => {
    const result = run({ bulkNominees: 'Caroline Rose - Chow Mein' }, { nominees: [{ song: 7 }] });
    expect(result.nominees).toEqual([{ song: 7 }, { customLabel: 'Caroline Rose - Chow Mein' }]);
  });

  it('leaves data untouched when nothing was pasted', () => {
    expect(run({ nominees: [{ song: 1 }], bulkNominees: '  ' })).toEqual({
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
