import { describe, expect, it } from 'vitest';
import { ModernRockMadnessGroups } from './MadnessBands';

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
    const fields = ModernRockMadnessGroups.fields as Array<{ name: string; required?: boolean }>;
    const requiredNames = fields.filter((f) => f.required).map((f) => f.name);
    expect(requiredNames).toContain('tournament');
    expect(requiredNames).toContain('seed');
    expect(requiredNames).toContain('placement');
  });

  it('name is an optional override field', () => {
    const fields = ModernRockMadnessGroups.fields as Array<{ name: string; required?: boolean }>;
    const nameField = fields.find((f) => f.name === 'name');
    expect(nameField).toBeDefined();
    expect(nameField?.required).toBeFalsy();
  });

  it('has artists as a hasMany relationship to artists', () => {
    const fields = ModernRockMadnessGroups.fields as Array<{
      name: string;
      type: string;
      relationTo?: string;
      hasMany?: boolean;
    }>;
    const artistsField = fields.find((f) => f.name === 'artists');
    expect(artistsField?.type).toBe('relationship');
    expect(artistsField?.relationTo).toBe('artists');
    expect(artistsField?.hasMany).toBe(true);
  });

  it('has image as an upload relationship to media', () => {
    const fields = ModernRockMadnessGroups.fields as Array<{
      name: string;
      type: string;
      relationTo?: string;
    }>;
    const imageField = fields.find((f) => f.name === 'image');
    expect(imageField?.type).toBe('upload');
    expect(imageField?.relationTo).toBe('media');
  });

  it('has tournament as a relationship to modern-rock-madness-tournaments', () => {
    const fields = ModernRockMadnessGroups.fields as Array<{
      name: string;
      type: string;
      relationTo?: string;
    }>;
    const tournamentField = fields.find((f) => f.name === 'tournament');
    expect(tournamentField?.type).toBe('relationship');
    expect(tournamentField?.relationTo).toBe('modern-rock-madness-tournaments');
  });

  it('enforces abbreviation max length of 7', () => {
    const fields = ModernRockMadnessGroups.fields as Array<{ name: string; maxLength?: number }>;
    const abbrField = fields.find((f) => f.name === 'abbreviation');
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
