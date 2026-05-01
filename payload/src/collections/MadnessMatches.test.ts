import { describe, expect, it } from 'vitest';
import { ModernRockMadnessMatches } from './MadnessMatches';
import { flattenRowFields } from './testUtils';

describe('ModernRockMadnessMatches', () => {
  it('has the correct slug', () => {
    expect(ModernRockMadnessMatches.slug).toBe('modern-rock-madness-matches');
  });

  it('uses matchNumber as admin title', () => {
    expect(ModernRockMadnessMatches.admin?.useAsTitle).toBe('matchNumber');
  });

  it('is grouped under Modern Rock Madness', () => {
    expect(ModernRockMadnessMatches.admin?.group).toBe('Modern Rock Madness');
  });

  it('has tournament as a required relationship to modern-rock-madness-tournaments', () => {
    const allFields = flattenRowFields(ModernRockMadnessMatches.fields);
    const tournamentField = allFields.find((f) => f.name === 'tournament');
    expect(tournamentField?.type).toBe('relationship');
    expect(tournamentField?.relationTo).toBe('modern-rock-madness-tournaments');
    expect(tournamentField?.required).toBe(true);
  });

  it('has band1 and band2 as relationships to modern-rock-madness-groups', () => {
    const allFields = flattenRowFields(ModernRockMadnessMatches.fields);
    const band1 = allFields.find((f) => f.name === 'band1');
    const band2 = allFields.find((f) => f.name === 'band2');
    expect(band1?.type).toBe('relationship');
    expect(band1?.relationTo).toBe('modern-rock-madness-groups');
    expect(band2?.type).toBe('relationship');
    expect(band2?.relationTo).toBe('modern-rock-madness-groups');
  });

  it('has vote count fields with default value of 0', () => {
    const allFields = flattenRowFields(ModernRockMadnessMatches.fields);
    const band1Votes = allFields.find((f) => f.name === 'band1Votes');
    const band2Votes = allFields.find((f) => f.name === 'band2Votes');
    expect(band1Votes?.defaultValue).toBe(0);
    expect(band2Votes?.defaultValue).toBe(0);
  });

  it('has startTime and endTime as date fields with dayAndTime picker', () => {
    const allFields = flattenRowFields(ModernRockMadnessMatches.fields);
    const startTime = allFields.find((f) => f.name === 'startTime');
    const endTime = allFields.find((f) => f.name === 'endTime');
    expect(startTime?.type).toBe('date');
    expect(startTime?.required).toBe(true);
    expect(endTime?.type).toBe('date');
    expect(endTime?.required).toBe(true);
  });

  it('has nextMatch as a self-referencing relationship', () => {
    const allFields = flattenRowFields(ModernRockMadnessMatches.fields);
    const nextMatch = allFields.find((f) => f.name === 'nextMatch');
    expect(nextMatch?.type).toBe('relationship');
    expect(nextMatch?.relationTo).toBe('modern-rock-madness-matches');
  });

  it('has 6 round options covering the full tournament', () => {
    const allFields = flattenRowFields(ModernRockMadnessMatches.fields);
    const roundField = allFields.find((f) => f.name === 'round');
    expect(roundField?.options).toHaveLength(6);
  });

  it('has winner as a relationship to modern-rock-madness-groups', () => {
    const allFields = flattenRowFields(ModernRockMadnessMatches.fields);
    const winner = allFields.find((f) => f.name === 'winner');
    expect(winner?.type).toBe('relationship');
    expect(winner?.relationTo).toBe('modern-rock-madness-groups');
  });

  it('has no legacyId or migratedAt fields', () => {
    const allFields = flattenRowFields(ModernRockMadnessMatches.fields);
    const names = allFields.map((f) => f.name);
    expect(names).not.toContain('legacyId');
    expect(names).not.toContain('migratedAt');
  });

  it('has public read access', () => {
    const readFn = ModernRockMadnessMatches.access?.read;
    expect(typeof readFn).toBe('function');
    expect((readFn as () => boolean)()).toBe(true);
  });

  it('restricts create to admin and editor roles', () => {
    const createFn = ModernRockMadnessMatches.access?.create as (args: {
      req: { user: unknown };
    }) => boolean;
    expect(createFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(createFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(createFn({ req: { user: { role: 'dj' } } })).toBe(false);
    expect(createFn({ req: { user: null } })).toBe(false);
  });

  it('restricts update to admin and editor roles', () => {
    const updateFn = ModernRockMadnessMatches.access?.update as (args: {
      req: { user: unknown };
    }) => boolean;
    expect(updateFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'readonly' } } })).toBe(false);
    expect(updateFn({ req: { user: null } })).toBe(false);
  });

  it('restricts delete to admin role only', () => {
    const deleteFn = ModernRockMadnessMatches.access?.delete as (args: {
      req: { user: unknown };
    }) => boolean;
    expect(deleteFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(deleteFn({ req: { user: { role: 'editor' } } })).toBe(false);
    expect(deleteFn({ req: { user: null } })).toBe(false);
  });

  it('winner filterOptions returns all bands when sibling data has band1 and band2', () => {
    const allFields = flattenRowFields(ModernRockMadnessMatches.fields);
    const winner = allFields.find((f) => f.name === 'winner');
    const filterOptions = winner?.filterOptions as (args: {
      siblingData: { band1?: string; band2?: string };
    }) => unknown;
    const result = filterOptions({ siblingData: { band1: 'id-1', band2: 'id-2' } });
    expect(result).toEqual({ id: { in: ['id-1', 'id-2'] } });
  });

  it('winner filterOptions returns empty filter when siblingData has no bands', () => {
    const allFields = flattenRowFields(ModernRockMadnessMatches.fields);
    const winner = allFields.find((f) => f.name === 'winner');
    const filterOptions = winner?.filterOptions as (args: { siblingData: unknown }) => unknown;
    expect(filterOptions({ siblingData: {} })).toEqual({ id: { equals: '' } });
    expect(filterOptions({ siblingData: { band1: null, band2: undefined } })).toEqual({
      id: { equals: '' },
    });
  });

  it('has timestamps enabled', () => {
    expect(ModernRockMadnessMatches.timestamps).toBe(true);
  });
});
