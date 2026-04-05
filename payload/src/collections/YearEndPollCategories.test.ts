import { describe, expect, it } from 'vitest';
import { YearEndPollCategories } from './YearEndPollCategories';
import { flattenRowFields } from './testUtils';

type NomineeField = { name: string; type?: string; relationTo?: string; defaultValue?: unknown };

/**
 * Flatten the rows within the nominees array field into a flat list of fields.
 */
function flattenNomineeFields(): NomineeField[] {
  const nominees = YearEndPollCategories.fields.find(
    (f) => (f as { name?: string }).name === 'nominees',
  ) as { fields: Array<{ type: string; fields?: NomineeField[] }> } | undefined;
  return (nominees?.fields ?? []).flatMap((f) => {
    if (f.type === 'row' && Array.isArray(f.fields)) {
      return f.fields;
    }
    return [f as NomineeField];
  });
}

describe('YearEndPollCategories', () => {
  it('has the correct slug', () => {
    expect(YearEndPollCategories.slug).toBe('year-end-poll-categories');
  });

  it('uses displayName as admin title', () => {
    expect(YearEndPollCategories.admin?.useAsTitle).toBe('displayName');
  });

  it('is grouped under Polls & Contests', () => {
    expect(YearEndPollCategories.admin?.group).toBe('Polls & Contests');
  });

  it('has required fields', () => {
    const allFields = flattenRowFields(YearEndPollCategories.fields);
    const requiredNames = allFields.filter((f) => f.required).map((f) => f.name);
    expect(requiredNames).toContain('poll');
    expect(requiredNames).toContain('name');
    expect(requiredNames).toContain('displayName');
    expect(requiredNames).toContain('categoryType');
    expect(requiredNames).toContain('maxPicks');
  });

  it('has poll as a required relationship to year-end-polls', () => {
    const allFields = flattenRowFields(YearEndPollCategories.fields);
    const pollField = allFields.find((f) => f.name === 'poll');
    expect(pollField?.type).toBe('relationship');
    expect(pollField?.relationTo).toBe('year-end-polls');
    expect(pollField?.required).toBe(true);
    expect(pollField?.index).toBe(true);
  });

  it('has all five category type options', () => {
    const allFields = flattenRowFields(YearEndPollCategories.fields);
    const typeField = allFields.find((f) => f.name === 'categoryType');
    const values = (typeField?.options as Array<{ value: string }>).map((o) => o.value);
    expect(values).toContain('songs');
    expect(values).toContain('albums');
    expect(values).toContain('artists');
    expect(values).toContain('concerts');
    expect(values).toContain('custom');
  });

  it('has maxPicks with a default of 3', () => {
    const allFields = flattenRowFields(YearEndPollCategories.fields);
    const maxPicksField = allFields.find((f) => f.name === 'maxPicks');
    expect(maxPicksField?.defaultValue).toBe(3);
  });

  it('has optional per-category voting window fields', () => {
    const allFields = flattenRowFields(YearEndPollCategories.fields);
    const opensField = allFields.find((f) => f.name === 'votingOpensAt');
    const closesField = allFields.find((f) => f.name === 'votingClosesAt');
    expect(opensField?.type).toBe('date');
    expect(closesField?.type).toBe('date');
    expect(opensField?.required).toBeFalsy();
    expect(closesField?.required).toBeFalsy();
  });

  it('has a nominees array field', () => {
    const nominees = YearEndPollCategories.fields.find(
      (f) => (f as { name?: string }).name === 'nominees',
    ) as { name: string; type: string; fields: unknown[] } | undefined;
    expect(nominees).toBeDefined();
    expect(nominees?.type).toBe('array');
  });

  it('nominees array includes song, record, artist, concert, customLabel, and voteCount', () => {
    const names = flattenNomineeFields().map((f) => f.name);
    expect(names).toContain('song');
    expect(names).toContain('record');
    expect(names).toContain('artist');
    expect(names).toContain('concert');
    expect(names).toContain('customLabel');
    expect(names).toContain('voteCount');
  });

  it('voteCount defaults to 0', () => {
    const voteCountField = flattenNomineeFields().find((f) => f.name === 'voteCount');
    expect(voteCountField?.defaultValue).toBe(0);
  });

  it('song nominee is a relationship to songs', () => {
    const songField = flattenNomineeFields().find((f) => f.name === 'song');
    expect(songField?.type).toBe('relationship');
    expect(songField?.relationTo).toBe('songs');
  });

  it('record nominee is a relationship to records', () => {
    const recordField = flattenNomineeFields().find((f) => f.name === 'record');
    expect(recordField?.type).toBe('relationship');
    expect(recordField?.relationTo).toBe('records');
  });

  it('has no legacyId or migratedAt fields', () => {
    const allFields = flattenRowFields(YearEndPollCategories.fields);
    const names = allFields.map((f) => f.name);
    expect(names).not.toContain('legacyId');
    expect(names).not.toContain('migratedAt');
  });

  it('has public read access', () => {
    const readFn = YearEndPollCategories.access?.read;
    expect(typeof readFn).toBe('function');
    expect((readFn as () => boolean)()).toBe(true);
  });

  it('has timestamps enabled', () => {
    expect(YearEndPollCategories.timestamps).toBe(true);
  });
});
