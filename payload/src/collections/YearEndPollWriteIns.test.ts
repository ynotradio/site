import { describe, expect, it } from 'vitest';
import { YearEndPollWriteIns } from './YearEndPollWriteIns';
import { flattenRowFields } from './testUtils';

describe('YearEndPollWriteIns', () => {
  const fields = flattenRowFields(YearEndPollWriteIns.fields);

  it('has the correct slug and group', () => {
    expect(YearEndPollWriteIns.slug).toBe('year-end-poll-write-ins');
    expect(YearEndPollWriteIns.admin?.group).toBe('Polls & Contests');
  });

  it('requires poll, category and writeIn', () => {
    const required = fields.filter((f) => f.required).map((f) => f.name);
    expect(required).toEqual(expect.arrayContaining(['poll', 'category', 'writeIn']));
  });

  it('links to the poll and category', () => {
    expect(fields.find((f) => f.name === 'poll')?.relationTo).toBe('year-end-polls');
    expect(fields.find((f) => f.name === 'category')?.relationTo).toBe('year-end-poll-categories');
  });

  it('is readable only by editors and admins', () => {
    const read = YearEndPollWriteIns.access?.read as (args: unknown) => boolean;
    expect(read({ req: { user: null } })).toBe(false);
    expect(read({ req: { user: { role: 'editor' } } })).toBe(true);
  });
});
