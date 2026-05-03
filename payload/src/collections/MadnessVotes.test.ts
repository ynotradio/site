import { describe, expect, it } from 'vitest';
import { ModernRockMadnessVotes } from './MadnessVotes';
import { flattenRowFields } from './testUtils';

describe('ModernRockMadnessVotes', () => {
  it('has the correct slug', () => {
    expect(ModernRockMadnessVotes.slug).toBe('modern-rock-madness-votes');
  });

  it('is grouped under Modern Rock Madness', () => {
    expect(ModernRockMadnessVotes.admin?.group).toBe('Modern Rock Madness');
  });

  it('has required fields', () => {
    const allFields = flattenRowFields(ModernRockMadnessVotes.fields);
    const requiredNames = allFields.filter((f) => f.required).map((f) => f.name);
    expect(requiredNames).toContain('match');
    expect(requiredNames).toContain('group');
    expect(requiredNames).toContain('userId');
  });

  it('has match as a relationship to modern-rock-madness-matches', () => {
    const allFields = flattenRowFields(ModernRockMadnessVotes.fields);
    const matchField = allFields.find((f) => f.name === 'match');
    expect(matchField?.type).toBe('relationship');
    expect(matchField?.relationTo).toBe('modern-rock-madness-matches');
  });

  it('has group as a relationship to modern-rock-madness-groups', () => {
    const allFields = flattenRowFields(ModernRockMadnessVotes.fields);
    const groupField = allFields.find((f) => f.name === 'group');
    expect(groupField?.type).toBe('relationship');
    expect(groupField?.relationTo).toBe('modern-rock-madness-groups');
  });

  it('has userId indexed for duplicate prevention', () => {
    const allFields = flattenRowFields(ModernRockMadnessVotes.fields);
    const userIdField = allFields.find((f) => f.name === 'userId');
    expect(userIdField?.index).toBe(true);
  });

  it('does not collect IP addresses (Auth0 handles duplicate prevention)', () => {
    const allFields = flattenRowFields(ModernRockMadnessVotes.fields);
    const names = allFields.map((f) => f.name);
    expect(names).not.toContain('voterIp');
  });

  it('has no legacyId or migratedAt fields', () => {
    const allFields = flattenRowFields(ModernRockMadnessVotes.fields);
    const names = allFields.map((f) => f.name);
    expect(names).not.toContain('legacyId');
    expect(names).not.toContain('migratedAt');
  });

  it('restricts read access to admin and editor roles', () => {
    const readFn = ModernRockMadnessVotes.access?.read as (args: {
      req: { user: unknown };
    }) => boolean;
    expect(readFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(readFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(readFn({ req: { user: { role: 'dj' } } })).toBe(false);
    expect(readFn({ req: { user: null } })).toBe(false);
  });

  it('allows any authenticated user to create a vote', () => {
    const createFn = ModernRockMadnessVotes.access?.create as (args: {
      req: { user: unknown };
    }) => boolean;
    expect(createFn({ req: { user: { id: 'auth0|123' } } })).toBe(true);
    expect(createFn({ req: { user: null } })).toBe(false);
    expect(createFn({ req: { user: undefined } })).toBe(false);
  });

  it('restricts update to admin role only', () => {
    const updateFn = ModernRockMadnessVotes.access?.update as (args: {
      req: { user: unknown };
    }) => boolean;
    expect(updateFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'editor' } } })).toBe(false);
    expect(updateFn({ req: { user: null } })).toBe(false);
  });

  it('restricts delete to admin role only', () => {
    const deleteFn = ModernRockMadnessVotes.access?.delete as (args: {
      req: { user: unknown };
    }) => boolean;
    expect(deleteFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(deleteFn({ req: { user: { role: 'editor' } } })).toBe(false);
    expect(deleteFn({ req: { user: null } })).toBe(false);
  });

  it('has timestamps enabled', () => {
    expect(ModernRockMadnessVotes.timestamps).toBe(true);
  });
});
