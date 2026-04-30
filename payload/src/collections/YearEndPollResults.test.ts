import { describe, expect, it } from 'vitest';
import { YearEndPollResults } from './YearEndPollResults';
import { flattenRowFields } from './testUtils';

describe('YearEndPollResults', () => {
  it('has the correct slug', () => {
    expect(YearEndPollResults.slug).toBe('year-end-poll-results');
  });

  it('has correct labels', () => {
    expect(YearEndPollResults.labels?.singular).toBe('Year End Poll Result');
    expect(YearEndPollResults.labels?.plural).toBe('Year End Poll Results');
  });

  it('uses title as admin title', () => {
    expect(YearEndPollResults.admin?.useAsTitle).toBe('title');
  });

  it('is grouped under Polls & Contests', () => {
    expect(YearEndPollResults.admin?.group).toBe('Polls & Contests');
  });

  it('has drafts enabled', () => {
    expect((YearEndPollResults.versions as { drafts?: boolean })?.drafts).toBe(true);
  });

  it('has timestamps enabled', () => {
    expect(YearEndPollResults.timestamps).toBe(true);
  });

  it('has public read access', () => {
    const readFn = YearEndPollResults.access?.read as () => boolean;
    expect(readFn()).toBe(true);
  });

  it('requires authentication to create', () => {
    const createFn = YearEndPollResults.access?.create as (args: {
      req: { user: unknown };
    }) => boolean;
    expect(createFn({ req: { user: null } })).toBe(false);
    expect(createFn({ req: { user: { id: '1' } } })).toBe(true);
  });

  it('allows admin and editor to update', () => {
    const updateFn = YearEndPollResults.access?.update as (args: {
      req: { user: unknown };
    }) => boolean;
    expect(updateFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'dj' } } })).toBe(false);
    expect(updateFn({ req: { user: null } })).toBe(false);
  });

  it('allows only admin to delete', () => {
    const deleteFn = YearEndPollResults.access?.delete as (args: {
      req: { user: unknown };
    }) => boolean;
    expect(deleteFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(deleteFn({ req: { user: { role: 'editor' } } })).toBe(false);
  });

  it('has title as a required text field', () => {
    const fields = flattenRowFields(YearEndPollResults.fields as Record<string, unknown>[]);
    const titleField = fields.find((f) => f.name === 'title');
    expect(titleField?.type).toBe('text');
    expect(titleField?.required).toBe(true);
  });

  it('has year as a required number field', () => {
    const fields = flattenRowFields(YearEndPollResults.fields as Record<string, unknown>[]);
    const yearField = fields.find((f) => f.name === 'year') as {
      type?: string;
      required?: boolean;
      min?: number;
      max?: number;
    };
    expect(yearField?.type).toBe('number');
    expect(yearField?.required).toBe(true);
    expect(yearField?.min).toBe(2000);
    expect(yearField?.max).toBe(2100);
  });

  it('has pageType as a required select with expected options', () => {
    const fields = flattenRowFields(YearEndPollResults.fields as Record<string, unknown>[]);
    const pageTypeField = fields.find((f) => f.name === 'pageType') as {
      type?: string;
      required?: boolean;
      options?: { value: string }[];
    };
    expect(pageTypeField?.type).toBe('select');
    expect(pageTypeField?.required).toBe(true);
    const values = pageTypeField?.options?.map((o) => o.value);
    expect(values).toContain('countdown');
    expect(values).toContain('poll-results');
    expect(values).toContain('staff-picks');
  });

  it('has slug as a required unique text field', () => {
    const fields = flattenRowFields(YearEndPollResults.fields as Record<string, unknown>[]);
    const slugField = fields.find((f) => f.name === 'slug');
    expect(slugField?.type).toBe('text');
    expect(slugField?.required).toBe(true);
    expect(slugField?.unique).toBe(true);
  });

  it('has sections as a required blocks field', () => {
    const fields = flattenRowFields(YearEndPollResults.fields as Record<string, unknown>[]);
    const sectionsField = fields.find((f) => f.name === 'sections') as {
      type?: string;
      required?: boolean;
      minRows?: number;
      blocks?: { slug: string }[];
    };
    expect(sectionsField?.type).toBe('blocks');
    expect(sectionsField?.required).toBe(true);
    expect(sectionsField?.minRows).toBe(1);
  });

  it('sections includes rankedSongs, rankedRecords, staffPicks, and textContent blocks', () => {
    const fields = flattenRowFields(YearEndPollResults.fields as Record<string, unknown>[]);
    const sectionsField = fields.find((f) => f.name === 'sections') as {
      blocks?: { slug: string }[];
    };
    const blockSlugs = sectionsField?.blocks?.map((b) => b.slug);
    expect(blockSlugs).toContain('rankedSongs');
    expect(blockSlugs).toContain('rankedRecords');
    expect(blockSlugs).toContain('staffPicks');
    expect(blockSlugs).toContain('textContent');
  });

  it('has publishedAt as a date field in sidebar', () => {
    const fields = flattenRowFields(YearEndPollResults.fields as Record<string, unknown>[]);
    const publishedField = fields.find((f) => f.name === 'publishedAt') as {
      type?: string;
      admin?: { position?: string };
    };
    expect(publishedField?.type).toBe('date');
    expect(publishedField?.admin?.position).toBe('sidebar');
  });

  it('has expected default columns', () => {
    expect(YearEndPollResults.admin?.defaultColumns).toContain('title');
    expect(YearEndPollResults.admin?.defaultColumns).toContain('year');
    expect(YearEndPollResults.admin?.defaultColumns).toContain('pageType');
  });
});
