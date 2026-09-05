import { describe, expect, it } from 'vitest';
import { Records } from './Records';
import { flattenRowFields } from './testUtils';

describe('Records', () => {
  it('has the correct slug', () => {
    expect(Records.slug).toBe('records');
  });

  it('has correct labels', () => {
    expect(Records.labels?.singular).toBe('Record');
    expect(Records.labels?.plural).toBe('Records');
  });

  it('uses displayName as admin title', () => {
    expect(Records.admin?.useAsTitle).toBe('displayName');
  });

  it('is grouped under Music', () => {
    expect(Records.admin?.group).toBe('Music');
  });

  it('sorts by releaseDate descending by default', () => {
    expect(Records.defaultSort).toBe('-releaseDate');
  });

  it('has timestamps enabled', () => {
    expect(Records.timestamps).toBe(true);
  });

  it('has public read access', () => {
    const readFn = Records.access?.read as () => boolean;
    expect(readFn()).toBe(true);
  });

  it('requires authentication to create', () => {
    const createFn = Records.access?.create as (args: { req: { user: unknown } }) => boolean;
    expect(createFn({ req: { user: null } })).toBe(false);
    expect(createFn({ req: { user: { id: '1' } } })).toBe(true);
  });

  it('allows admin and editor to update', () => {
    const updateFn = Records.access?.update as (args: { req: { user: unknown } }) => boolean;
    expect(updateFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'dj' } } })).toBe(false);
    expect(updateFn({ req: { user: null } })).toBe(false);
  });

  it('allows admin and editor to delete', () => {
    const deleteFn = Records.access?.delete as (args: { req: { user: unknown } }) => boolean;
    expect(deleteFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(deleteFn({ req: { user: { role: 'editor' } } })).toBe(true);
  });

  it('has title as a required text field with index', () => {
    const fields = flattenRowFields(Records.fields as Record<string, unknown>[]);
    const titleField = fields.find((f) => f.name === 'title');
    expect(titleField?.type).toBe('text');
    expect(titleField?.required).toBe(true);
    expect(titleField?.index).toBe(true);
  });

  it('has artist as a required relationship to artists', () => {
    const fields = flattenRowFields(Records.fields as Record<string, unknown>[]);
    const artistField = fields.find((f) => f.name === 'artist');
    expect(artistField?.type).toBe('relationship');
    expect(artistField?.relationTo).toBe('artists');
    expect(artistField?.required).toBe(true);
  });

  it('allows creating an artist inline from the record form', () => {
    const fields = flattenRowFields(Records.fields as Record<string, unknown>[]);
    const artistField = fields.find((f) => f.name === 'artist');
    expect((artistField?.admin as { allowCreate?: boolean } | undefined)?.allowCreate).toBe(true);
  });

  it('has label as a text field', () => {
    const fields = flattenRowFields(Records.fields as Record<string, unknown>[]);
    const labelField = fields.find((f) => f.name === 'label');
    expect(labelField?.type).toBe('text');
  });

  it('has releaseDate as a date field', () => {
    const fields = flattenRowFields(Records.fields as Record<string, unknown>[]);
    const releaseDateField = fields.find((f) => f.name === 'releaseDate');
    expect(releaseDateField?.type).toBe('date');
  });

  it('has coverImage as an upload relationship to media', () => {
    const fields = flattenRowFields(Records.fields as Record<string, unknown>[]);
    const coverField = fields.find((f) => f.name === 'coverImage');
    expect(coverField?.type).toBe('upload');
    expect(coverField?.relationTo).toBe('media');
  });

  it('has musicbrainzId as a unique text field', () => {
    const fields = flattenRowFields(Records.fields as Record<string, unknown>[]);
    const mbzField = fields.find((f) => f.name === 'musicbrainzId');
    expect(mbzField?.type).toBe('text');
    expect(mbzField?.unique).toBe(true);
  });

  it('has displayName as a sidebar text field', () => {
    const fields = flattenRowFields(Records.fields as Record<string, unknown>[]);
    const displayField = fields.find((f) => f.name === 'displayName') as {
      type?: string;
      admin?: { position?: string; readOnly?: boolean };
    };
    expect(displayField?.type).toBe('text');
    expect(displayField?.admin?.position).toBe('sidebar');
    expect(displayField?.admin?.readOnly).toBe(true);
  });

  it('has legacyId as a unique number field', () => {
    const fields = flattenRowFields(Records.fields as Record<string, unknown>[]);
    const legacyField = fields.find((f) => f.name === 'legacyId');
    expect(legacyField?.type).toBe('number');
    expect(legacyField?.unique).toBe(true);
  });

  it('has expected default columns', () => {
    expect(Records.admin?.defaultColumns).toContain('displayName');
    expect(Records.admin?.defaultColumns).toContain('artist');
    expect(Records.admin?.defaultColumns).toContain('releaseDate');
  });

  it('has beforeChange hooks for slug generation and display name generation', () => {
    expect(Records.hooks?.beforeChange).toHaveLength(2);
  });
});
