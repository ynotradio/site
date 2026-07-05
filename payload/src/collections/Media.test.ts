import { describe, expect, it } from 'vitest';
import { Media } from './Media';
import { flattenRowFields } from './testUtils';

describe('Media', () => {
  it('has the correct slug', () => {
    expect(Media.slug).toBe('media');
  });

  it('has correct labels', () => {
    expect(Media.labels?.singular).toBe('Media File');
    expect(Media.labels?.plural).toBe('Media Files');
  });

  it('uses alt as admin title', () => {
    expect(Media.admin?.useAsTitle).toBe('alt');
  });

  it('is grouped under Content', () => {
    expect(Media.admin?.group).toBe('Content');
  });

  it('has default columns including filename and alt', () => {
    expect(Media.admin?.defaultColumns).toContain('filename');
    expect(Media.admin?.defaultColumns).toContain('alt');
  });

  it('is configured as an upload collection', () => {
    expect(Media.upload).toBeDefined();
  });

  it('accepts only image mime types', () => {
    const upload = Media.upload as { mimeTypes?: string[] };
    expect(upload?.mimeTypes).toContain('image/*');
  });

  it('has thumbnail image size configured', () => {
    const upload = Media.upload as { imageSizes?: Array<{ name: string; width: number; height: number }> };
    const thumbnailSize = upload?.imageSizes?.find((s) => s.name === 'thumbnail');
    expect(thumbnailSize).toBeDefined();
    expect(thumbnailSize?.width).toBe(320);
    expect(thumbnailSize?.height).toBe(240);
  });

  it('has card and hero image sizes', () => {
    const upload = Media.upload as { imageSizes?: Array<{ name: string }> };
    const names = upload?.imageSizes?.map((s) => s.name);
    expect(names).toContain('card');
    expect(names).toContain('hero');
  });

  it('has public read access', () => {
    const readFn = Media.access?.read;
    expect(typeof readFn).toBe('function');
    expect((readFn as () => boolean)()).toBe(true);
  });

  it('requires authenticated user to create', () => {
    const createFn = Media.access?.create as (args: { req: { user: unknown } }) => boolean;
    expect(createFn({ req: { user: null } })).toBe(false);
    expect(createFn({ req: { user: { id: 1, role: 'editor' } } })).toBe(true);
  });

  it('requires admin or editor role to update', () => {
    const updateFn = Media.access?.update as (args: { req: { user: unknown } }) => boolean;
    expect(updateFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'readonly' } } })).toBe(false);
    expect(updateFn({ req: { user: null } })).toBe(false);
  });

  it('requires admin or editor role to delete', () => {
    const deleteFn = Media.access?.delete as (args: { req: { user: unknown } }) => boolean;
    expect(deleteFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(deleteFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(deleteFn({ req: { user: { role: 'readonly' } } })).toBe(false);
    expect(deleteFn({ req: { user: null } })).toBe(false);
  });

  it('has alt as a required text field', () => {
    const allFields = flattenRowFields(Media.fields);
    const altField = allFields.find((f) => f.name === 'alt');
    expect(altField?.type).toBe('text');
    expect(altField?.required).toBe(true);
  });

  it('has caption field', () => {
    const allFields = flattenRowFields(Media.fields);
    const captionField = allFields.find((f) => f.name === 'caption');
    expect(captionField?.type).toBe('text');
  });

  it('has legacyId as a unique number', () => {
    const allFields = flattenRowFields(Media.fields);
    const legacyIdField = allFields.find((f) => f.name === 'legacyId');
    expect(legacyIdField?.type).toBe('number');
    expect(legacyIdField?.unique).toBe(true);
  });

  it('has timestamps enabled', () => {
    expect(Media.timestamps).toBe(true);
  });
});
