import { describe, expect, it } from 'vitest';
import { ModernRockMadnessVotes } from './MadnessVotes';

describe('ModernRockMadnessVotes', () => {
  it('has the correct slug', () => {
    expect(ModernRockMadnessVotes.slug).toBe('modern-rock-madness-votes');
  });

  it('is grouped under Modern Rock Madness', () => {
    expect(ModernRockMadnessVotes.admin?.group).toBe('Modern Rock Madness');
  });

  it('has required fields', () => {
    const fields = ModernRockMadnessVotes.fields as Array<{ name: string; required?: boolean }>;
    const requiredNames = fields.filter((f) => f.required).map((f) => f.name);
    expect(requiredNames).toContain('match');
    expect(requiredNames).toContain('group');
    expect(requiredNames).toContain('userId');
  });

  it('has match as a relationship to modern-rock-madness-matches', () => {
    const fields = ModernRockMadnessVotes.fields as Array<{
      name: string;
      type: string;
      relationTo?: string;
    }>;
    const matchField = fields.find((f) => f.name === 'match');
    expect(matchField?.type).toBe('relationship');
    expect(matchField?.relationTo).toBe('modern-rock-madness-matches');
  });

  it('has group as a relationship to modern-rock-madness-groups', () => {
    const fields = ModernRockMadnessVotes.fields as Array<{
      name: string;
      type: string;
      relationTo?: string;
    }>;
    const groupField = fields.find((f) => f.name === 'group');
    expect(groupField?.type).toBe('relationship');
    expect(groupField?.relationTo).toBe('modern-rock-madness-groups');
  });

  it('has userId indexed for duplicate prevention', () => {
    const fields = ModernRockMadnessVotes.fields as Array<{ name: string; index?: boolean }>;
    const userIdField = fields.find((f) => f.name === 'userId');
    expect(userIdField?.index).toBe(true);
  });

  it('does not collect IP addresses (Auth0 handles duplicate prevention)', () => {
    const fields = ModernRockMadnessVotes.fields as Array<{ name: string }>;
    const names = fields.map((f) => f.name);
    expect(names).not.toContain('voterIp');
  });

  it('has no legacyId or migratedAt fields', () => {
    const fields = ModernRockMadnessVotes.fields as Array<{ name: string }>;
    const names = fields.map((f) => f.name);
    expect(names).not.toContain('legacyId');
    expect(names).not.toContain('migratedAt');
  });

  it('restricts read access to admin and editor roles', () => {
    const readFn = ModernRockMadnessVotes.access?.read;
    expect(typeof readFn).toBe('function');
    expect((readFn as (args: { req: { user: null } }) => boolean)({ req: { user: null } })).toBe(
      false,
    );
  });

  it('has timestamps enabled', () => {
    expect(ModernRockMadnessVotes.timestamps).toBe(true);
  });
});
