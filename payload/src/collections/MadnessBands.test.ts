import { describe, expect, it } from 'vitest';
import { MadnessBands } from './MadnessBands';

describe('MadnessBands', () => {
  it('has the correct slug', () => {
    expect(MadnessBands.slug).toBe('madness-bands');
  });

  it('uses name as admin title', () => {
    expect(MadnessBands.admin?.useAsTitle).toBe('name');
  });

  it('is grouped under Modern Rock Madness', () => {
    expect(MadnessBands.admin?.group).toBe('Modern Rock Madness');
  });

  it('has required fields', () => {
    const fields = MadnessBands.fields as Array<{ name: string; required?: boolean }>;
    const requiredNames = fields.filter((f) => f.required).map((f) => f.name);
    expect(requiredNames).toContain('tournament');
    expect(requiredNames).toContain('name');
    expect(requiredNames).toContain('seed');
    expect(requiredNames).toContain('placement');
  });

  it('has tournament as a relationship to madness-tournaments', () => {
    const fields = MadnessBands.fields as Array<{
      name: string;
      type: string;
      relationTo?: string;
    }>;
    const tournamentField = fields.find((f) => f.name === 'tournament');
    expect(tournamentField?.type).toBe('relationship');
    expect(tournamentField?.relationTo).toBe('madness-tournaments');
  });

  it('enforces abbreviation max length of 7', () => {
    const fields = MadnessBands.fields as Array<{ name: string; maxLength?: number }>;
    const abbrField = fields.find((f) => f.name === 'abbreviation');
    expect(abbrField?.maxLength).toBe(7);
  });

  it('has public read access', () => {
    const readFn = MadnessBands.access?.read;
    expect(typeof readFn).toBe('function');
    expect((readFn as () => boolean)()).toBe(true);
  });

  it('has timestamps enabled', () => {
    expect(MadnessBands.timestamps).toBe(true);
  });
});
