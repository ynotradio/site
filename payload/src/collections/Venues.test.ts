import { describe, expect, it } from 'vitest';
import { Venues } from './Venues';
import { flattenRowFields } from './testUtils';

describe('Venues', () => {
  it('has the correct slug', () => {
    expect(Venues.slug).toBe('venues');
  });

  it('has correct labels', () => {
    expect(Venues.labels?.singular).toBe('Venue');
    expect(Venues.labels?.plural).toBe('Venues');
  });

  it('uses name as admin title', () => {
    expect(Venues.admin?.useAsTitle).toBe('name');
  });

  it('is grouped under Events', () => {
    expect(Venues.admin?.group).toBe('Events');
  });

  it('has default columns including name and city', () => {
    expect(Venues.admin?.defaultColumns).toContain('name');
    expect(Venues.admin?.defaultColumns).toContain('city');
  });

  it('sorts alphabetically by name', () => {
    expect(Venues.defaultSort).toBe('name');
  });

  it('has public read access', () => {
    const readFn = Venues.access?.read;
    expect(typeof readFn).toBe('function');
    expect((readFn as () => boolean)()).toBe(true);
  });

  it('requires authenticated user to create', () => {
    const createFn = Venues.access?.create as (args: { req: { user: unknown } }) => boolean;
    expect(createFn({ req: { user: null } })).toBe(false);
    expect(createFn({ req: { user: { id: 1, role: 'editor' } } })).toBe(true);
  });

  it('requires admin or editor role to update', () => {
    const updateFn = Venues.access?.update as (args: { req: { user: unknown } }) => boolean;
    expect(updateFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'readonly' } } })).toBe(false);
    expect(updateFn({ req: { user: null } })).toBe(false);
  });

  it('requires admin role to delete', () => {
    const deleteFn = Venues.access?.delete as (args: { req: { user: unknown } }) => boolean;
    expect(deleteFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(deleteFn({ req: { user: { role: 'editor' } } })).toBe(false);
    expect(deleteFn({ req: { user: null } })).toBe(false);
  });

  it('has name as a required indexed field', () => {
    const allFields = flattenRowFields(Venues.fields);
    const nameField = allFields.find((f) => f.name === 'name');
    expect(nameField?.type).toBe('text');
    expect(nameField?.required).toBe(true);
    expect(nameField?.index).toBe(true);
  });

  it('has city as an indexed text field', () => {
    const allFields = flattenRowFields(Venues.fields);
    const cityField = allFields.find((f) => f.name === 'city');
    expect(cityField?.type).toBe('text');
    expect(cityField?.index).toBe(true);
  });

  it('has address field', () => {
    const allFields = flattenRowFields(Venues.fields);
    const addressField = allFields.find((f) => f.name === 'address');
    expect(addressField?.type).toBe('text');
  });

  it('has website field', () => {
    const allFields = flattenRowFields(Venues.fields);
    const websiteField = allFields.find((f) => f.name === 'website');
    expect(websiteField?.type).toBe('text');
  });

  it('has timestamps enabled', () => {
    expect(Venues.timestamps).toBe(true);
  });
});
