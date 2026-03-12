import { describe, expect, it } from 'vitest';
import { ModernRockMadnessGroups } from './MadnessBands';
import { flattenRowFields } from './testUtils';

describe('ModernRockMadnessGroups', () => {
  it('has the correct slug', () => {
    expect(ModernRockMadnessGroups.slug).toBe('modern-rock-madness-groups');
  });

  it('uses name as admin title', () => {
    expect(ModernRockMadnessGroups.admin?.useAsTitle).toBe('name');
  });

  it('is grouped under Modern Rock Madness', () => {
    expect(ModernRockMadnessGroups.admin?.group).toBe('Modern Rock Madness');
  });

  it('has required fields', () => {
    const allFields = flattenRowFields(ModernRockMadnessGroups.fields);
    const requiredNames = allFields.filter((f) => f.required).map((f) => f.name);
    expect(requiredNames).toContain('tournament');
    expect(requiredNames).toContain('seed');
    expect(requiredNames).toContain('placement');
  });

  it('name is an optional override field', () => {
    const allFields = flattenRowFields(ModernRockMadnessGroups.fields);
    const nameField = allFields.find((f) => f.name === 'name');
    expect(nameField).toBeDefined();
    expect(nameField?.required).toBeFalsy();
  });

  it('has artists as a hasMany relationship to artists', () => {
    const allFields = flattenRowFields(ModernRockMadnessGroups.fields);
    const artistsField = allFields.find((f) => f.name === 'artists');
    expect(artistsField?.type).toBe('relationship');
    expect(artistsField?.relationTo).toBe('artists');
    expect(artistsField?.hasMany).toBe(true);
  });

  it('has image as an upload relationship to media', () => {
    const allFields = flattenRowFields(ModernRockMadnessGroups.fields);
    const imageField = allFields.find((f) => f.name === 'image');
    expect(imageField?.type).toBe('upload');
    expect(imageField?.relationTo).toBe('media');
  });

  it('has tournament as a relationship to modern-rock-madness-tournaments', () => {
    const allFields = flattenRowFields(ModernRockMadnessGroups.fields);
    const tournamentField = allFields.find((f) => f.name === 'tournament');
    expect(tournamentField?.type).toBe('relationship');
    expect(tournamentField?.relationTo).toBe('modern-rock-madness-tournaments');
  });

  it('enforces abbreviation max length of 7', () => {
    const allFields = flattenRowFields(ModernRockMadnessGroups.fields);
    const abbrField = allFields.find((f) => f.name === 'abbreviation');
    expect(abbrField?.maxLength).toBe(7);
  });

  it('has public read access', () => {
    const readFn = ModernRockMadnessGroups.access?.read;
    expect(typeof readFn).toBe('function');
    expect((readFn as () => boolean)()).toBe(true);
  });

  it('has timestamps enabled', () => {
    expect(ModernRockMadnessGroups.timestamps).toBe(true);
  });
});
