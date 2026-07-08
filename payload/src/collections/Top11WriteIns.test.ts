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

  it('permits public write-in creation and restricts read to managers', () => {
    const createFn = Top11WriteIns.access?.create as () => boolean;
    const readFn = Top11WriteIns.access?.read as (args: { req: { user: unknown } }) => boolean;

    expect(createFn()).toBe(true);
    expect(readFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(readFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(readFn({ req: { user: null } })).toBe(false);
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
