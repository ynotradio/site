import { describe, expect, it } from 'vitest';
import { DJs } from './DJs';
import { flattenRowFields } from './testUtils';

describe('DJs', () => {
  it('has the correct slug', () => {
    expect(DJs.slug).toBe('djs');
  });

  it('uses displayName as admin title', () => {
    expect(DJs.admin?.useAsTitle).toBe('displayName');
  });

  it('is grouped under Radio', () => {
    expect(DJs.admin?.group).toBe('Radio');
  });

  it('sorts by sortOrder by default', () => {
    expect(DJs.defaultSort).toBe('sortOrder');
  });

  it('has timestamps enabled', () => {
    expect(DJs.timestamps).toBe(true);
  });

  it('has drafts enabled', () => {
    expect((DJs.versions as Record<string, unknown>)?.drafts).toBe(true);
  });

  it('has public read access', () => {
    const readFn = DJs.access?.read as () => boolean;
    expect(readFn()).toBe(true);
  });

  it('requires authentication to create', () => {
    const createFn = DJs.access?.create as (args: { req: { user: unknown } }) => boolean;
    expect(createFn({ req: { user: null } })).toBe(false);
    expect(createFn({ req: { user: { id: '1' } } })).toBe(true);
  });

  it('allows admin, editor, and dj to update', () => {
    const updateFn = DJs.access?.update as (args: { req: { user: unknown } }) => boolean;
    expect(updateFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'dj' } } })).toBe(true);
    expect(updateFn({ req: { user: null } })).toBe(false);
  });

  it('allows admin and editor to delete', () => {
    const deleteFn = DJs.access?.delete as (args: { req: { user: unknown } }) => boolean;
    expect(deleteFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(deleteFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(deleteFn({ req: { user: { role: 'dj' } } })).toBe(false);
  });

  it('has displayName as an editable sidebar field', () => {
    const fields = flattenRowFields(DJs.fields as Record<string, unknown>[]);
    const displayNameField = fields.find((f) => f.name === 'displayName');
    expect(displayNameField?.type).toBe('text');
    expect((displayNameField?.admin as Record<string, unknown>)?.position).toBe('sidebar');
    expect((displayNameField?.admin as Record<string, unknown>)?.readOnly).toBeUndefined();
  });

  it('has person as a hasMany relationship to people', () => {
    const fields = flattenRowFields(DJs.fields as Record<string, unknown>[]);
    const personField = fields.find((f) => f.name === 'person');
    expect(personField?.type).toBe('relationship');
    expect(personField?.relationTo).toBe('people');
    expect(personField?.hasMany).toBe(true);
  });

  it('has photo as an upload relationship to media', () => {
    const fields = flattenRowFields(DJs.fields as Record<string, unknown>[]);
    const photoField = fields.find((f) => f.name === 'photo');
    expect(photoField?.type).toBe('upload');
    expect(photoField?.relationTo).toBe('media');
  });

  it('has onAir checkbox defaulting to true', () => {
    const fields = flattenRowFields(DJs.fields as Record<string, unknown>[]);
    const onAirField = fields.find((f) => f.name === 'onAir');
    expect(onAirField?.type).toBe('checkbox');
    expect(onAirField?.defaultValue).toBe(true);
  });

  it('has sortOrder as a number field', () => {
    const fields = flattenRowFields(DJs.fields as Record<string, unknown>[]);
    const sortOrderField = fields.find((f) => f.name === 'sortOrder');
    expect(sortOrderField?.type).toBe('number');
  });

  it('has legacyId as a unique number field', () => {
    const fields = flattenRowFields(DJs.fields as Record<string, unknown>[]);
    const legacyField = fields.find((f) => f.name === 'legacyId');
    expect(legacyField?.type).toBe('number');
    expect(legacyField?.unique).toBe(true);
  });

  it('shows the DJ Order tool in the before-list slot', () => {
    const components = DJs.admin?.components as Record<string, unknown> | undefined;
    expect(components?.beforeList).toEqual(
      expect.arrayContaining([expect.stringContaining('DJsListHeader')]),
    );
  });

  it('shows all expected default columns', () => {
    expect(DJs.admin?.defaultColumns).toContain('displayName');
    expect(DJs.admin?.defaultColumns).toContain('photo');
    expect(DJs.admin?.defaultColumns).toContain('onAir');
    expect(DJs.admin?.defaultColumns).toContain('sortOrder');
  });
});
