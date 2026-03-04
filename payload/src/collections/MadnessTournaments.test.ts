import { describe, expect, it } from 'vitest';
import { MadnessTournaments } from './MadnessTournaments';

describe('MadnessTournaments', () => {
  it('has the correct slug', () => {
    expect(MadnessTournaments.slug).toBe('madness-tournaments');
  });

  it('uses name as admin title', () => {
    expect(MadnessTournaments.admin?.useAsTitle).toBe('name');
  });

  it('is grouped under Modern Rock Madness', () => {
    expect(MadnessTournaments.admin?.group).toBe('Modern Rock Madness');
  });

  it('has required fields', () => {
    const fields = MadnessTournaments.fields as Array<{ name: string; required?: boolean }>;
    const requiredNames = fields.filter((f) => f.required).map((f) => f.name);
    expect(requiredNames).toContain('name');
    expect(requiredNames).toContain('year');
    expect(requiredNames).toContain('startDate');
    expect(requiredNames).toContain('status');
  });

  it('has draft as default status', () => {
    const fields = MadnessTournaments.fields as Array<{ name: string; defaultValue?: string }>;
    const statusField = fields.find((f) => f.name === 'status');
    expect(statusField?.defaultValue).toBe('draft');
  });

  it('has year as unique and indexed', () => {
    const fields = MadnessTournaments.fields as Array<{
      name: string;
      unique?: boolean;
      index?: boolean;
    }>;
    const yearField = fields.find((f) => f.name === 'year');
    expect(yearField?.unique).toBe(true);
    expect(yearField?.index).toBe(true);
  });

  it('has public read access', () => {
    const readFn = MadnessTournaments.access?.read;
    expect(typeof readFn).toBe('function');
    expect((readFn as () => boolean)()).toBe(true);
  });

  it('has timestamps enabled', () => {
    expect(MadnessTournaments.timestamps).toBe(true);
  });
});
