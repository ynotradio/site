/**
 * Unit tests for duplicate-artist prevention.
 */
import { describe, it, expect, vi } from 'vitest';
import { normalizeArtistName, preventDuplicateArtistName } from './artistDedup';

function mockReq(existing: Array<{ id: number; name: string }>) {
  return {
    payload: { find: vi.fn().mockResolvedValue({ docs: existing }) },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const call = (args: Record<string, unknown>) => preventDuplicateArtistName(args as any);

describe('normalizeArtistName', () => {
  it('lowercases, collapses whitespace, and trims', () => {
    expect(normalizeArtistName('  Pet   Shop  Boys ')).toBe('pet shop boys');
    expect(normalizeArtistName('PET SHOP BOYS')).toBe('pet shop boys');
  });
});

describe('preventDuplicateArtistName', () => {
  it('blocks a create that collides under normalized comparison', async () => {
    const req = mockReq([{ id: 1, name: 'Pet Shop Boys' }]);
    await expect(
      call({ data: { name: 'pet shop boys' }, req, operation: 'create' }),
    ).rejects.toThrow(/already exists/);
  });

  it('allows a create with a genuinely new name', async () => {
    const req = mockReq([{ id: 1, name: 'Pet Shop Boys' }]);
    const data = { name: 'The National' };
    await expect(call({ data, req, operation: 'create' })).resolves.toEqual(data);
  });

  it('does not treat a contains-only match as a duplicate', async () => {
    // Searching "Cure" returns "The Cure" via `like`, but it is not a duplicate.
    const req = mockReq([{ id: 1, name: 'The Cure' }]);
    const data = { name: 'Cure' };
    await expect(call({ data, req, operation: 'create' })).resolves.toEqual(data);
  });

  it('skips the check on update when the name is unchanged', async () => {
    const req = mockReq([{ id: 1, name: 'Pet Shop Boys' }]);
    await call({
      data: { name: 'Pet Shop Boys', website: 'https://x' },
      req,
      operation: 'update',
      originalDoc: { id: 1, name: 'Pet Shop Boys' },
    });
    expect(req.payload.find).not.toHaveBeenCalled();
  });

  it('does not collide with itself when renaming casing on update', async () => {
    const req = mockReq([{ id: 1, name: 'Pet Shop Boys' }]);
    const data = { name: 'PET SHOP BOYS' };
    await expect(
      call({ data, req, operation: 'update', originalDoc: { id: 1, name: 'Pet Shop Boys' } }),
    ).resolves.toEqual(data);
  });

  it('passes through when no name is present', async () => {
    const req = mockReq([]);
    const data = { website: 'https://x' };
    await expect(call({ data, req, operation: 'update', originalDoc: { id: 1 } })).resolves.toEqual(
      data,
    );
    expect(req.payload.find).not.toHaveBeenCalled();
  });
});
