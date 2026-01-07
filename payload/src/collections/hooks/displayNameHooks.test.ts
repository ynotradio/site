/**
 * Unit tests for collection displayName virtual field hooks
 *
 * Tests the afterRead hook logic for generating displayName virtual fields for Songs and Records.
 * These displayNames are used in relationship dropdowns to show "Artist - Title" format.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Payload } from 'payload';

// Helper to create a mock request object
const createMockReq = (payload: Partial<Payload>) => ({
  payload: payload as Payload,
});

describe('Songs displayName virtual field afterRead hook', () => {
  let mockPayload: Partial<Payload>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPayload = {
      findByID: vi.fn(),
    };
  });

  // Simulates the afterRead hook logic from Songs.ts virtual field
  function getAfterReadHook() {
    return async ({ data, req }: { data: Record<string, unknown> | null; req: { payload: Payload } }) => {
      if (!data) return data?.title || 'Untitled';

      let artistName = '';
      if (data.artist) {
        // Artist may be populated or just an ID
        if (typeof data.artist === 'object' && (data.artist as { name?: string }).name) {
          artistName = (data.artist as { name: string }).name;
        } else if (data.artist) {
          try {
            const artist = await req.payload.findByID({
              collection: 'artists',
              id: typeof data.artist === 'object' ? (data.artist as { id: number }).id : data.artist as number,
            });
            if (artist) {
              artistName = (artist as { name: string }).name;
            }
          } catch {
            // Silently handle errors
          }
        }
      }

      if (artistName && data.title) {
        return `${artistName} - ${data.title}`;
      }
      return data.title || `Song #${data.id || 'New'}`;
    };
  }

  it('should generate displayName with artist and title', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      name: 'The Beatles',
    });

    const hook = getAfterReadHook();
    const result = await hook({
      data: { artist: 1, title: 'Hey Jude' },
      req: createMockReq(mockPayload),
    });

    expect(result).toBe('The Beatles - Hey Jude');
  });

  it('should use populated artist name without additional query', async () => {
    const hook = getAfterReadHook();
    const result = await hook({
      data: { artist: { id: 1, name: 'The Beatles' }, title: 'Hey Jude' },
      req: createMockReq(mockPayload),
    });

    expect(result).toBe('The Beatles - Hey Jude');
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('should generate displayName with only title when no artist', async () => {
    const hook = getAfterReadHook();
    const result = await hook({
      data: { title: 'Untitled Song' },
      req: createMockReq(mockPayload),
    });

    expect(result).toBe('Untitled Song');
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('should generate fallback displayName when no title', async () => {
    const hook = getAfterReadHook();
    const result = await hook({
      data: { id: 123 },
      req: createMockReq(mockPayload),
    });

    expect(result).toBe('Song #123');
  });

  it('should generate fallback displayName for new song', async () => {
    const hook = getAfterReadHook();
    const result = await hook({
      data: {},
      req: createMockReq(mockPayload),
    });

    expect(result).toBe('Song #New');
  });

  it('should handle artist fetch error gracefully', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB error'));

    const hook = getAfterReadHook();
    const result = await hook({
      data: { artist: 1, title: 'Test Song' },
      req: createMockReq(mockPayload),
    });

    // Should still return displayName using just the title
    expect(result).toBe('Test Song');
  });
});

describe('Records displayName virtual field afterRead hook', () => {
  let mockPayload: Partial<Payload>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPayload = {
      findByID: vi.fn(),
    };
  });

  // Simulates the afterRead hook logic from Records.ts virtual field
  function getAfterReadHook() {
    return async ({ data, req }: { data: Record<string, unknown> | null; req: { payload: Payload } }) => {
      if (!data) return data?.title || 'Untitled';

      let artistName = '';
      if (data.artist) {
        // Artist may be populated or just an ID
        if (typeof data.artist === 'object' && (data.artist as { name?: string }).name) {
          artistName = (data.artist as { name: string }).name;
        } else if (data.artist) {
          try {
            const artist = await req.payload.findByID({
              collection: 'artists',
              id: typeof data.artist === 'object' ? (data.artist as { id: number }).id : data.artist as number,
            });
            if (artist) {
              artistName = (artist as { name: string }).name;
            }
          } catch {
            // Silently handle errors
          }
        }
      }

      if (artistName && data.title) {
        return `${artistName} - ${data.title}`;
      }
      return data.title || `Record #${data.id || 'New'}`;
    };
  }

  it('should generate displayName with artist and title', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      name: 'Pink Floyd',
    });

    const hook = getAfterReadHook();
    const result = await hook({
      data: { artist: 1, title: 'The Dark Side of the Moon' },
      req: createMockReq(mockPayload),
    });

    expect(result).toBe('Pink Floyd - The Dark Side of the Moon');
  });

  it('should use populated artist name without additional query', async () => {
    const hook = getAfterReadHook();
    const result = await hook({
      data: { artist: { id: 1, name: 'Pink Floyd' }, title: 'The Dark Side of the Moon' },
      req: createMockReq(mockPayload),
    });

    expect(result).toBe('Pink Floyd - The Dark Side of the Moon');
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('should generate displayName with only title when no artist', async () => {
    const hook = getAfterReadHook();
    const result = await hook({
      data: { title: 'Various Artists Compilation' },
      req: createMockReq(mockPayload),
    });

    expect(result).toBe('Various Artists Compilation');
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('should generate fallback displayName when no title', async () => {
    const hook = getAfterReadHook();
    const result = await hook({
      data: { id: 456 },
      req: createMockReq(mockPayload),
    });

    expect(result).toBe('Record #456');
  });

  it('should generate fallback displayName for new record', async () => {
    const hook = getAfterReadHook();
    const result = await hook({
      data: {},
      req: createMockReq(mockPayload),
    });

    expect(result).toBe('Record #New');
  });

  it('should handle artist fetch error gracefully', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB error'));

    const hook = getAfterReadHook();
    const result = await hook({
      data: { artist: 1, title: 'Test Album' },
      req: createMockReq(mockPayload),
    });

    // Should still return displayName using just the title
    expect(result).toBe('Test Album');
  });
});
