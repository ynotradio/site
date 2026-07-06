import { describe, expect, it } from 'vitest';
import { YearEndPolls } from './YearEndPolls';
import { flattenRowFields } from './testUtils';

describe('YearEndPolls', () => {
  it('has the correct slug', () => {
    expect(YearEndPolls.slug).toBe('year-end-polls');
  });

  it('uses name as admin title', () => {
    expect(YearEndPolls.admin?.useAsTitle).toBe('name');
  });

  it('is grouped under Polls & Contests', () => {
    expect(YearEndPolls.admin?.group).toBe('Polls & Contests');
  });

  it('has required fields', () => {
    const allFields = flattenRowFields(YearEndPolls.fields);
    const requiredNames = allFields.filter((f) => f.required).map((f) => f.name);
    expect(requiredNames).toContain('name');
    expect(requiredNames).toContain('year');
    expect(requiredNames).toContain('slug');
    expect(requiredNames).toContain('status');
  });

  it('has draft as default status', () => {
    const allFields = flattenRowFields(YearEndPolls.fields);
    const statusField = allFields.find((f) => f.name === 'status');
    expect(statusField?.defaultValue).toBe('draft');
  });

  it('has all four status options', () => {
    const allFields = flattenRowFields(YearEndPolls.fields);
    const statusField = allFields.find((f) => f.name === 'status');
    const values = (statusField?.options as Array<{ value: string }>).map((o) => o.value);
    expect(values).toContain('draft');
    expect(values).toContain('open');
    expect(values).toContain('closed');
    expect(values).toContain('archived');
  });

  it('has year as indexed', () => {
    const allFields = flattenRowFields(YearEndPolls.fields);
    const yearField = allFields.find((f) => f.name === 'year');
    expect(yearField?.index).toBe(true);
  });

  it('has slug as unique', () => {
    const allFields = flattenRowFields(YearEndPolls.fields);
    const slugField = allFields.find((f) => f.name === 'slug');
    expect(slugField?.unique).toBe(true);
  });

  it('has votingOpensAt and votingClosesAt as date fields', () => {
    const allFields = flattenRowFields(YearEndPolls.fields);
    const opensField = allFields.find((f) => f.name === 'votingOpensAt');
    const closesField = allFields.find((f) => f.name === 'votingClosesAt');
    expect(opensField?.type).toBe('date');
    expect(closesField?.type).toBe('date');
  });

  it('has bannerImage as a media upload', () => {
    const fields = YearEndPolls.fields as Array<{
      name: string;
      type: string;
      relationTo?: string;
    }>;
    const bannerField = fields.find((f) => f.name === 'bannerImage');
    expect(bannerField?.type).toBe('upload');
    expect(bannerField?.relationTo).toBe('media');
  });

  it('has no legacyId or migratedAt fields', () => {
    const allFields = flattenRowFields(YearEndPolls.fields);
    const names = allFields.map((f) => f.name);
    expect(names).not.toContain('legacyId');
    expect(names).not.toContain('migratedAt');
  });

  it('has public read access', () => {
    const readFn = YearEndPolls.access?.read;
    expect(typeof readFn).toBe('function');
    expect((readFn as () => boolean)()).toBe(true);
  });

  it('has timestamps enabled', () => {
    expect(YearEndPolls.timestamps).toBe(true);
  });
});
