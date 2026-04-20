import { describe, expect, it } from 'vitest';
import { Concerts } from './Concerts';
import { flattenRowFields } from './testUtils';

describe('Concerts', () => {
  it('has the correct slug', () => {
    expect(Concerts.slug).toBe('concerts');
  });

  it('has correct labels', () => {
    expect(Concerts.labels?.singular).toBe('Concert');
    expect(Concerts.labels?.plural).toBe('Concerts');
  });

  it('uses title as admin title', () => {
    expect(Concerts.admin?.useAsTitle).toBe('title');
  });

  it('is grouped under Events', () => {
    expect(Concerts.admin?.group).toBe('Events');
  });

  it('has default columns including date and venue', () => {
    expect(Concerts.admin?.defaultColumns).toContain('date');
    expect(Concerts.admin?.defaultColumns).toContain('venue');
    expect(Concerts.admin?.defaultColumns).toContain('_status');
  });

  it('has drafts enabled', () => {
    expect((Concerts.versions as { drafts?: boolean })?.drafts).toBe(true);
  });

  it('sorts by date descending', () => {
    expect(Concerts.defaultSort).toBe('-date');
  });

  it('has public read access', () => {
    const readFn = Concerts.access?.read;
    expect(typeof readFn).toBe('function');
    expect((readFn as () => boolean)()).toBe(true);
  });

  it('requires authenticated user to create', () => {
    const createFn = Concerts.access?.create as (args: { req: { user: unknown } }) => boolean;
    expect(createFn({ req: { user: null } })).toBe(false);
    expect(createFn({ req: { user: { id: 1, role: 'editor' } } })).toBe(true);
  });

  it('requires admin or editor role to update', () => {
    const updateFn = Concerts.access?.update as (args: { req: { user: unknown } }) => boolean;
    expect(updateFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'readonly' } } })).toBe(false);
    expect(updateFn({ req: { user: null } })).toBe(false);
  });

  it('requires admin role to delete', () => {
    const deleteFn = Concerts.access?.delete as (args: { req: { user: unknown } }) => boolean;
    expect(deleteFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(deleteFn({ req: { user: { role: 'editor' } } })).toBe(false);
    expect(deleteFn({ req: { user: null } })).toBe(false);
  });

  it('has date as a required indexed field', () => {
    const allFields = flattenRowFields(Concerts.fields);
    const dateField = allFields.find((f) => f.name === 'date');
    expect(dateField?.type).toBe('date');
    expect(dateField?.required).toBe(true);
    expect(dateField?.index).toBe(true);
  });

  it('has artists as a required hasMany relationship to artists', () => {
    const allFields = flattenRowFields(Concerts.fields);
    const artistsField = allFields.find((f) => f.name === 'artists');
    expect(artistsField?.type).toBe('relationship');
    expect(artistsField?.relationTo).toBe('artists');
    expect(artistsField?.hasMany).toBe(true);
    expect(artistsField?.required).toBe(true);
  });

  it('has venue as a required relationship to venues', () => {
    const allFields = flattenRowFields(Concerts.fields);
    const venueField = allFields.find((f) => f.name === 'venue');
    expect(venueField?.type).toBe('relationship');
    expect(venueField?.relationTo).toBe('venues');
    expect(venueField?.required).toBe(true);
  });

  it('has title as an optional text field', () => {
    const allFields = flattenRowFields(Concerts.fields);
    const titleField = allFields.find((f) => f.name === 'title');
    expect(titleField?.type).toBe('text');
    expect(titleField?.required).toBeFalsy();
  });

  it('has featured checkbox with default false', () => {
    const allFields = flattenRowFields(Concerts.fields);
    const featuredField = allFields.find((f) => f.name === 'featured');
    expect(featuredField?.type).toBe('checkbox');
    expect(featuredField?.defaultValue).toBe(false);
  });

  it('has ticketUrl field', () => {
    const allFields = flattenRowFields(Concerts.fields);
    const ticketUrlField = allFields.find((f) => f.name === 'ticketUrl');
    expect(ticketUrlField?.type).toBe('text');
  });

  it('has legacyId as a unique number', () => {
    const allFields = flattenRowFields(Concerts.fields);
    const legacyIdField = allFields.find((f) => f.name === 'legacyId');
    expect(legacyIdField?.type).toBe('number');
    expect(legacyIdField?.unique).toBe(true);
  });

  it('has timestamps enabled', () => {
    expect(Concerts.timestamps).toBe(true);
  });
});
