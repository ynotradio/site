import { describe, expect, it } from 'vitest';
import { Ads } from './Ads';
import { flattenRowFields } from './testUtils';

describe('Ads', () => {
  it('has the correct slug', () => {
    expect(Ads.slug).toBe('ads');
  });

  it('has correct labels', () => {
    expect(Ads.labels?.singular).toBe('Advertisement');
    expect(Ads.labels?.plural).toBe('Advertisements');
  });

  it('uses name as admin title', () => {
    expect(Ads.admin?.useAsTitle).toBe('name');
  });

  it('is grouped under Marketing', () => {
    expect(Ads.admin?.group).toBe('Marketing');
  });

  it('has default columns including _status', () => {
    expect(Ads.admin?.defaultColumns).toContain('_status');
    expect(Ads.admin?.defaultColumns).toContain('name');
  });

  it('has drafts enabled', () => {
    expect((Ads.versions as { drafts?: boolean })?.drafts).toBe(true);
  });

  it('sorts by startDate descending then priority descending', () => {
    expect(Ads.defaultSort).toEqual(['-startDate', '-priority']);
  });

  it('has public read access', () => {
    const readFn = Ads.access?.read;
    expect(typeof readFn).toBe('function');
    expect((readFn as () => boolean)()).toBe(true);
  });

  it('requires authenticated user to create', () => {
    const createFn = Ads.access?.create as (args: { req: { user: unknown } }) => boolean;
    expect(createFn({ req: { user: null } })).toBe(false);
    expect(createFn({ req: { user: { id: 1, role: 'editor' } } })).toBe(true);
  });

  it('requires admin or editor role to update', () => {
    const updateFn = Ads.access?.update as (args: { req: { user: unknown } }) => boolean;
    expect(updateFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'readonly' } } })).toBe(false);
    expect(updateFn({ req: { user: null } })).toBe(false);
  });

  it('requires admin or editor role to delete', () => {
    const deleteFn = Ads.access?.delete as (args: { req: { user: unknown } }) => boolean;
    expect(deleteFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(deleteFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(deleteFn({ req: { user: null } })).toBe(false);
  });

  it('has name as a required field', () => {
    const allFields = flattenRowFields(Ads.fields);
    const nameField = allFields.find((f) => f.name === 'name');
    expect(nameField).toBeDefined();
    expect(nameField?.required).toBe(true);
  });

  it('has startDate and endDate as required date fields', () => {
    const allFields = flattenRowFields(Ads.fields);
    const startDate = allFields.find((f) => f.name === 'startDate');
    const endDate = allFields.find((f) => f.name === 'endDate');
    expect(startDate?.type).toBe('date');
    expect(startDate?.required).toBe(true);
    expect(endDate?.type).toBe('date');
    expect(endDate?.required).toBe(true);
  });

  it('has image as an upload to media', () => {
    const allFields = flattenRowFields(Ads.fields);
    const imageField = allFields.find((f) => f.name === 'image');
    expect(imageField?.type).toBe('upload');
    expect(imageField?.relationTo).toBe('media');
  });

  it('has priority field with default of 0', () => {
    const allFields = flattenRowFields(Ads.fields);
    const priorityField = allFields.find((f) => f.name === 'priority');
    expect(priorityField?.type).toBe('number');
    expect(priorityField?.defaultValue).toBe(0);
  });

  it('has webUrl field', () => {
    const allFields = flattenRowFields(Ads.fields);
    const webUrlField = allFields.find((f) => f.name === 'webUrl');
    expect(webUrlField?.type).toBe('text');
  });

  it('has legacyId as a unique number', () => {
    const allFields = flattenRowFields(Ads.fields);
    const legacyIdField = allFields.find((f) => f.name === 'legacyId');
    expect(legacyIdField?.type).toBe('number');
    expect(legacyIdField?.unique).toBe(true);
  });

  it('has timestamps enabled', () => {
    expect(Ads.timestamps).toBe(true);
  });
});
