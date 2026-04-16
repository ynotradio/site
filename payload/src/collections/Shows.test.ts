import { describe, expect, it } from 'vitest';
import { Shows } from './Shows';
import { flattenRowFields } from './testUtils';

describe('Shows', () => {
  it('has the correct slug', () => {
    expect(Shows.slug).toBe('shows');
  });

  it('uses date as admin title', () => {
    expect(Shows.admin?.useAsTitle).toBe('date');
  });

  it('is grouped under Radio', () => {
    expect(Shows.admin?.group).toBe('Radio');
  });

  it('sorts by date descending by default', () => {
    expect(Shows.defaultSort).toBe('-date');
  });

  it('has timestamps enabled', () => {
    expect(Shows.timestamps).toBe(true);
  });

  it('has public read access', () => {
    const readFn = Shows.access?.read as () => boolean;
    expect(readFn()).toBe(true);
  });

  it('requires authentication to create', () => {
    const createFn = Shows.access?.create as (args: { req: { user: unknown } }) => boolean;
    expect(createFn({ req: { user: null } })).toBe(false);
    expect(createFn({ req: { user: { id: '1' } } })).toBe(true);
  });

  it('allows admin, editor, and dj to update', () => {
    const updateFn = Shows.access?.update as (args: { req: { user: unknown } }) => boolean;
    expect(updateFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'dj' } } })).toBe(true);
    expect(updateFn({ req: { user: null } })).toBe(false);
  });

  it('allows only admin to delete', () => {
    const deleteFn = Shows.access?.delete as (args: { req: { user: unknown } }) => boolean;
    expect(deleteFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(deleteFn({ req: { user: { role: 'editor' } } })).toBe(false);
    expect(deleteFn({ req: { user: { role: 'dj' } } })).toBe(false);
  });

  it('has date as a required date field with index', () => {
    const fields = flattenRowFields(Shows.fields as Record<string, unknown>[]);
    const dateField = fields.find((f) => f.name === 'date');
    expect(dateField?.type).toBe('date');
    expect(dateField?.required).toBe(true);
    expect(dateField?.index).toBe(true);
  });

  it('has startTime and endTime as required text fields', () => {
    const fields = flattenRowFields(Shows.fields as Record<string, unknown>[]);
    const startTime = fields.find((f) => f.name === 'startTime');
    const endTime = fields.find((f) => f.name === 'endTime');
    expect(startTime?.type).toBe('text');
    expect(startTime?.required).toBe(true);
    expect(endTime?.type).toBe('text');
    expect(endTime?.required).toBe(true);
  });

  it('has host as a relationship to djs', () => {
    const fields = flattenRowFields(Shows.fields as Record<string, unknown>[]);
    const hostField = fields.find((f) => f.name === 'host');
    expect(hostField?.type).toBe('relationship');
    expect(hostField?.relationTo).toBe('djs');
  });

  it('has legacyId as a unique number field', () => {
    const fields = flattenRowFields(Shows.fields as Record<string, unknown>[]);
    const legacyField = fields.find((f) => f.name === 'legacyId');
    expect(legacyField?.type).toBe('number');
    expect(legacyField?.unique).toBe(true);
  });

  it('shows the Show Cloner in the before-list slot', () => {
    const components = Shows.admin?.components as Record<string, unknown> | undefined;
    expect(components?.beforeList).toEqual(
      expect.arrayContaining([
        expect.stringContaining('ShowsListHeader'),
      ]),
    );
  });

  it('shows all expected default columns', () => {
    expect(Shows.admin?.defaultColumns).toContain('date');
    expect(Shows.admin?.defaultColumns).toContain('startTime');
    expect(Shows.admin?.defaultColumns).toContain('endTime');
    expect(Shows.admin?.defaultColumns).toContain('host');
  });
});
