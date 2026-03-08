import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMatchActions } from './useMatchActions';
import type { LiveMatch } from './types';

const BAND1 = { id: 'b1', name: 'Radiohead', seed: 1, placement: 1 };
const BAND2 = { id: 'b2', name: 'Nirvana', seed: 1, placement: 2 };

const makeMatch = (overrides: Partial<LiveMatch> = {}): LiveMatch => ({
  id: 'match-1',
  matchNumber: 1,
  round: '1',
  band1Votes: 1200,
  band2Votes: 900,
  band1: BAND1,
  band2: BAND2,
  startTime: new Date(Date.now() - 60_000).toISOString(),
  endTime: new Date(Date.now() + 60_000).toISOString(),
  winner: null,
  showScore: false,
  ...overrides,
});

describe('useMatchActions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with saving=false and no messages', () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useMatchActions(makeMatch(), onComplete));
    expect(result.current.saving).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.successMessage).toBeNull();
  });

  it('handleManualVote patches band1Votes and calls onComplete', async () => {
    let patchBody: object | null = null;
    global.fetch = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      if (opts?.method === 'PATCH') {
        patchBody = JSON.parse(opts.body as string);
      }
      return { ok: true, json: async () => ({}) };
    });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const match = makeMatch({ band1Votes: 1200, band2Votes: 900 });
    const { result } = renderHook(() => useMatchActions(match, onComplete));

    await act(async () => {
      await result.current.handleManualVote('band1');
    });

    expect(patchBody).toMatchObject({ band1Votes: 1201 });
    expect(result.current.successMessage).toBe('Manual vote succeeded.');
    expect(onComplete).toHaveBeenCalled();
  });

  it('handleManualVote patches band2Votes when band2 is chosen', async () => {
    let patchBody: object | null = null;
    global.fetch = vi.fn().mockImplementation(async (_url: string, opts?: RequestInit) => {
      if (opts?.method === 'PATCH') {
        patchBody = JSON.parse(opts.body as string);
      }
      return { ok: true, json: async () => ({}) };
    });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const match = makeMatch({ band1Votes: 1200, band2Votes: 900 });
    const { result } = renderHook(() => useMatchActions(match, onComplete));

    await act(async () => {
      await result.current.handleManualVote('band2');
    });

    expect(patchBody).toMatchObject({ band2Votes: 901 });
  });

  it('handleCloseMatch sets winner to band with more votes', async () => {
    let patchBody: object | null = null;
    global.fetch = vi.fn().mockImplementation(async (_url: string, opts?: RequestInit) => {
      if (opts?.method === 'PATCH') {
        patchBody = JSON.parse(opts.body as string);
      }
      return { ok: true, json: async () => ({}) };
    });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const match = makeMatch({ band1Votes: 2000, band2Votes: 900 });
    const { result } = renderHook(() => useMatchActions(match, onComplete));

    await act(async () => {
      await result.current.handleCloseMatch();
    });

    expect(patchBody).toMatchObject({ winner: 'b1' });
    expect(result.current.successMessage).toBe('Close match succeeded.');
  });

  it('handleExtendOvertime extends from match endTime (not from now)', async () => {
    const patchCalls: Array<{ url: string; body: object }> = [];
    global.fetch = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      if (opts?.method === 'PATCH' || opts?.method === 'POST') {
        patchCalls.push({ url: String(url), body: JSON.parse(opts.body as string) });
      }
      return { ok: true, json: async () => ({}) };
    });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const endTime = new Date(Date.now() - 60_000).toISOString(); // ended 1 min ago
    const match = makeMatch({ endTime });
    const { result } = renderHook(() => useMatchActions(match, onComplete));

    await act(async () => {
      await result.current.handleExtendOvertime();
    });

    expect(result.current.successMessage).toBe('Extend overtime succeeded.');
    const patchCall = patchCalls.find(({ body }) => 'endTime' in body);
    // New endTime should be 15 min after the old endTime, not 15 min after now
    const expectedEnd = new Date(new Date(endTime).getTime() + 15 * 60 * 1000).toISOString();
    expect(patchCall?.body).toMatchObject({ endTime: expectedEnd });
    const eventCall = patchCalls.find(({ body }) => 'eventType' in body);
    expect(eventCall?.body).toMatchObject({ eventType: 'overtime_extended' });
  });

  it('handleCloseMatch throws if match is tied', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const match = makeMatch({ band1Votes: 1000, band2Votes: 1000 });
    const { result } = renderHook(() => useMatchActions(match, onComplete));

    await act(async () => {
      await result.current.handleCloseMatch();
    });

    // The error is caught by withSaving and surfaced in error state
    expect(result.current.error).toBe('Close match failed. Please try again.');
  });

  it('sets error state when PATCH fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useMatchActions(makeMatch(), onComplete));

    await act(async () => {
      await result.current.handleManualVote('band1');
    });

    expect(result.current.error).toBe('Manual vote failed. Please try again.');
    expect(result.current.successMessage).toBeNull();
  });

  it('does nothing when match is null', async () => {
    global.fetch = vi.fn();
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useMatchActions(null, onComplete));

    await act(async () => {
      await result.current.handleManualVote('band1');
      await result.current.handleCloseMatch();
      await result.current.handleExtendOvertime();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
