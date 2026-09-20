import { describe, expect, it } from 'vitest';
import { Top11WriteIns } from './Top11WriteIns';
import { flattenRowFields } from './testUtils';

describe('Top11WriteIns', () => {
  it('has expected slug and group', () => {
    expect(Top11WriteIns.slug).toBe('top11-write-ins');
    expect(Top11WriteIns.admin?.group).toBe('Top 11');
  });

  it('contains write-in submission fields', () => {
    const allFields = flattenRowFields(Top11WriteIns.fields);
    const names = allFields.map((field) => field.name);

    expect(names).toContain('contest');
    expect(names).toContain('writeIn');
    expect(names).toContain('voterEmail');
    expect(names).toContain('display');
  });

  it('defaults the moderation display flag to visible', () => {
    const allFields = flattenRowFields(Top11WriteIns.fields);
    const displayField = allFields.find((field) => field.name === 'display') as {
      type?: string;
      defaultValue?: boolean;
    };

    expect(displayField.type).toBe('checkbox');
    expect(displayField.defaultValue).toBe(true);
  });

  it('requires authentication for write-in creation and restricts read to managers', () => {
    const createFn = Top11WriteIns.access?.create as (args: { req: { user: unknown } }) => boolean;
    const readFn = Top11WriteIns.access?.read as (args: { req: { user: unknown } }) => boolean;

    expect(createFn({ req: { user: null } })).toBe(false);
    expect(createFn({ req: { user: { id: 1, email: 'jane@example.com' } } })).toBe(true);
    expect(readFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(readFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(readFn({ req: { user: null } })).toBe(false);
  });

  describe('beforeChange identity validation', () => {
    const beforeChangeHook = Top11WriteIns.hooks?.beforeChange?.[0];

    it('uses the authenticated user email', () => {
      const data = { voterEmail: 'JANE@example.com' };
      const result = beforeChangeHook?.({
        data,
        req: { user: { email: 'Jane@example.com' } },
      } as never);

      expect(result).toMatchObject({ voterEmail: 'jane@example.com' });
    });

    it('rejects an impersonated voter email', () => {
      expect(() => beforeChangeHook?.({
        data: { voterEmail: 'other@example.com' },
        req: { user: { email: 'jane@example.com' } },
      } as never)).toThrow('The voter email must match the authenticated user');
    });
  });

  it('restricts update and delete to admin/editor', () => {
    const updateFn = Top11WriteIns.access?.update as (args: { req: { user: unknown } }) => boolean;
    const deleteFn = Top11WriteIns.access?.delete as (args: { req: { user: unknown } }) => boolean;

    expect(updateFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(updateFn({ req: { user: null } })).toBe(false);
    expect(deleteFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(deleteFn({ req: { user: null } })).toBe(false);
  });
});
