import { describe, expect, it } from 'vitest';
import { Top11Contestants } from './Top11Contestants';
import { flattenRowFields } from './testUtils';

describe('Top11Contestants', () => {
  it('has expected slug and group', () => {
    expect(Top11Contestants.slug).toBe('top11-contestants');
    expect(Top11Contestants.admin?.group).toBe('Polls & Contests');
  });

  it('contains contestant identity fields', () => {
    const allFields = flattenRowFields(Top11Contestants.fields);
    const names = allFields.map((field) => field.name);

    expect(names).toContain('contest');
    expect(names).toContain('firstName');
    expect(names).toContain('lastName');
    expect(names).toContain('email');
    expect(names).toContain('newsletterOptIn');
  });

  it('provides csv export endpoint', () => {
    const endpoints = Top11Contestants.endpoints ?? [];
    expect(endpoints.map((endpoint) => endpoint.path)).toContain('/export');
  });

  it('permits public contestant creation and restricts read to managers', () => {
    const createFn = Top11Contestants.access?.create as () => boolean;
    const readFn = Top11Contestants.access?.read as (args: { req: { user: unknown } }) => boolean;

    expect(createFn()).toBe(true);
    expect(readFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(readFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(readFn({ req: { user: null } })).toBe(false);
  });
});
