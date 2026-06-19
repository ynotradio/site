import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Field } from 'payload';
import { Shows } from '../../../collections/Shows';
import { useShowCloner } from './useShowCloner';
import type { Show } from '../types';

function collectFieldNames(fields: Field[]): string[] {
  return fields.flatMap((field) => {
    const nested = 'fields' in field && Array.isArray(field.fields)
      ? collectFieldNames(field.fields as Field[])
      : [];
    return 'name' in field ? [field.name as string, ...nested] : nested;
  });
}

const makeShow = (overrides: Partial<Show> = {}): Show => ({
  id: '1',
  date: '2024-01-15',
  startTime: '10:00',
  endTime: '12:00',
  name: 'Morning Show',
  host: { id: '42', displayName: 'DJ Alpha' },
  ...overrides,
});

const shows: Show[] = [
  makeShow({ id: '1', date: '2024-01-15' }),
  makeShow({ id: '2', date: '2024-01-16', name: undefined, host: null }),
];

describe('useShowCloner', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('accounts for every Shows field — add new fields to cloned or excluded list', () => {
    // When you add a field to the Shows collection this test will fail.
    // Decide whether the new field should be copied to cloned shows and add it
    // to the appropriate list below, then update useShowCloner.ts accordingly.
    const cloned = new Set(['date', 'startTime', 'endTime', 'name', 'host', 'note']);
    const excluded = new Set(['legacyId', 'migratedAt']); // not meaningful on a fresh clone

    const unaccounted = collectFieldNames(Shows.fields as Field[])
      .filter((f) => !cloned.has(f) && !excluded.has(f));

    expect(unaccounted).toEqual([]);
  });

  it('starts with idle state', () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useShowCloner(shows, onComplete));

    expect(result.current.cloning).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.successMessage).toBeNull();
  });

  it('sets error when dates are missing', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useShowCloner(shows, onComplete));

    await act(async () => {
      await result.current.cloneShows('', '', '');
    });

    expect(result.current.error).toBe('Please select a source date range and target start date');
    expect(result.current.cloning).toBe(false);
  });

  it('sets error when source start is after source end', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useShowCloner(shows, onComplete));

    await act(async () => {
      await result.current.cloneShows('2024-01-20', '2024-01-15', '2024-02-01');
    });

    expect(result.current.error).toBe('Source start date must be before or equal to end date');
  });

  it('sets error when source and target ranges overlap', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useShowCloner(shows, onComplete));

    // Source: Jan 15-16, Target: Jan 16 (overlaps)
    await act(async () => {
      await result.current.cloneShows('2024-01-15', '2024-01-16', '2024-01-16');
    });

    expect(result.current.error).toBe('Source and target date ranges cannot overlap');
  });

  it('sets error when no shows in source date range', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useShowCloner(shows, onComplete));

    await act(async () => {
      await result.current.cloneShows('2024-03-01', '2024-03-07', '2024-04-01');
    });

    expect(result.current.error).toBe('No shows found in the source date range');
    expect(result.current.cloning).toBe(false);
  });

  it('successfully clones shows and calls onComplete', async () => {
    const fetchedBodies: object[] = [];
    global.fetch = vi.fn().mockImplementation(async (_url: string, opts?: RequestInit) => {
      fetchedBodies.push(JSON.parse(opts?.body as string));
      return { ok: true, json: async () => ({}) };
    });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useShowCloner(shows, onComplete));

    await act(async () => {
      await result.current.cloneShows('2024-01-15', '2024-01-16', '2024-02-05');
    });

    expect(result.current.error).toBeNull();
    expect(result.current.successMessage).toMatch(/Successfully cloned 2 show\(s\)/);
    expect(result.current.cloning).toBe(false);
    expect(onComplete).toHaveBeenCalled();
    expect(fetchedBodies).toHaveLength(2);
  });

  it('preserves day offsets when cloning multiple shows', async () => {
    const fetchedBodies: { date: string }[] = [];
    global.fetch = vi.fn().mockImplementation(async (_url: string, opts?: RequestInit) => {
      fetchedBodies.push(JSON.parse(opts?.body as string));
      return { ok: true, json: async () => ({}) };
    });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useShowCloner(shows, onComplete));

    await act(async () => {
      await result.current.cloneShows('2024-01-15', '2024-01-16', '2024-02-05');
    });

    // Second show is 1 day after first, so target dates should also be 1 day apart
    const [first, second] = fetchedBodies;
    expect(first.date).toBe('2024-02-05');
    expect(second.date).toBe('2024-02-06');
  });

  it('converts numeric host ids to numbers', async () => {
    const fetchedBodies: { host?: number | string }[] = [];
    global.fetch = vi.fn().mockImplementation(async (_url: string, opts?: RequestInit) => {
      fetchedBodies.push(JSON.parse(opts?.body as string));
      return { ok: true, json: async () => ({}) };
    });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const showWithNumericHost: Show[] = [
      makeShow({ id: '1', date: '2024-01-15', host: { id: '42', displayName: 'DJ' } }),
    ];
    const { result } = renderHook(() => useShowCloner(showWithNumericHost, onComplete));

    await act(async () => {
      await result.current.cloneShows('2024-01-15', '2024-01-15', '2024-02-05');
    });

    expect(fetchedBodies[0].host).toBe(42);
  });

  it('keeps string host id when not numeric', async () => {
    const fetchedBodies: { host?: number | string }[] = [];
    global.fetch = vi.fn().mockImplementation(async (_url: string, opts?: RequestInit) => {
      fetchedBodies.push(JSON.parse(opts?.body as string));
      return { ok: true, json: async () => ({}) };
    });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const showWithStringHost: Show[] = [
      makeShow({ id: '1', date: '2024-01-15', host: { id: 'abc-uuid', displayName: 'DJ' } }),
    ];
    const { result } = renderHook(() => useShowCloner(showWithStringHost, onComplete));

    await act(async () => {
      await result.current.cloneShows('2024-01-15', '2024-01-15', '2024-02-05');
    });

    expect(fetchedBodies[0].host).toBe('abc-uuid');
  });

  it('handles string host id directly (not wrapped in object)', async () => {
    const fetchedBodies: { host?: number | string }[] = [];
    global.fetch = vi.fn().mockImplementation(async (_url: string, opts?: RequestInit) => {
      fetchedBodies.push(JSON.parse(opts?.body as string));
      return { ok: true, json: async () => ({}) };
    });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const showWithStringHost: Show[] = [
      makeShow({ id: '1', date: '2024-01-15', host: '99' }),
    ];
    const { result } = renderHook(() => useShowCloner(showWithStringHost, onComplete));

    await act(async () => {
      await result.current.cloneShows('2024-01-15', '2024-01-15', '2024-02-05');
    });

    expect(fetchedBodies[0].host).toBe(99);
  });

  it('omits host from payload when host object has an empty id', async () => {
    const fetchedBodies: { host?: number | string }[] = [];
    global.fetch = vi.fn().mockImplementation(async (_url: string, opts?: RequestInit) => {
      fetchedBodies.push(JSON.parse(opts?.body as string));
      return { ok: true, json: async () => ({}) };
    });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const showWithEmptyHostId: Show[] = [
      makeShow({ id: '1', date: '2024-01-15', host: { id: '', displayName: 'Unknown' } }),
    ];
    const { result } = renderHook(() => useShowCloner(showWithEmptyHostId, onComplete));

    await act(async () => {
      await result.current.cloneShows('2024-01-15', '2024-01-15', '2024-02-05');
    });

    expect(fetchedBodies[0].host).toBeUndefined();
  });

  it('clones the note field when present', async () => {
    const fetchedBodies: { note?: unknown }[] = [];
    global.fetch = vi.fn().mockImplementation(async (_url: string, opts?: RequestInit) => {
      fetchedBodies.push(JSON.parse(opts?.body as string));
      return { ok: true, json: async () => ({}) };
    });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const lexicalNote = { root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Best Of episode' }] }] } };
    const showWithNote: Show[] = [
      makeShow({ id: '1', date: '2024-01-15', note: lexicalNote }),
    ];
    const { result } = renderHook(() => useShowCloner(showWithNote, onComplete));

    await act(async () => {
      await result.current.cloneShows('2024-01-15', '2024-01-15', '2024-02-05');
    });

    expect(fetchedBodies[0].note).toEqual(lexicalNote);
  });

  it('omits note from payload when note is absent', async () => {
    const fetchedBodies: { note?: unknown }[] = [];
    global.fetch = vi.fn().mockImplementation(async (_url: string, opts?: RequestInit) => {
      fetchedBodies.push(JSON.parse(opts?.body as string));
      return { ok: true, json: async () => ({}) };
    });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const showWithoutNote: Show[] = [
      makeShow({ id: '1', date: '2024-01-15', note: undefined }),
    ];
    const { result } = renderHook(() => useShowCloner(showWithoutNote, onComplete));

    await act(async () => {
      await result.current.cloneShows('2024-01-15', '2024-01-15', '2024-02-05');
    });

    expect(fetchedBodies[0].note).toBeUndefined();
  });

  it('sets error on fetch failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useShowCloner(shows, onComplete));

    await act(async () => {
      await result.current.cloneShows('2024-01-15', '2024-01-16', '2024-02-05');
    });

    expect(result.current.error).toBe('Error cloning shows. Please try again.');
    expect(result.current.cloning).toBe(false);
  });

  it('clearMessages clears error and successMessage', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useShowCloner(shows, onComplete));

    // Set an error first
    await act(async () => {
      await result.current.cloneShows('', '', '');
    });
    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.successMessage).toBeNull();
  });
});
