import { describe, expect, it } from 'vitest';
import { ModernRockMadnessTournaments } from './MadnessTournaments';
import { scaffoldTournamentMatches } from './hooks/scaffoldTournamentMatches';
import { flattenRowFields } from './testUtils';

describe('ModernRockMadnessTournaments', () => {
  it('has the correct slug', () => {
    expect(ModernRockMadnessTournaments.slug).toBe('modern-rock-madness-tournaments');
  });

  it('uses name as admin title', () => {
    expect(ModernRockMadnessTournaments.admin?.useAsTitle).toBe('name');
  });

  it('is grouped under Modern Rock Madness', () => {
    expect(ModernRockMadnessTournaments.admin?.group).toBe('Modern Rock Madness');
  });

  it('has required fields', () => {
    const allFields = flattenRowFields(ModernRockMadnessTournaments.fields);
    const requiredNames = allFields.filter((f) => f.required).map((f) => f.name);
    expect(requiredNames).toContain('name');
    expect(requiredNames).toContain('year');
    expect(requiredNames).toContain('startDate');
    expect(requiredNames).toContain('status');
  });

  it('has draft as default status', () => {
    const allFields = flattenRowFields(ModernRockMadnessTournaments.fields);
    const statusField = allFields.find((f) => f.name === 'status');
    expect(statusField?.defaultValue).toBe('draft');
  });

  it('has year as indexed (not unique)', () => {
    const allFields = flattenRowFields(ModernRockMadnessTournaments.fields);
    const yearField = allFields.find((f) => f.name === 'year');
    expect(yearField?.unique).toBe(false);
    expect(yearField?.index).toBe(true);
  });

  it('has bannerImage as a media upload', () => {
    const fields = ModernRockMadnessTournaments.fields as Array<{
      name: string;
      type: string;
      relationTo?: string;
    }>;
    const bannerField = fields.find((f) => f.name === 'bannerImage');
    expect(bannerField?.type).toBe('upload');
    expect(bannerField?.relationTo).toBe('media');
  });

  it('has no legacyId or migratedAt fields', () => {
    const allFields = flattenRowFields(ModernRockMadnessTournaments.fields);
    const names = allFields.map((f) => f.name);
    expect(names).not.toContain('legacyId');
    expect(names).not.toContain('migratedAt');
  });

  it('has public read access', () => {
    const readFn = ModernRockMadnessTournaments.access?.read;
    expect(typeof readFn).toBe('function');
    expect((readFn as () => boolean)()).toBe(true);
  });

  it('has timestamps enabled', () => {
    expect(ModernRockMadnessTournaments.timestamps).toBe(true);
  });

  it('has scaffoldTournamentMatches as an afterChange hook', () => {
    expect(ModernRockMadnessTournaments.hooks?.afterChange).toContain(scaffoldTournamentMatches);
  });
});
