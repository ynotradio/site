import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShows } from './useShows';

const mockApiResponse = {
  docs: [
    {
      id: '1',
      date: '2024-01-15T05:00:00.000Z',
      startTime: '10:00',
      endTime: '12:00',
      name: 'Morning Show',
      host: { id: '42', displayName: 'DJ Alpha' },
    },
    {
      id: '2',
      date: '2024-01-16T05:00:00.000Z',
      startTime: '14:00',
      endTime: '16:00',
      // No name or host
    },
  ],
  totalDocs: 2,
  limit: 0,
  totalPages: 1,
  page: 1,
};

describe('useShows', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with loading=true, empty shows, no error', () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });
    const { result } = renderHook(() => useShows());

    expect(result.current.loading).toBe(true);
    expect(result.current.shows).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('loads shows successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });
    const { result } = renderHook(() => useShows());

    await act(async () => {
      await result.current.loadShows();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.shows).toHaveLength(2);
    expect(result.current.shows[0].id).toBe('1');
    expect(result.current.shows[0].startTime).toBe('10:00');
    expect(result.current.shows[0].endTime).toBe('12:00');
    expect(result.current.shows[0].name).toBe('Morning Show');
    expect(result.current.shows[0].hostName).toBe('DJ Alpha');
  });

  it('maps show host to {id, displayName} object', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });
    const { result } = renderHook(() => useShows());

    await act(async () => {
      await result.current.loadShows();
    });

    expect(result.current.shows[0].host).toEqual({ id: '42', displayName: 'DJ Alpha' });
  });

  it('handles show with no host gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });
    const { result } = renderHook(() => useShows());

    await act(async () => {
      await result.current.loadShows();
    });

    expect(result.current.shows[1].host).toBeNull();
    expect(result.current.shows[1].hostName).toBeUndefined();
    expect(result.current.shows[1].name).toBeUndefined();
  });

  it('handles show with no date gracefully', async () => {
    const responseWithNoDate = {
      docs: [{ id: '3', startTime: '09:00', endTime: '10:00' }],
      totalDocs: 1,
      limit: 0,
      totalPages: 1,
      page: 1,
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => responseWithNoDate,
    });
    const { result } = renderHook(() => useShows());

    await act(async () => {
      await result.current.loadShows();
    });

    expect(result.current.shows[0].date).toBe('');
  });

  it('defaults startTime and endTime to empty string when undefined', async () => {
    const responseWithNoTimes = {
      docs: [{ id: '4', date: '2024-01-15T05:00:00.000Z' }],
      totalDocs: 1,
      limit: 0,
      totalPages: 1,
      page: 1,
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => responseWithNoTimes,
    });
    const { result } = renderHook(() => useShows());

    await act(async () => {
      await result.current.loadShows();
    });

    expect(result.current.shows[0].startTime).toBe('');
    expect(result.current.shows[0].endTime).toBe('');
  });

  it('sets error on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
    const { result } = renderHook(() => useShows());

    await act(async () => {
      await result.current.loadShows();
    });

    expect(result.current.error).toBe('Error loading shows. Please try again.');
    expect(result.current.loading).toBe(false);
    expect(result.current.shows).toEqual([]);
  });

  it('sets error on network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useShows());

    await act(async () => {
      await result.current.loadShows();
    });

    expect(result.current.error).toBe('Error loading shows. Please try again.');
    expect(result.current.loading).toBe(false);
  });

  it('fetches from correct URL with sort and limit params', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ docs: [], totalDocs: 0, limit: 0, totalPages: 1, page: 1 }),
    });
    const { result } = renderHook(() => useShows());

    await act(async () => {
      await result.current.loadShows();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/shows?limit=0&sort=-date,startTime');
  });
});
