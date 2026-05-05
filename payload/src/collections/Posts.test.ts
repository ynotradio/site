import { describe, expect, it, vi } from 'vitest';
import { Posts } from './Posts';
import { flattenRowFields } from './testUtils';

vi.mock('@payloadcms/richtext-lexical', () => ({
  lexicalEditor: vi.fn((config) => ({ _type: 'lexical', _config: config })),
  BlocksFeature: vi.fn((config) => ({ _type: 'blocks', ...config })),
}));

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

  it('uses postSlugify for slug generation', () => {
    const fields = flattenRowFields(Posts.fields as Record<string, unknown>[]);
    const slugField = fields.find((f) => f.name === 'slug') as {
      custom?: { slugify?: unknown };
    };
    expect(typeof slugField?.custom?.slugify).toBe('function');
  });

  it('exposes generateSlug checkbox companion to the slug field', () => {
    const fields = flattenRowFields(Posts.fields as Record<string, unknown>[]);
    const checkbox = fields.find((f) => f.name === 'generateSlug') as { type?: string };
    expect(checkbox?.type).toBe('checkbox');
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

  it('configures content field editor with EmbedFeature appended to default features', () => {
    const fields = flattenRowFields(Posts.fields as Record<string, unknown>[]);
    const contentField = fields.find((f) => f.name === 'content') as {
      editor?: { _config?: { features?: (args: { defaultFeatures: unknown[] }) => unknown[] } };
    };

    // eslint-disable-next-line no-underscore-dangle -- Payload uses `_config` internally
    const featuresCallback = contentField?.editor?._config?.features;
    expect(typeof featuresCallback).toBe('function');

    const mockDefaultFeatures = [{ id: 'paragraph' }, { id: 'text' }];
    const result = featuresCallback!({ defaultFeatures: mockDefaultFeatures });

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ id: 'paragraph' });
    expect(result[1]).toEqual({ id: 'text' });
    // EmbedFeature() is the third entry (BlocksFeature mock returns { _type: 'blocks', ... })
    expect((result[2] as any)._type).toBe('blocks');
  });
});
