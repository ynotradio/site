import { describe, expect, it, vi } from 'vitest';
import { Pages } from './Pages';
import { flattenRowFields } from './testUtils';

vi.mock('@payloadcms/richtext-lexical', () => ({
  lexicalEditor: vi.fn((config) => ({ _type: 'lexical', _config: config })),
  BlocksFeature: vi.fn((config) => ({ _type: 'blocks', ...config })),
}));

describe('Pages', () => {
  it('has the correct slug', () => {
    expect(Pages.slug).toBe('pages');
  });

  it('has correct labels', () => {
    expect(Pages.labels?.singular).toBe('Page');
    expect(Pages.labels?.plural).toBe('Pages');
  });

  it('uses title as admin title', () => {
    expect(Pages.admin?.useAsTitle).toBe('title');
  });

  it('is grouped under Content', () => {
    expect(Pages.admin?.group).toBe('Content');
  });

  it('has drafts enabled', () => {
    expect((Pages.versions as { drafts?: boolean })?.drafts).toBe(true);
  });

  it('has timestamps enabled', () => {
    expect(Pages.timestamps).toBe(true);
  });

  it('has public read access', () => {
    const readFn = Pages.access?.read as () => boolean;
    expect(readFn()).toBe(true);
  });

  it('requires authentication to create', () => {
    const createFn = Pages.access?.create as (args: { req: { user: unknown } }) => boolean;
    expect(createFn({ req: { user: null } })).toBe(false);
    expect(createFn({ req: { user: { id: '1' } } })).toBe(true);
  });

  it('allows admin and editor to update', () => {
    const updateFn = Pages.access?.update as (args: { req: { user: unknown } }) => boolean;
    expect(updateFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'dj' } } })).toBe(false);
    expect(updateFn({ req: { user: null } })).toBe(false);
  });

  it('allows admin and editor to delete', () => {
    const deleteFn = Pages.access?.delete as (args: { req: { user: unknown } }) => boolean;
    expect(deleteFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(deleteFn({ req: { user: { role: 'editor' } } })).toBe(true);
  });

  it('has title as a required text field', () => {
    const fields = flattenRowFields(Pages.fields as Record<string, unknown>[]);
    const titleField = fields.find((f) => f.name === 'title') as {
      type?: string;
      required?: boolean;
    };
    expect(titleField?.type).toBe('text');
    expect(titleField?.required).toBe(true);
  });

  it('has slug as a required unique text field', () => {
    const fields = flattenRowFields(Pages.fields as Record<string, unknown>[]);
    const slugFieldEntry = fields.find((f) => f.name === 'slug');
    expect(slugFieldEntry?.type).toBe('text');
    expect(slugFieldEntry?.required).toBe(true);
    expect(slugFieldEntry?.unique).toBe(true);
    expect(slugFieldEntry?.index).toBe(true);
  });

  it('uses pageSlugify for slug generation', () => {
    const fields = flattenRowFields(Pages.fields as Record<string, unknown>[]);
    const slugFieldEntry = fields.find((f) => f.name === 'slug') as {
      custom?: { slugify?: unknown };
    };
    expect(typeof slugFieldEntry?.custom?.slugify).toBe('function');
  });

  it('exposes generateSlug checkbox companion to the slug field', () => {
    const fields = flattenRowFields(Pages.fields as Record<string, unknown>[]);
    const checkbox = fields.find((f) => f.name === 'generateSlug') as { type?: string };
    expect(checkbox?.type).toBe('checkbox');
  });

  it('has headerImage as an optional upload field relating to media', () => {
    const fields = flattenRowFields(Pages.fields as Record<string, unknown>[]);
    const headerImageField = fields.find((f) => f.name === 'headerImage') as {
      type?: string;
      relationTo?: string;
      required?: boolean;
    };
    expect(headerImageField?.type).toBe('upload');
    expect(headerImageField?.relationTo).toBe('media');
    expect(headerImageField?.required).toBeFalsy();
  });

  it('has content as a richText field', () => {
    const fields = flattenRowFields(Pages.fields as Record<string, unknown>[]);
    const contentField = fields.find((f) => f.name === 'content');
    expect(contentField?.type).toBe('richText');
  });

  it('configures content field editor with EmbedFeature appended to default features', () => {
    const fields = flattenRowFields(Pages.fields as Record<string, unknown>[]);
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

  it('does not include date-window or front-page fields (unlike Posts)', () => {
    const fields = flattenRowFields(Pages.fields as Record<string, unknown>[]);
    const fieldNames = fields.map((f) => f.name);
    expect(fieldNames).not.toContain('startDate');
    expect(fieldNames).not.toContain('endDate');
    expect(fieldNames).not.toContain('showOnFrontPage');
    expect(fieldNames).not.toContain('priority');
  });

  it('has legacyId as a unique number field', () => {
    const fields = flattenRowFields(Pages.fields as Record<string, unknown>[]);
    const legacyField = fields.find((f) => f.name === 'legacyId');
    expect(legacyField?.type).toBe('number');
    expect(legacyField?.unique).toBe(true);
  });

  it('has expected default columns', () => {
    expect(Pages.admin?.defaultColumns).toContain('title');
    expect(Pages.admin?.defaultColumns).toContain('slug');
    expect(Pages.admin?.defaultColumns).toContain('_status');
  });

  it('includes title and slug in listSearchableFields', () => {
    expect(Pages.admin?.listSearchableFields).toContain('title');
    expect(Pages.admin?.listSearchableFields).toContain('slug');
  });
});
