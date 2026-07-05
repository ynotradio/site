import { describe, expect, it } from 'vitest';
import { People } from './People';
import { flattenRowFields } from './testUtils';

describe('People', () => {
  it('has the correct slug', () => {
    expect(People.slug).toBe('people');
  });

  it('has correct labels', () => {
    expect(People.labels?.singular).toBe('Person');
    expect(People.labels?.plural).toBe('People');
  });

  it('uses name as admin title', () => {
    expect(People.admin?.useAsTitle).toBe('name');
  });

  it('is grouped under People', () => {
    expect(People.admin?.group).toBe('People');
  });

  it('has default columns including name and photo', () => {
    expect(People.admin?.defaultColumns).toContain('name');
    expect(People.admin?.defaultColumns).toContain('photo');
    expect(People.admin?.defaultColumns).toContain('slug');
  });

  it('has public read access', () => {
    const readFn = People.access?.read;
    expect(typeof readFn).toBe('function');
    expect((readFn as () => boolean)()).toBe(true);
  });

  it('requires authenticated user to create', () => {
    const createFn = People.access?.create as (args: { req: { user: unknown } }) => boolean;
    expect(createFn({ req: { user: null } })).toBe(false);
    expect(createFn({ req: { user: { id: 1, role: 'editor' } } })).toBe(true);
  });

  it('requires admin or editor role to update', () => {
    const updateFn = People.access?.update as (args: { req: { user: unknown } }) => boolean;
    expect(updateFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'dj' } } })).toBe(false);
    expect(updateFn({ req: { user: null } })).toBe(false);
  });

  it('requires admin role to delete', () => {
    const deleteFn = People.access?.delete as (args: { req: { user: unknown } }) => boolean;
    expect(deleteFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(deleteFn({ req: { user: { role: 'editor' } } })).toBe(false);
    expect(deleteFn({ req: { user: null } })).toBe(false);
  });

  it('has name as a required indexed field', () => {
    const allFields = flattenRowFields(People.fields);
    const nameField = allFields.find((f) => f.name === 'name');
    expect(nameField?.type).toBe('text');
    expect(nameField?.required).toBe(true);
    expect(nameField?.index).toBe(true);
  });

  it('has photo as an upload to media', () => {
    const allFields = flattenRowFields(People.fields);
    const photoField = allFields.find((f) => f.name === 'photo');
    expect(photoField?.type).toBe('upload');
    expect(photoField?.relationTo).toBe('media');
  });

  it('has djRecord as a relationship to djs', () => {
    const allFields = flattenRowFields(People.fields);
    const djField = allFields.find((f) => f.name === 'djRecord');
    expect(djField?.type).toBe('relationship');
    expect(djField?.relationTo).toBe('djs');
  });

  it('has legacyId as a unique number', () => {
    const allFields = flattenRowFields(People.fields);
    const legacyIdField = allFields.find((f) => f.name === 'legacyId');
    expect(legacyIdField?.type).toBe('number');
    expect(legacyIdField?.unique).toBe(true);
  });

  it('has timestamps enabled', () => {
    expect(People.timestamps).toBe(true);
  });
});
