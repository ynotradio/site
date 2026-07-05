import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAsyncSearch } from './useAsyncSearch';

describe('useAsyncSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial state with no selection', () => {
    const { result } = renderHook(() => useAsyncSearch('artists'));

    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.selected).toBeNull();
  });

  it('does not fetch when query is empty', async () => {
    const { result } = renderHook(() => useAsyncSearch('artists'));

    act(() => {
      result.current.setQuery('');
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('debounces fetch by 300ms', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ docs: [] }),
    });

    const { result } = renderHook(() => useAsyncSearch('artists'));

    act(() => {
      result.current.setQuery('radiohead');
    });

    // Not called yet
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(global.fetch).not.toHaveBeenCalled();

    // Called after debounce
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/artists?where[name][contains]=radiohead&limit=10&sort=name',
    );
  });

  it('populates results on successful fetch', async () => {
    const mockResults = [
      { id: 1, name: 'Radiohead' },
      { id: 2, name: 'Radio Moscow' },
    ];
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ docs: mockResults }),
    });

    const { result } = renderHook(() => useAsyncSearch('artists'));

    act(() => {
      result.current.setQuery('radio');
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.results).toEqual(mockResults);
  });

  it('clears results when query is cleared', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ docs: [{ id: 1, name: 'Radiohead' }] }),
    });

    const { result } = renderHook(() => useAsyncSearch('artists'));

    act(() => {
      result.current.setQuery('radio');
    });
    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    act(() => {
      result.current.setQuery('');
    });

    expect(result.current.results).toEqual([]);
  });

  it('selects an item and clears search state', () => {
    const { result } = renderHook(() => useAsyncSearch('artists'));

    act(() => {
      result.current.select({ id: 42, name: 'Radiohead' });
    });

    expect(result.current.selected).toEqual({ id: 42, name: 'Radiohead' });
    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
  });

  it('clears selection and search state', () => {
    const { result } = renderHook(() => useAsyncSearch('artists'));

    act(() => {
      result.current.select({ id: 42, name: 'Radiohead' });
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.selected).toBeNull();
    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
  });

  it('does not update results when fetch response is not ok', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Not found' }),
    });

    const { result } = renderHook(() => useAsyncSearch('artists'));

    act(() => {
      result.current.setQuery('xyz');
    });

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current.results).toEqual([]);
  });

  it('sets isSearching to false after fetch completes', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ docs: [] }),
    });

    const { result } = renderHook(() => useAsyncSearch('artists'));

    act(() => {
      result.current.setQuery('xyz');
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.isSearching).toBe(false);
  });
});
