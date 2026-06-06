import { describe, expect, it } from 'vitest';
import { Top11Contests } from './Top11Contests';
import { flattenRowFields } from './testUtils';

describe('Top11Contests', () => {
  it('has expected slug and grouping', () => {
    expect(Top11Contests.slug).toBe('top11-contests');
    expect(Top11Contests.admin?.group).toBe('Polls & Contests');
  });

  it('uses immutable lifecycle statuses', () => {
    const allFields = flattenRowFields(Top11Contests.fields);
    const statusField = allFields.find((field) => field.name === 'status') as {
      options?: Array<{ value: string }>;
      defaultValue?: string;
    };

    expect(statusField?.defaultValue).toBe('draft');
    expect(statusField?.options?.map((option) => option.value)).toEqual([
      'draft',
      'open',
      'closed',
      'published',
      'archived',
    ]);
  });

  it('has entries array with max 11 rows', () => {
    const entriesField = Top11Contests.fields.find((field) => field.name === 'entries') as {
      type?: string;
      minRows?: number;
      maxRows?: number;
    };

    expect(entriesField.type).toBe('array');
    expect(entriesField.minRows).toBe(1);
    expect(entriesField.maxRows).toBe(11);
  });

  it('exposes lifecycle and operations endpoints', () => {
    const endpoints = Top11Contests.endpoints ?? [];
    const paths = endpoints.map((endpoint) => endpoint.path);

    expect(paths).toContain('/:id/open');
    expect(paths).toContain('/:id/close');
    expect(paths).toContain('/:id/publish');
    expect(paths).toContain('/:id/archive');
    expect(paths).toContain('/clone');
    expect(paths).toContain('/:id/stats');
    expect(paths).toContain('/:id/pick-winner');
  });
});
