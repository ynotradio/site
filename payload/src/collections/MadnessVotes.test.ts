import { describe, expect, it } from 'vitest';
import { MadnessVotes } from './MadnessVotes';

describe('MadnessVotes', () => {
  it('has the correct slug', () => {
    expect(MadnessVotes.slug).toBe('madness-votes');
  });

  it('is grouped under Modern Rock Madness', () => {
    expect(MadnessVotes.admin?.group).toBe('Modern Rock Madness');
  });

  it('has required fields', () => {
    const fields = MadnessVotes.fields as Array<{ name: string; required?: boolean }>;
    const requiredNames = fields.filter((f) => f.required).map((f) => f.name);
    expect(requiredNames).toContain('match');
    expect(requiredNames).toContain('band');
    expect(requiredNames).toContain('voterIp');
  });

  it('has match as a relationship to madness-matches', () => {
    const fields = MadnessVotes.fields as Array<{
      name: string;
      type: string;
      relationTo?: string;
    }>;
    const matchField = fields.find((f) => f.name === 'match');
    expect(matchField?.type).toBe('relationship');
    expect(matchField?.relationTo).toBe('madness-matches');
  });

  it('has band as a relationship to madness-bands', () => {
    const fields = MadnessVotes.fields as Array<{
      name: string;
      type: string;
      relationTo?: string;
    }>;
    const bandField = fields.find((f) => f.name === 'band');
    expect(bandField?.type).toBe('relationship');
    expect(bandField?.relationTo).toBe('madness-bands');
  });

  it('has voterIp indexed for duplicate checking', () => {
    const fields = MadnessVotes.fields as Array<{ name: string; index?: boolean }>;
    const ipField = fields.find((f) => f.name === 'voterIp');
    expect(ipField?.index).toBe(true);
  });

  it('restricts read access to admin and editor roles', () => {
    const readFn = MadnessVotes.access?.read;
    expect(typeof readFn).toBe('function');
    // No user → should not allow read
    expect((readFn as (args: { req: { user: null } }) => boolean)({ req: { user: null } })).toBe(
      false,
    );
  });

  it('has timestamps enabled', () => {
    expect(MadnessVotes.timestamps).toBe(true);
  });
});
