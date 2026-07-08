import { describe, expect, it } from 'vitest';
import { Top11WinnerDraws } from './Top11WinnerDraws';
import { flattenRowFields } from './testUtils';

describe('Top11WinnerDraws', () => {
  it('has expected slug and group', () => {
    expect(Top11WinnerDraws.slug).toBe('top11-winner-draws');
    expect(Top11WinnerDraws.admin?.group).toBe('Top 11');
  });

  it('contains the audit trail fields for a draw', () => {
    const allFields = flattenRowFields(Top11WinnerDraws.fields);
    const names = allFields.map((field) => field.name);

    expect(names).toContain('contest');
    expect(names).toContain('contestant');
    expect(names).toContain('contestantEmail');
    expect(names).toContain('drawnBy');
    expect(names).toContain('excludePriorWinners');
  });

  it('defaults excludePriorWinners to true, so the lookback exclusion applies unless explicitly overridden', () => {
    const allFields = flattenRowFields(Top11WinnerDraws.fields);
    const excludeField = allFields.find((field) => field.name === 'excludePriorWinners') as {
      type?: string;
      defaultValue?: boolean;
    };

    expect(excludeField.type).toBe('checkbox');
    expect(excludeField.defaultValue).toBe(true);
  });

  it('restricts create/read to admin/editor and update/delete to admin only', () => {
    const createFn = Top11WinnerDraws.access?.create as (args: {
      req: { user: unknown };
    }) => boolean;
    const readFn = Top11WinnerDraws.access?.read as (args: { req: { user: unknown } }) => boolean;
    const updateFn = Top11WinnerDraws.access?.update as (args: {
      req: { user: unknown };
    }) => boolean;
    const deleteFn = Top11WinnerDraws.access?.delete as (args: {
      req: { user: unknown };
    }) => boolean;

    expect(createFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(createFn({ req: { user: null } })).toBe(false);
    expect(readFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(readFn({ req: { user: null } })).toBe(false);

    expect(updateFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'editor' } } })).toBe(false);
    expect(deleteFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(deleteFn({ req: { user: { role: 'editor' } } })).toBe(false);
  });
});
