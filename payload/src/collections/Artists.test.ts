import { describe, expect, it } from 'vitest';
import { Artists } from './Artists';
import { preventDuplicateArtistName } from './hooks/artistDedup';
import { flattenRowFields } from './testUtils';

describe('Artists', () => {
  it('has the correct slug', () => {
    expect(Artists.slug).toBe('artists');
  });

  it('uses name as admin title', () => {
    expect(Artists.admin?.useAsTitle).toBe('name');
  });

  it('is grouped under Music', () => {
    expect(Artists.admin?.group).toBe('Music');
  });

  it('sorts by name by default', () => {
    expect(Artists.defaultSort).toBe('name');
  });

  it('has timestamps enabled', () => {
    expect(Artists.timestamps).toBe(true);
  });

  it('has public read access', () => {
    const readFn = Artists.access?.read as () => boolean;
    expect(readFn()).toBe(true);
  });

  it('requires authentication to create', () => {
    const createFn = Artists.access?.create as (args: { req: { user: unknown } }) => boolean;
    expect(createFn({ req: { user: null } })).toBe(false);
    expect(createFn({ req: { user: { id: '1' } } })).toBe(true);
  });

  it('allows admin and editor to update', () => {
    const updateFn = Artists.access?.update as (args: { req: { user: unknown } }) => boolean;
    expect(updateFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'dj' } } })).toBe(false);
    expect(updateFn({ req: { user: null } })).toBe(false);
  });

  it('allows admin and editor to delete', () => {
    const deleteFn = Artists.access?.delete as (args: { req: { user: unknown } }) => boolean;
    expect(deleteFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(deleteFn({ req: { user: { role: 'editor' } } })).toBe(true);
  });

  it('has name as a required text field with index', () => {
    const fields = flattenRowFields(Artists.fields as Record<string, unknown>[]);
    const nameField = fields.find((f) => f.name === 'name');
    expect(nameField?.type).toBe('text');
    expect(nameField?.required).toBe(true);
    expect(nameField?.index).toBe(true);
  });

  it('has photo as an upload relationship to media', () => {
    const fields = flattenRowFields(Artists.fields as Record<string, unknown>[]);
    const photoField = fields.find((f) => f.name === 'photo');
    expect(photoField?.type).toBe('upload');
    expect(photoField?.relationTo).toBe('media');
  });

  it('has members as a hasMany relationship to people', () => {
    const fields = flattenRowFields(Artists.fields as Record<string, unknown>[]);
    const membersField = fields.find((f) => f.name === 'members');
    expect(membersField?.type).toBe('relationship');
    expect(membersField?.relationTo).toBe('people');
    expect(membersField?.hasMany).toBe(true);
  });

  it('has musicbrainzId as a unique text field', () => {
    const fields = flattenRowFields(Artists.fields as Record<string, unknown>[]);
    const mbzField = fields.find((f) => f.name === 'musicbrainzId');
    expect(mbzField?.type).toBe('text');
    expect(mbzField?.unique).toBe(true);
  });

  it('shows all expected columns by default', () => {
    expect(Artists.admin?.defaultColumns).toContain('name');
    expect(Artists.admin?.defaultColumns).toContain('photo');
    expect(Artists.admin?.defaultColumns).toContain('musicbrainzId');
    expect(Artists.admin?.defaultColumns).toContain('slug');
  });

  it('registers the duplicate-name guard as a beforeValidate hook', () => {
    expect(Artists.hooks?.beforeValidate).toContain(preventDuplicateArtistName);
  });
});
