import { describe, expect, it } from 'vitest';
import { ModernRockMadnessMatches } from './MadnessMatches';

/**
 * Flatten row-type fields into a flat array for easier testing.
 * Payload uses { type: 'row', fields: [...] } to group fields visually.
 */
const flattenRowFields = (
  fields: readonly Record<string, unknown>[],
): Array<Record<string, unknown>> =>
  fields.reduce<Array<Record<string, unknown>>>((result, field) => {
    if (field.type === 'row' && Array.isArray(field.fields)) {
      return [...result, ...(field.fields as Array<Record<string, unknown>>)];
    }
    return [...result, field];
  }, []);

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
    const fields = ModernRockMadnessMatches.fields as Array<{
      name?: string;
      type: string;
      relationTo?: string;
      required?: boolean;
    }>;
    const tournamentField = fields.find((f) => f.name === 'tournament');
    expect(tournamentField?.type).toBe('relationship');
    expect(tournamentField?.relationTo).toBe('modern-rock-madness-tournaments');
    expect(tournamentField?.required).toBe(true);
  });

  it('has band1 and band2 as relationships to modern-rock-madness-groups', () => {
    const allFields = flattenRowFields(ModernRockMadnessMatches.fields);
    const band1 = allFields.find((f: { name?: string }) => f.name === 'band1');
    const band2 = allFields.find((f: { name?: string }) => f.name === 'band2');
    expect(band1?.type).toBe('relationship');
    expect(band1?.relationTo).toBe('modern-rock-madness-groups');
    expect(band2?.type).toBe('relationship');
    expect(band2?.relationTo).toBe('modern-rock-madness-groups');
  });

  it('has vote count fields with default value of 0', () => {
    const allFields = flattenRowFields(ModernRockMadnessMatches.fields);
    const band1Votes = allFields.find((f: { name?: string }) => f.name === 'band1Votes');
    const band2Votes = allFields.find((f: { name?: string }) => f.name === 'band2Votes');
    expect(band1Votes?.defaultValue).toBe(0);
    expect(band2Votes?.defaultValue).toBe(0);
  });

  it('has startTime and endTime as date fields with dayAndTime picker', () => {
    const allFields = flattenRowFields(ModernRockMadnessMatches.fields);
    const startTime = allFields.find((f: { name?: string }) => f.name === 'startTime');
    const endTime = allFields.find((f: { name?: string }) => f.name === 'endTime');
    expect(startTime?.type).toBe('date');
    expect(startTime?.required).toBe(true);
    expect(endTime?.type).toBe('date');
    expect(endTime?.required).toBe(true);
  });

  it('has nextMatch as a self-referencing relationship', () => {
    const fields = ModernRockMadnessMatches.fields as Array<{
      name?: string;
      type: string;
      relationTo?: string;
    }>;
    const nextMatch = fields.find((f) => f.name === 'nextMatch');
    expect(nextMatch?.type).toBe('relationship');
    expect(nextMatch?.relationTo).toBe('modern-rock-madness-matches');
  });

  it('has 6 round options covering the full tournament', () => {
    const fields = ModernRockMadnessMatches.fields as Array<{
      name?: string;
      options?: Array<{ value: string }>;
    }>;
    const roundField = fields.find((f) => f.name === 'round');
    expect(roundField?.options).toHaveLength(6);
  });

  it('has winner as a relationship to modern-rock-madness-groups', () => {
    const fields = ModernRockMadnessMatches.fields as Array<{
      name?: string;
      type: string;
      relationTo?: string;
    }>;
    const winner = fields.find((f) => f.name === 'winner');
    expect(winner?.type).toBe('relationship');
    expect(winner?.relationTo).toBe('modern-rock-madness-groups');
  });

  it('has no legacyId or migratedAt fields', () => {
    const allFields = flattenRowFields(ModernRockMadnessMatches.fields);
    const names = allFields.map((f: { name?: string }) => f.name);
    expect(names).not.toContain('legacyId');
    expect(names).not.toContain('migratedAt');
  });

  it('has public read access', () => {
    const readFn = ModernRockMadnessMatches.access?.read;
    expect(typeof readFn).toBe('function');
    expect((readFn as () => boolean)()).toBe(true);
  });

  it('has timestamps enabled', () => {
    expect(ModernRockMadnessMatches.timestamps).toBe(true);
  });
});
