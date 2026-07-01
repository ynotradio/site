import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContestActions } from './useContestActions';

describe('useContestActions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with saving=false and no messages', () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useContestActions(1, onComplete));
    expect(result.current.saving).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.successMessage).toBeNull();
  });

  it('handleSetStatus posts to the matching lifecycle endpoint', async () => {
    let calledUrl = '';
    let calledMethod = '';
    global.fetch = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      calledUrl = String(url);
      calledMethod = opts?.method ?? '';
      return { ok: true, json: async () => ({}) };
    });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useContestActions(1, onComplete));

    await act(async () => {
      await result.current.handleSetStatus('open');
    });

    expect(calledUrl).toBe('/api/top11-contests/1/open');
    expect(calledMethod).toBe('POST');
    expect(result.current.successMessage).toMatch(/status set to open/i);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('surfaces the server error message on a failed status transition', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ errors: [{ message: 'Invalid Top 11 contest status transition' }] }),
    });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useContestActions(1, onComplete));

    await act(async () => {
      await result.current.handleSetStatus('published');
    });

    expect(result.current.error).toBe('Invalid Top 11 contest status transition');
    expect(result.current.successMessage).toBeNull();
  });

  it('handleClone posts sourceContestId and reports the new contest id', async () => {
    let body: Record<string, unknown> | null = null;
    global.fetch = vi.fn().mockImplementation(async (_url: string, opts?: RequestInit) => {
      body = JSON.parse(opts?.body as string);
      return { ok: true, json: async () => ({ doc: { id: 99 } }) };
    });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useContestActions(1, onComplete));

    await act(async () => {
      await result.current.handleClone();
    });

    expect(body).toEqual({ sourceContestId: 1 });
    expect(result.current.successMessage).toMatch(/Cloned as new draft contest #99/);
  });

  it('handlePickWinner stores the winner result on success', async () => {
    const winnerResult = {
      winner: {
        id: 5,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
      },
      drawLogId: 1,
      totalEntries: 3,
      eligibleEntries: 2,
      excludePriorWinners: true,
    };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => winnerResult });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useContestActions(1, onComplete));

    await act(async () => {
      await result.current.handlePickWinner();
    });

    expect(result.current.lastWinner).toEqual(winnerResult);
    expect(result.current.successMessage).toMatch(/Winner picked: Jane Doe/);
  });

  it('does nothing when contestId is undefined', async () => {
    global.fetch = vi.fn();
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useContestActions(undefined, onComplete));

    await act(async () => {
      await result.current.handleSetStatus('open');
      await result.current.handleClone();
      await result.current.handlePickWinner();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
