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
      await result.current.handleToggleShowScore();
      await result.current.handleScheduleRematch('2025-01-01T14:00:00.000Z', 30);
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('handleToggleShowScore patches showScore from false to true', async () => {
    const patchCalls: Array<{ url: string; body: object }> = [];
    global.fetch = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      patchCalls.push({ url: String(url), body: JSON.parse(opts?.body as string) });
      return { ok: true, json: async () => ({}) };
    });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const match = makeMatch({ showScore: false });
    const { result } = renderHook(() => useMatchActions(match, onComplete));

    await act(async () => {
      await result.current.handleToggleShowScore();
    });

    const patchCall = patchCalls.find(({ body }) => 'showScore' in body);
    expect(patchCall?.body).toMatchObject({ showScore: true });
    expect(result.current.successMessage).toBe('Show scores succeeded.');
  });

  it('handleToggleShowScore patches showScore from true to false', async () => {
    const patchCalls: Array<{ url: string; body: object }> = [];
    global.fetch = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      patchCalls.push({ url: String(url), body: JSON.parse(opts?.body as string) });
      return { ok: true, json: async () => ({}) };
    });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const match = makeMatch({ showScore: true });
    const { result } = renderHook(() => useMatchActions(match, onComplete));

    await act(async () => {
      await result.current.handleToggleShowScore();
    });

    const patchCall = patchCalls.find(({ body }) => 'showScore' in body);
    expect(patchCall?.body).toMatchObject({ showScore: false });
    expect(result.current.successMessage).toBe('Hide scores succeeded.');
  });

  it('handleScheduleRematch resets votes and sets new times', async () => {
    const patchCalls: Array<{ url: string; body: object }> = [];
    global.fetch = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      patchCalls.push({ url: String(url), body: JSON.parse(opts?.body as string) });
      return { ok: true, json: async () => ({}) };
    });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const match = makeMatch({ band1Votes: 500, band2Votes: 400 });
    const { result } = renderHook(() => useMatchActions(match, onComplete));

    const startISO = '2025-04-01T14:00:00.000Z';
    await act(async () => {
      await result.current.handleScheduleRematch(startISO, 60);
    });

    const patchCall = patchCalls.find(({ body }) => 'band1Votes' in body);
    expect(patchCall?.body).toMatchObject({
      band1Votes: 0,
      band2Votes: 0,
      winner: null,
      showScore: false,
      startTime: startISO,
      endTime: new Date(new Date(startISO).getTime() + 60 * 60_000).toISOString(),
    });
    expect(result.current.successMessage).toBe('Schedule rematch succeeded.');
    expect(onComplete).toHaveBeenCalled();
  });

  it('handleCloseMatch does nothing when band1 is null', async () => {
    global.fetch = vi.fn();
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const match = makeMatch({ band1: null });
    const { result } = renderHook(() => useMatchActions(match, onComplete));

    await act(async () => {
      await result.current.handleCloseMatch();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('handleCloseMatch does nothing when band2 is a string reference', async () => {
    global.fetch = vi.fn();
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const match = makeMatch({ band2: 'band-id-string' as unknown as typeof BAND2 });
    const { result } = renderHook(() => useMatchActions(match, onComplete));

    await act(async () => {
      await result.current.handleCloseMatch();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('handleCloseMatch advances winner to band1 slot when nextMatch band1 is empty', async () => {
    const patchCalls: Array<{ url: string; body: object }> = [];
    global.fetch = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      patchCalls.push({ url: String(url), body: JSON.parse(opts?.body as string) });
      return { ok: true, json: async () => ({}) };
    });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const match = makeMatch({
      band1Votes: 2000,
      band2Votes: 900,
      nextMatch: { id: 'next-match', matchNumber: 33, band1: null, band2: null },
    });
    const { result } = renderHook(() => useMatchActions(match, onComplete));

    await act(async () => {
      await result.current.handleCloseMatch();
    });

    const advanceCall = patchCalls.find(({ url }) => url.includes('next-match'));
    expect(advanceCall?.body).toMatchObject({ band1: 'b1' });
    expect(result.current.successMessage).toBe('Close match succeeded.');
  });

  it('handleCloseMatch advances winner to band2 slot when nextMatch band1 is filled', async () => {
    const patchCalls: Array<{ url: string; body: object }> = [];
    global.fetch = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      patchCalls.push({ url: String(url), body: JSON.parse(opts?.body as string) });
      return { ok: true, json: async () => ({}) };
    });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const NEXT_BAND1 = { id: 'b3', name: 'Pearl Jam', seed: 2, placement: 1 };
    const match = makeMatch({
      band1Votes: 100,
      band2Votes: 900,
      nextMatch: { id: 'next-match', matchNumber: 33, band1: NEXT_BAND1, band2: null },
    });
    const { result } = renderHook(() => useMatchActions(match, onComplete));

    await act(async () => {
      await result.current.handleCloseMatch();
    });

    const advanceCall = patchCalls.find(({ url }) => url.includes('next-match'));
    expect(advanceCall?.body).toMatchObject({ band2: 'b2' });
  });

  it('handleCloseMatch skips bracket progression when nextMatch is a string', async () => {
    const patchCalls: Array<{ url: string; body: object }> = [];
    global.fetch = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      patchCalls.push({ url: String(url), body: JSON.parse(opts?.body as string) });
      return { ok: true, json: async () => ({}) };
    });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const match = makeMatch({
      band1Votes: 2000,
      band2Votes: 900,
      nextMatch: 'next-match-id-string',
    });
    const { result } = renderHook(() => useMatchActions(match, onComplete));

    await act(async () => {
      await result.current.handleCloseMatch();
    });

    // Only the primary PATCH and the log event POST should be called, not a bracket progression
    const advanceCall = patchCalls.find(({ url }) => url.includes('next-match-id-string'));
    expect(advanceCall).toBeUndefined();
    expect(result.current.successMessage).toBe('Close match succeeded.');
  });

  it('handleCloseMatch skips advancement when both nextMatch slots are already filled', async () => {
    const patchCalls: Array<{ url: string; body: object }> = [];
    global.fetch = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      patchCalls.push({ url: String(url), body: JSON.parse(opts?.body as string) });
      return { ok: true, json: async () => ({}) };
    });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const NEXT_BAND1 = { id: 'b3', name: 'Pearl Jam', seed: 2, placement: 1 };
    const NEXT_BAND2 = { id: 'b4', name: 'Soundgarden', seed: 3, placement: 2 };
    const match = makeMatch({
      band1Votes: 2000,
      band2Votes: 900,
      nextMatch: { id: 'next-match', matchNumber: 33, band1: NEXT_BAND1, band2: NEXT_BAND2 },
    });
    const { result } = renderHook(() => useMatchActions(match, onComplete));

    await act(async () => {
      await result.current.handleCloseMatch();
    });

    const advanceCall = patchCalls.find(({ url }) => url.includes('next-match'));
    expect(advanceCall).toBeUndefined();
    expect(result.current.successMessage).toBe('Close match succeeded.');
  });

  it('handleCloseMatch logs error but still succeeds when bracket progression PATCH fails', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      if (String(url).includes('next-match') && opts?.method === 'PATCH') {
        return { ok: false, status: 500, json: async () => ({}) };
      }
      return { ok: true, json: async () => ({}) };
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const match = makeMatch({
      band1Votes: 2000,
      band2Votes: 900,
      nextMatch: { id: 'next-match', matchNumber: 33, band1: null, band2: null },
    });
    const { result } = renderHook(() => useMatchActions(match, onComplete));

    await act(async () => {
      await result.current.handleCloseMatch();
    });

    // Operation still succeeds - bracket failure is logged but not thrown
    expect(result.current.successMessage).toBe('Close match succeeded.');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Bracket progression PATCH failed'));
  });
});
