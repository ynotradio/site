import { describe, expect, it, vi } from 'vitest';
import { APIError } from 'payload';
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

  describe('duplicate entry prevention', () => {
    const beforeChangeHook = Top11Contestants.hooks?.beforeChange?.[0];

    it('rejects a second entry with the same email in the same contest', async () => {
      const find = vi.fn().mockResolvedValue({ docs: [{ id: 1 }] });
      const req = { payload: { find } };
      const data = { contest: 1, email: 'jane@example.com' };

      await expect(beforeChangeHook?.({ operation: 'create', data, req } as never)).rejects.toThrow(
        APIError,
      );
      await expect(beforeChangeHook?.({ operation: 'create', data, req } as never)).rejects.toThrow(
        'This email has already entered the current Top 11 contest',
      );
    });

    it('allows the first entry for an email in a contest', async () => {
      const find = vi.fn().mockResolvedValue({ docs: [] });
      const req = { payload: { find } };
      const data = { contest: 1, email: 'new@example.com' };

      const result = await beforeChangeHook?.({ operation: 'create', data, req } as never);
      expect(result).toBe(data);
    });

    it('is case-insensitive when checking for a duplicate email', async () => {
      const find = vi.fn().mockResolvedValue({ docs: [{ id: 1 }] });
      const req = { payload: { find } };
      const data = { contest: 1, email: 'Jane@Example.com' };

      await expect(beforeChangeHook?.({ operation: 'create', data, req } as never)).rejects.toThrow(
        APIError,
      );
      expect(find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            and: [{ contest: { equals: 1 } }, { email: { equals: 'jane@example.com' } }],
          },
        }),
      );
    });

    it('skips the dedup check on update operations', async () => {
      const find = vi.fn();
      const req = { payload: { find } };
      const data = { contest: 1, email: 'jane@example.com' };

      const result = await beforeChangeHook?.({ operation: 'update', data, req } as never);
      expect(result).toBe(data);
      expect(find).not.toHaveBeenCalled();
    });
  });
});
