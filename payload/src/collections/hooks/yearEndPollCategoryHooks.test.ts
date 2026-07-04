import { describe, expect, it } from 'vitest';
import { validateNominees } from './yearEndPollCategoryHooks';

type HookArgs = Parameters<typeof validateNominees>[0];

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
      makeArgs([{ song: 1 }, { record: 2 }, { artist: 3 }, { concert: 4 }, { customLabel: 'Movie' }]),
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
