import { describe, expect, it } from 'vitest';
import { Songs } from './Songs';
import { flattenRowFields } from './testUtils';

describe('Songs', () => {
  it('has the correct slug', () => {
    expect(Songs.slug).toBe('songs');
  });

  it('uses displayName as admin title', () => {
    expect(Songs.admin?.useAsTitle).toBe('displayName');
  });

  it('is grouped under Music', () => {
    expect(Songs.admin?.group).toBe('Music');
  });

  it('sorts by releaseDate descending by default', () => {
    expect(Songs.defaultSort).toBe('-releaseDate');
  });

  it('has timestamps enabled', () => {
    expect(Songs.timestamps).toBe(true);
  });

  it('has public read access', () => {
    const readFn = Songs.access?.read as () => boolean;
    expect(readFn()).toBe(true);
  });

  it('requires authentication to create', () => {
    const createFn = Songs.access?.create as (args: { req: { user: unknown } }) => boolean;
    expect(createFn({ req: { user: null } })).toBe(false);
    expect(createFn({ req: { user: { id: '1' } } })).toBe(true);
  });

  it('allows admin and editor to update', () => {
    const updateFn = Songs.access?.update as (args: { req: { user: unknown } }) => boolean;
    expect(updateFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'dj' } } })).toBe(false);
    expect(updateFn({ req: { user: null } })).toBe(false);
  });

  it('allows admin and editor to delete', () => {
    const deleteFn = Songs.access?.delete as (args: { req: { user: unknown } }) => boolean;
    expect(deleteFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(deleteFn({ req: { user: { role: 'editor' } } })).toBe(true);
  });

  it('has title as a required text field with index', () => {
    const fields = flattenRowFields(Songs.fields as Record<string, unknown>[]);
    const titleField = fields.find((f) => f.name === 'title');
    expect(titleField?.type).toBe('text');
    expect(titleField?.required).toBe(true);
    expect(titleField?.index).toBe(true);
  });

  it('has artist as a relationship to artists', () => {
    const fields = flattenRowFields(Songs.fields as Record<string, unknown>[]);
    const artistField = fields.find((f) => f.name === 'artist');
    expect(artistField?.type).toBe('relationship');
    expect(artistField?.relationTo).toBe('artists');
  });

  it('has releaseDate as a date field', () => {
    const fields = flattenRowFields(Songs.fields as Record<string, unknown>[]);
    const releaseDateField = fields.find((f) => f.name === 'releaseDate');
    expect(releaseDateField?.type).toBe('date');
  });

  it('has featureOnNewMusic as a checkbox defaulting to false', () => {
    const fields = flattenRowFields(Songs.fields as Record<string, unknown>[]);
    const featureField = fields.find((f) => f.name === 'featureOnNewMusic');
    expect(featureField?.type).toBe('checkbox');
    expect(featureField?.defaultValue).toBe(false);
  });

  it('has musicbrainzId as a unique text field', () => {
    const fields = flattenRowFields(Songs.fields as Record<string, unknown>[]);
    const mbzField = fields.find((f) => f.name === 'musicbrainzId');
    expect(mbzField?.type).toBe('text');
    expect(mbzField?.unique).toBe(true);
  });

  it('has streamUrl as a text field', () => {
    const fields = flattenRowFields(Songs.fields as Record<string, unknown>[]);
    const streamUrlField = fields.find((f) => f.name === 'streamUrl');
    expect(streamUrlField?.type).toBe('text');
  });

  it('has legacyId as a unique number field', () => {
    const fields = flattenRowFields(Songs.fields as Record<string, unknown>[]);
    const legacyField = fields.find((f) => f.name === 'legacyId');
    expect(legacyField?.type).toBe('number');
    expect(legacyField?.unique).toBe(true);
  });

  it('shows all expected default columns', () => {
    expect(Songs.admin?.defaultColumns).toContain('displayName');
    expect(Songs.admin?.defaultColumns).toContain('artist');
    expect(Songs.admin?.defaultColumns).toContain('featureOnNewMusic');
  });
});
