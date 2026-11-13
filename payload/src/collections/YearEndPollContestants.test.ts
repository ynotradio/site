import { describe, expect, it } from 'vitest';
import { YearEndPollContestants } from './YearEndPollContestants';
import { flattenRowFields } from './testUtils';

describe('YearEndPollContestants', () => {
  const fields = flattenRowFields(YearEndPollContestants.fields);

  it('has the correct slug and group', () => {
    expect(YearEndPollContestants.slug).toBe('year-end-poll-contestants');
    expect(YearEndPollContestants.admin?.group).toBe('Polls & Contests');
  });

  it('requires poll, name and email', () => {
    const required = fields.filter((f) => f.required).map((f) => f.name);
    expect(required).toEqual(expect.arrayContaining(['poll', 'name', 'email']));
  });

  it('indexes email and phone for duplicate-entry checks', () => {
    expect(fields.find((f) => f.name === 'email')?.index).toBe(true);
    expect(fields.find((f) => f.name === 'phone')?.index).toBe(true);
  });

  it('is readable only by editors and admins', () => {
    const read = YearEndPollContestants.access?.read as (args: unknown) => boolean;
    expect(read({ req: { user: null } })).toBe(false);
    expect(read({ req: { user: { role: 'admin' } } })).toBe(true);
  });
});
