import { describe, expect, it } from 'vitest';
import { YearEndStaffPicks } from './YearEndStaffPicks';
import { flattenRowFields } from './testUtils';

describe('YearEndStaffPicks', () => {
  const fields = flattenRowFields(YearEndStaffPicks.fields);
  const field = (name: string) => fields.find((f) => f.name === name);

  it('has the correct slug, group and sort', () => {
    expect(YearEndStaffPicks.slug).toBe('year-end-staff-picks');
    expect(YearEndStaffPicks.admin?.group).toBe('Polls & Contests');
    expect(YearEndStaffPicks.defaultSort).toBe('sortOrder');
  });

  it('requires a year and a name', () => {
    expect(field('year')?.required).toBe(true);
    expect(field('name')?.required).toBe(true);
  });

  it('stores songs and albums as ranked artist/title lists', () => {
    ['songs', 'albums'].forEach((name) => {
      expect(field(name)?.type).toBe('array');
      expect(field(`${name}Paste`)?.virtual).toBe(true);
      expect(field(`${name}Paste`)?.admin?.readOnly).toBe(false);
    });
  });

  it('links optionally to a DJ', () => {
    expect(field('dj')?.relationTo).toBe('djs');
    expect(field('dj')?.required).toBeFalsy();
  });

  it('is publicly readable but only editable by editors and admins', () => {
    const read = YearEndStaffPicks.access?.read as (args: unknown) => boolean;
    const update = YearEndStaffPicks.access?.update as (args: unknown) => boolean;
    expect(read({ req: { user: null } })).toBe(true);
    expect(update({ req: { user: null } })).toBe(false);
    expect(update({ req: { user: { role: 'editor' } } })).toBe(true);
  });
});
