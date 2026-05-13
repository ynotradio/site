import { describe, expect, it, vi } from 'vitest';
import { CdOfTheWeek } from './CdOfTheWeek';
import { flattenRowFields } from './testUtils';

describe('CdOfTheWeek', () => {
  it('has the correct slug', () => {
    expect(CdOfTheWeek.slug).toBe('cdoftheweek');
  });

  it('has correct labels', () => {
    expect(CdOfTheWeek.labels?.singular).toBe('CD of the Week');
    expect(CdOfTheWeek.labels?.plural).toBe('CDs of the Week');
  });

  it('uses date as admin title', () => {
    expect(CdOfTheWeek.admin?.useAsTitle).toBe('date');
  });

  it('is grouped under Music', () => {
    expect(CdOfTheWeek.admin?.group).toBe('Music');
  });

  it('has drafts enabled', () => {
    expect((CdOfTheWeek.versions as { drafts?: boolean })?.drafts).toBe(true);
  });

  it('sorts by date descending by default', () => {
    expect(CdOfTheWeek.defaultSort).toBe('-date');
  });

  it('has timestamps enabled', () => {
    expect(CdOfTheWeek.timestamps).toBe(true);
  });

  it('has public read access', () => {
    const readFn = CdOfTheWeek.access?.read as () => boolean;
    expect(readFn()).toBe(true);
  });

  it('requires authentication to create', () => {
    const createFn = CdOfTheWeek.access?.create as (args: { req: { user: unknown } }) => boolean;
    expect(createFn({ req: { user: null } })).toBe(false);
    expect(createFn({ req: { user: { id: '1' } } })).toBe(true);
  });

  it('allows admin and editor to update', () => {
    const updateFn = CdOfTheWeek.access?.update as (args: { req: { user: unknown } }) => boolean;
    expect(updateFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'dj' } } })).toBe(false);
    expect(updateFn({ req: { user: null } })).toBe(false);
  });

  it('allows only admin to delete', () => {
    const deleteFn = CdOfTheWeek.access?.delete as (args: { req: { user: unknown } }) => boolean;
    expect(deleteFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(deleteFn({ req: { user: { role: 'editor' } } })).toBe(false);
  });

  it('has record as a required relationship to records', () => {
    const fields = flattenRowFields(CdOfTheWeek.fields as Record<string, unknown>[]);
    const recordField = fields.find((f) => f.name === 'record');
    expect(recordField?.type).toBe('relationship');
    expect(recordField?.relationTo).toBe('records');
    expect(recordField?.required).toBe(true);
  });

  it('has slug as a unique text field with index', () => {
    const fields = flattenRowFields(CdOfTheWeek.fields as Record<string, unknown>[]);
    const slugField = fields.find((f) => f.name === 'slug');
    expect(slugField?.type).toBe('text');
    expect(slugField?.unique).toBe(true);
    expect(slugField?.index).toBe(true);
  });

  it('has date as a required date field with index', () => {
    const fields = flattenRowFields(CdOfTheWeek.fields as Record<string, unknown>[]);
    const dateField = fields.find((f) => f.name === 'date');
    expect(dateField?.type).toBe('date');
    expect(dateField?.required).toBe(true);
    expect(dateField?.index).toBe(true);
  });

  it('has reviewer as a relationship to people', () => {
    const fields = flattenRowFields(CdOfTheWeek.fields as Record<string, unknown>[]);
    const reviewerField = fields.find((f) => f.name === 'reviewer');
    expect(reviewerField?.type).toBe('relationship');
    expect(reviewerField?.relationTo).toBe('people');
  });

  it('has artistUrl as a text field for album image links', () => {
    const fields = flattenRowFields(CdOfTheWeek.fields as Record<string, unknown>[]);
    const artistUrlField = fields.find((f) => f.name === 'artistUrl');
    expect(artistUrlField?.type).toBe('text');
  });

  it('has review as a richText field', () => {
    const fields = flattenRowFields(CdOfTheWeek.fields as Record<string, unknown>[]);
    const reviewField = fields.find((f) => f.name === 'review');
    expect(reviewField?.type).toBe('richText');
  });

  it('has legacyId as a unique number field', () => {
    const fields = flattenRowFields(CdOfTheWeek.fields as Record<string, unknown>[]);
    const legacyField = fields.find((f) => f.name === 'legacyId');
    expect(legacyField?.type).toBe('number');
    expect(legacyField?.unique).toBe(true);
  });

  it('has expected default columns', () => {
    expect(CdOfTheWeek.admin?.defaultColumns).toContain('date');
    expect(CdOfTheWeek.admin?.defaultColumns).toContain('record');
    expect(CdOfTheWeek.admin?.defaultColumns).toContain('reviewer');
    expect(CdOfTheWeek.admin?.defaultColumns).toContain('_status');
  });

  it('has a beforeChange hook registered', () => {
    expect(CdOfTheWeek.hooks?.beforeChange).toHaveLength(1);
  });

  it('has recordText in listSearchableFields', () => {
    expect(CdOfTheWeek.admin?.listSearchableFields).toContain('recordText');
  });

  it('has recordText as a hidden readOnly text field with a beforeChange hook', () => {
    const fields = flattenRowFields(CdOfTheWeek.fields as Record<string, unknown>[]);
    const recordTextField = fields.find((f) => f.name === 'recordText');
    expect(recordTextField?.type).toBe('text');
    const admin = recordTextField?.admin as { hidden?: boolean; readOnly?: boolean } | undefined;
    expect(admin?.hidden).toBe(true);
    expect(admin?.readOnly).toBe(true);
    const hooks = recordTextField?.hooks as { beforeChange?: unknown[] } | undefined;
    expect(hooks?.beforeChange?.length ?? 0).toBeGreaterThan(0);
  });

  it('syncRecordText hook returns empty string when record is absent', async () => {
    const fields = flattenRowFields(CdOfTheWeek.fields as Record<string, unknown>[]);
    const recordTextField = fields.find((f) => f.name === 'recordText');
    const hooks = recordTextField?.hooks as { beforeChange?: ((args: unknown) => unknown)[] };
    const hook = hooks?.beforeChange?.[0];
    expect(typeof hook).toBe('function');
    const result = await hook!({ siblingData: {}, req: { payload: { find: vi.fn() } } });
    expect(result).toBe('');
  });

  it('syncRecordText hook fetches displayName from records collection', async () => {
    const fields = flattenRowFields(CdOfTheWeek.fields as Record<string, unknown>[]);
    const recordTextField = fields.find((f) => f.name === 'recordText');
    const hooks = recordTextField?.hooks as { beforeChange?: ((args: unknown) => unknown)[] };
    const hook = hooks?.beforeChange?.[0];
    const mockFind = vi.fn().mockResolvedValue({ docs: [{ displayName: 'Radiohead — OK Computer' }] });
    const result = await hook!({
      siblingData: { record: 42 },
      req: { payload: { find: mockFind } },
    });
    expect(result).toBe('Radiohead — OK Computer');
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'records', where: { id: { equals: 42 } } }),
    );
  });

  it('syncRecordText hook handles object-form record (already populated)', async () => {
    const fields = flattenRowFields(CdOfTheWeek.fields as Record<string, unknown>[]);
    const recordTextField = fields.find((f) => f.name === 'recordText');
    const hooks = recordTextField?.hooks as { beforeChange?: ((args: unknown) => unknown)[] };
    const hook = hooks?.beforeChange?.[0];
    const mockFind = vi.fn().mockResolvedValue({ docs: [{ displayName: 'Nirvana — Nevermind' }] });
    const result = await hook!({
      siblingData: { record: { id: 7, title: 'Nevermind' } },
      req: { payload: { find: mockFind } },
    });
    expect(result).toBe('Nirvana — Nevermind');
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { equals: 7 } } }),
    );
  });

  it('syncRecordText hook falls back to title when displayName is missing', async () => {
    const fields = flattenRowFields(CdOfTheWeek.fields as Record<string, unknown>[]);
    const recordTextField = fields.find((f) => f.name === 'recordText');
    const hooks = recordTextField?.hooks as { beforeChange?: ((args: unknown) => unknown)[] };
    const hook = hooks?.beforeChange?.[0];
    const mockFind = vi.fn().mockResolvedValue({ docs: [{ title: 'Nevermind' }] });
    const result = await hook!({
      siblingData: { record: 7 },
      req: { payload: { find: mockFind } },
    });
    expect(result).toBe('Nevermind');
  });

  it('syncRecordText hook returns empty string on fetch error', async () => {
    const fields = flattenRowFields(CdOfTheWeek.fields as Record<string, unknown>[]);
    const recordTextField = fields.find((f) => f.name === 'recordText');
    const hooks = recordTextField?.hooks as { beforeChange?: ((args: unknown) => unknown)[] };
    const hook = hooks?.beforeChange?.[0];
    const mockFind = vi.fn().mockRejectedValue(new Error('DB error'));
    const result = await hook!({
      siblingData: { record: 1 },
      req: { payload: { find: mockFind } },
    });
    expect(result).toBe('');
  });
});
