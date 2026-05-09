import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResolveArtistName } from './useResolveArtistName';

describe('useResolveArtistName', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns empty string when artistFieldValue is null', async () => {
    const { result } = renderHook(() => useResolveArtistName(null));
    const name = await act(() => result.current());
    expect(name).toBe('');
  });

  it('returns empty string when artistFieldValue is undefined', async () => {
    const { result } = renderHook(() => useResolveArtistName(undefined));
    const name = await act(() => result.current());
    expect(name).toBe('');
  });

  it('returns empty string when artistFieldValue is a non-object non-primitive (e.g. a function)', async () => {
    const { result } = renderHook(() => useResolveArtistName(() => 'noop'));
    const name = await act(() => result.current());
    expect(name).toBe('');
  });

  it('resolves artist name directly when value has a name property', async () => {
    const { result } = renderHook(() => useResolveArtistName({ name: 'Direct Artist' }));
    const name = await act(() => result.current());
    expect(name).toBe('Direct Artist');
  });

  it('trims whitespace from direct name', async () => {
    const { result } = renderHook(() => useResolveArtistName({ name: '  Trimmed Artist  ' }));
    const name = await act(() => result.current());
    expect(name).toBe('Trimmed Artist');
  });

  it('returns empty string when name property is blank', async () => {
    const { result } = renderHook(() => useResolveArtistName({ name: '   ' }));
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal('fetch', fetchMock);
    const name = await act(() => result.current());
    expect(name).toBe('');
  });

  it('fetches artist by string ID', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ name: 'Fetched Artist' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useResolveArtistName('artist-string-id'));
    const name = await act(() => result.current());
    expect(fetchMock).toHaveBeenCalledWith('/api/artists/artist-string-id?depth=0');
    expect(name).toBe('Fetched Artist');
  });

  it('fetches artist by numeric ID', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ name: 'Numeric Artist' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useResolveArtistName(42));
    const name = await act(() => result.current());
    expect(fetchMock).toHaveBeenCalledWith('/api/artists/42?depth=0');
    expect(name).toBe('Numeric Artist');
  });

  it('fetches artist when value is an object with id property', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ name: 'Artist From Object ID' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useResolveArtistName({ id: 'obj-artist-id' }));
    const name = await act(() => result.current());
    expect(fetchMock).toHaveBeenCalledWith('/api/artists/obj-artist-id?depth=0');
    expect(name).toBe('Artist From Object ID');
  });

  it('resolves nested relation with name property directly', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useResolveArtistName({ value: { name: 'Nested Name' } }));
    const name = await act(() => result.current());
    expect(name).toBe('Nested Name');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches artist from nested relation with id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ name: 'Nested ID Artist' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useResolveArtistName({ value: { id: 'nested-id' } }));
    const name = await act(() => result.current());
    expect(fetchMock).toHaveBeenCalledWith('/api/artists/nested-id?depth=0');
    expect(name).toBe('Nested ID Artist');
  });

  it('fetches artist from nested relation with string value', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ name: 'String Value Artist' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useResolveArtistName({ value: 'string-value-id' }));
    const name = await act(() => result.current());
    expect(fetchMock).toHaveBeenCalledWith('/api/artists/string-value-id?depth=0');
    expect(name).toBe('String Value Artist');
  });

  it('returns empty string when fetch response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useResolveArtistName('fail-id'));
    const name = await act(() => result.current());
    expect(name).toBe('');
  });

  it('returns empty string when fetch throws', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useResolveArtistName('error-id'));
    const name = await act(() => result.current());
    expect(name).toBe('');
  });

  it('returns empty string when artist id cannot be determined', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useResolveArtistName({ value: {} }));
    const name = await act(() => result.current());
    expect(name).toBe('');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns empty string when fetched artist has no name', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useResolveArtistName('nameless-id'));
    const name = await act(() => result.current());
    expect(name).toBe('');
  });

  describe('memoization', () => {
    it('returns the same callback reference when artistFieldValue does not change', () => {
      const fieldValue = { name: 'Stable Artist' };
      const { result, rerender } = renderHook(
        ({ val }) => useResolveArtistName(val),
        { initialProps: { val: fieldValue } },
      );
      const first = result.current;
      rerender({ val: fieldValue });
      expect(result.current).toBe(first);
    });

    it('returns a new callback when artistFieldValue changes', () => {
      const { result, rerender } = renderHook(
        ({ val }) => useResolveArtistName(val),
        { initialProps: { val: 'artist-a' as unknown } },
      );
      const first = result.current;
      rerender({ val: 'artist-b' });
      expect(result.current).not.toBe(first);
    });
  });
});
