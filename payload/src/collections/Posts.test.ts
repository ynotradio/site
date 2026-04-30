import { describe, expect, it } from 'vitest';
import { Posts } from './Posts';
import { flattenRowFields } from './testUtils';

describe('Posts', () => {
  it('has the correct slug', () => {
    expect(Posts.slug).toBe('posts');
  });

  it('has correct labels', () => {
    expect(Posts.labels?.singular).toBe('Story');
    expect(Posts.labels?.plural).toBe('Stories');
  });

  it('uses headline as admin title', () => {
    expect(Posts.admin?.useAsTitle).toBe('headline');
  });

  it('is grouped under Content', () => {
    expect(Posts.admin?.group).toBe('Content');
  });

  it('has drafts enabled', () => {
    expect((Posts.versions as { drafts?: boolean })?.drafts).toBe(true);
  });

  it('has timestamps enabled', () => {
    expect(Posts.timestamps).toBe(true);
  });

  it('has public read access', () => {
    const readFn = Posts.access?.read as () => boolean;
    expect(readFn()).toBe(true);
  });

  it('requires authentication to create', () => {
    const createFn = Posts.access?.create as (args: { req: { user: unknown } }) => boolean;
    expect(createFn({ req: { user: null } })).toBe(false);
    expect(createFn({ req: { user: { id: '1' } } })).toBe(true);
  });

  it('allows admin and editor to update', () => {
    const updateFn = Posts.access?.update as (args: { req: { user: unknown } }) => boolean;
    expect(updateFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'dj' } } })).toBe(false);
    expect(updateFn({ req: { user: null } })).toBe(false);
  });

  it('allows only admin to delete', () => {
    const deleteFn = Posts.access?.delete as (args: { req: { user: unknown } }) => boolean;
    expect(deleteFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(deleteFn({ req: { user: { role: 'editor' } } })).toBe(false);
  });

  it('has headline as a required text field', () => {
    const fields = flattenRowFields(Posts.fields as Record<string, unknown>[]);
    const headlineField = fields.find((f) => f.name === 'headline') as {
      type?: string;
      required?: boolean;
      maxLength?: number;
    };
    expect(headlineField?.type).toBe('text');
    expect(headlineField?.required).toBe(true);
    expect(headlineField?.maxLength).toBe(100);
  });

  it('has slug as a required unique text field', () => {
    const fields = flattenRowFields(Posts.fields as Record<string, unknown>[]);
    const slugField = fields.find((f) => f.name === 'slug');
    expect(slugField?.type).toBe('text');
    expect(slugField?.required).toBe(true);
    expect(slugField?.unique).toBe(true);
    expect(slugField?.index).toBe(true);
  });

  it('auto-generates slug from headline and startDate on create', () => {
    const fields = flattenRowFields(Posts.fields as Record<string, unknown>[]);
    const slugField = fields.find((f) => f.name === 'slug') as {
      hooks?: { beforeValidate?: Function[] };
    };
    const hookFn = slugField?.hooks?.beforeValidate?.[0];
    expect(typeof hookFn).toBe('function');

    // Auto-generates slug with date prefix on create when value is empty
    const result = hookFn?.({
      data: { headline: 'Hello World', startDate: '2025-01-15T00:00:00.000Z' },
      operation: 'create',
      value: undefined,
    });
    expect(result).toMatch(/^2025-01-15--hello-world/);

    // Does not override existing value
    const existing = hookFn?.({
      data: { headline: 'Hello World' },
      operation: 'create',
      value: 'existing-slug',
    });
    expect(existing).toBe('existing-slug');

    // Does not auto-generate on update
    const update = hookFn?.({
      data: { headline: 'Hello World' },
      operation: 'update',
      value: undefined,
    });
    expect(update).toBeUndefined();

    // Handles missing headline
    const noHeadline = hookFn?.({
      data: {},
      operation: 'create',
      value: undefined,
    });
    expect(noHeadline).toBeUndefined();
  });

  it('generates slug without date prefix when startDate is absent', () => {
    const fields = flattenRowFields(Posts.fields as Record<string, unknown>[]);
    const slugField = fields.find((f) => f.name === 'slug') as {
      hooks?: { beforeValidate?: Function[] };
    };
    const hookFn = slugField?.hooks?.beforeValidate?.[0];

    const result = hookFn?.({
      data: { headline: 'No Date Post' },
      operation: 'create',
      value: undefined,
    });
    expect(result).toBe('no-date-post');
  });

  it('has startDate as a required date field', () => {
    const fields = flattenRowFields(Posts.fields as Record<string, unknown>[]);
    const startDate = fields.find((f) => f.name === 'startDate');
    expect(startDate?.type).toBe('date');
    expect(startDate?.required).toBe(true);
  });

  it('has endDate as a required date field', () => {
    const fields = flattenRowFields(Posts.fields as Record<string, unknown>[]);
    const endDate = fields.find((f) => f.name === 'endDate');
    expect(endDate?.type).toBe('date');
    expect(endDate?.required).toBe(true);
  });

  it('has showOnFrontPage as a checkbox defaulting to true', () => {
    const fields = flattenRowFields(Posts.fields as Record<string, unknown>[]);
    const showField = fields.find((f) => f.name === 'showOnFrontPage');
    expect(showField?.type).toBe('checkbox');
    expect(showField?.defaultValue).toBe(true);
  });

  it('has priority as a number field defaulting to 0', () => {
    const fields = flattenRowFields(Posts.fields as Record<string, unknown>[]);
    const priorityField = fields.find((f) => f.name === 'priority');
    expect(priorityField?.type).toBe('number');
    expect(priorityField?.defaultValue).toBe(0);
  });

  it('has content as a richText field', () => {
    const fields = flattenRowFields(Posts.fields as Record<string, unknown>[]);
    const contentField = fields.find((f) => f.name === 'content');
    expect(contentField?.type).toBe('richText');
    expect(contentField?.required).toBe(true);
  });

  it('has legacyId as a unique number field', () => {
    const fields = flattenRowFields(Posts.fields as Record<string, unknown>[]);
    const legacyField = fields.find((f) => f.name === 'legacyId');
    expect(legacyField?.type).toBe('number');
    expect(legacyField?.unique).toBe(true);
  });

  it('has expected default columns', () => {
    expect(Posts.admin?.defaultColumns).toContain('headline');
    expect(Posts.admin?.defaultColumns).toContain('startDate');
    expect(Posts.admin?.defaultColumns).toContain('endDate');
    expect(Posts.admin?.defaultColumns).toContain('_status');
  });

  it('includes headline and slug in listSearchableFields', () => {
    expect(Posts.admin?.listSearchableFields).toContain('headline');
    expect(Posts.admin?.listSearchableFields).toContain('slug');
  });
});
