/**
 * Unit tests for collection displayName hooks
 *
 * Tests the logic for generating displayName fields for Songs and Records collections.
 * These displayNames are used in relationship dropdowns to show "Artist - Title" format.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Payload } from 'payload';

// Helper to create a mock request object
const createMockReq = (payload: Partial<Payload>) => ({
  payload: payload as Payload,
});

describe('Songs displayName hook', () => {
  let mockPayload: Partial<Payload>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPayload = {
      findByID: vi.fn(),
    };
  });

  // Simulates the hook logic from Songs.ts
  function getHookLogic() {
    return async ({ data, req }: { data: Record<string, unknown>; req: { payload: Payload } }) => {
      const updatedData = { ...data };

      let artistName = '';
      if (updatedData.artist) {
        const artistId = typeof updatedData.artist === 'object'
          ? (updatedData.artist as { id: string | number }).id
          : updatedData.artist;

        try {
          const artist = await req.payload.findByID({
            collection: 'artists',
            id: artistId as string | number,
          });

          if (artist) {
            artistName = (artist as { name: string }).name;
          }
        } catch {
          // Error handling
        }
      }

      if (artistName && updatedData.title) {
        updatedData.displayName = `${artistName} - ${updatedData.title}`;
      } else if (updatedData.title) {
        updatedData.displayName = updatedData.title;
      } else {
        updatedData.displayName = `Song #${updatedData.id || 'New'}`;
      }

      return updatedData;
    };
  }

  it('should generate displayName with artist and title', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      name: 'The Beatles',
    });

    const hook = getHookLogic();
    const result = await hook({
      data: { artist: 1, title: 'Hey Jude' },
      req: createMockReq(mockPayload),
    });

    expect(result.displayName).toBe('The Beatles - Hey Jude');
  });

  it('should generate displayName with only title when no artist', async () => {
    const hook = getHookLogic();
    const result = await hook({
      data: { title: 'Untitled Song' },
      req: createMockReq(mockPayload),
    });

    expect(result.displayName).toBe('Untitled Song');
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('should handle artist as object with id', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 2,
      name: 'Radiohead',
    });

    const hook = getHookLogic();
    const result = await hook({
      data: { artist: { id: 2 }, title: 'Creep' },
      req: createMockReq(mockPayload),
    });

    expect(result.displayName).toBe('Radiohead - Creep');
    expect(mockPayload.findByID).toHaveBeenCalledWith({
      collection: 'artists',
      id: 2,
    });
  });

  it('should generate fallback displayName when no title', async () => {
    const hook = getHookLogic();
    const result = await hook({
      data: { id: 123 },
      req: createMockReq(mockPayload),
    });

    expect(result.displayName).toBe('Song #123');
  });

  it('should generate fallback displayName for new song', async () => {
    const hook = getHookLogic();
    const result = await hook({
      data: {},
      req: createMockReq(mockPayload),
    });

    expect(result.displayName).toBe('Song #New');
  });

  it('should handle artist fetch error gracefully', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB error'));

    const hook = getHookLogic();
    const result = await hook({
      data: { artist: 1, title: 'Test Song' },
      req: createMockReq(mockPayload),
    });

    // Should still set displayName using just the title
    expect(result.displayName).toBe('Test Song');
  });
});

describe('Records displayName hook', () => {
  let mockPayload: Partial<Payload>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPayload = {
      findByID: vi.fn(),
    };
  });

  // Simulates the hook logic from Records.ts
  function getHookLogic() {
    return async ({ data, req }: { data: Record<string, unknown>; req: { payload: Payload } }) => {
      const updatedData = { ...data };

      let artistName = '';
      if (updatedData.artist) {
        const artistId = typeof updatedData.artist === 'object'
          ? (updatedData.artist as { id: string | number }).id
          : updatedData.artist;

        try {
          const artist = await req.payload.findByID({
            collection: 'artists',
            id: artistId as string | number,
          });

          if (artist) {
            artistName = (artist as { name: string }).name;
          }
        } catch {
        // Error handling
        }
      }

      if (artistName && updatedData.title) {
        updatedData.displayName = `${artistName} - ${updatedData.title}`;
      } else if (updatedData.title) {
        updatedData.displayName = updatedData.title;
      } else {
        updatedData.displayName = `Record #${updatedData.id || 'New'}`;
      }

      return updatedData;
    };
  }

  it('should generate displayName with artist and title', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      name: 'Pink Floyd',
    });

    const hook = getHookLogic();
    const result = await hook({
      data: { artist: 1, title: 'The Dark Side of the Moon' },
      req: createMockReq(mockPayload),
    });

    expect(result.displayName).toBe('Pink Floyd - The Dark Side of the Moon');
  });

  it('should generate displayName with only title when no artist', async () => {
    const hook = getHookLogic();
    const result = await hook({
      data: { title: 'Various Artists Compilation' },
      req: createMockReq(mockPayload),
    });

    expect(result.displayName).toBe('Various Artists Compilation');
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('should handle artist as object with id', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 3,
      name: 'Nirvana',
    });

    const hook = getHookLogic();
    const result = await hook({
      data: { artist: { id: 3 }, title: 'Nevermind' },
      req: createMockReq(mockPayload),
    });

    expect(result.displayName).toBe('Nirvana - Nevermind');
    expect(mockPayload.findByID).toHaveBeenCalledWith({
      collection: 'artists',
      id: 3,
    });
  });

  it('should generate fallback displayName when no title', async () => {
    const hook = getHookLogic();
    const result = await hook({
      data: { id: 456 },
      req: createMockReq(mockPayload),
    });

    expect(result.displayName).toBe('Record #456');
  });

  it('should generate fallback displayName for new record', async () => {
    const hook = getHookLogic();
    const result = await hook({
      data: {},
      req: createMockReq(mockPayload),
    });

    expect(result.displayName).toBe('Record #New');
  });

  it('should handle artist fetch error gracefully', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB error'));

    const hook = getHookLogic();
    const result = await hook({
      data: { artist: 1, title: 'Test Album' },
      req: createMockReq(mockPayload),
    });

    // Should still set displayName using just the title
    expect(result.displayName).toBe('Test Album');
  });
});

describe('DJs displayName hook', () => {
  let mockPayload: Partial<Payload>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPayload = {
      find: vi.fn(),
    };
  });

  // Simulates the hook logic from DJs.ts
  function getHookLogic() {
    return async ({ data, req }: { data: Record<string, unknown>; req: { payload: Payload } }) => {
      const updatedData = { ...data };

      if (
        updatedData.person
        && Array.isArray(updatedData.person)
        && updatedData.person.length > 0
      ) {
        const personIds = (updatedData.person as Array<{ id: string | number } | string | number>).map(
          (p) => (typeof p === 'object' ? p.id : p),
        );

        try {
          const people = await req.payload.find({
            collection: 'people',
            where: {
              id: {
                in: personIds,
              },
            },
            limit: personIds.length,
          });

          if (people.docs.length > 0) {
            updatedData.displayName = (people.docs as Array<{ name: string }>)
              .map((p) => p.name)
              .join(', ');
          }
        } catch {
        // Error handling
        }
      }

      if (!updatedData.displayName) {
        updatedData.displayName = `DJ #${updatedData.id || 'New'}`;
      }

      return updatedData;
    };
  }

  it('should generate displayName from single person', async () => {
    (mockPayload.find as ReturnType<typeof vi.fn>).mockResolvedValue({
      docs: [{ id: 1, name: 'John Smith' }],
    });

    const hook = getHookLogic();
    const result = await hook({
      data: { person: [1] },
      req: createMockReq(mockPayload),
    });

    expect(result.displayName).toBe('John Smith');
  });

  it('should generate displayName from multiple people', async () => {
    (mockPayload.find as ReturnType<typeof vi.fn>).mockResolvedValue({
      docs: [
        { id: 1, name: 'M.J.' },
        { id: 2, name: 'Patria' },
      ],
    });

    const hook = getHookLogic();
    const result = await hook({
      data: { person: [1, 2] },
      req: createMockReq(mockPayload),
    });

    expect(result.displayName).toBe('M.J., Patria');
  });

  it('should handle person as array of objects with id', async () => {
    (mockPayload.find as ReturnType<typeof vi.fn>).mockResolvedValue({
      docs: [{ id: 3, name: 'Jane Doe' }],
    });

    const hook = getHookLogic();
    const result = await hook({
      data: { person: [{ id: 3 }] },
      req: createMockReq(mockPayload),
    });

    expect(result.displayName).toBe('Jane Doe');
  });

  it('should generate fallback displayName when no person', async () => {
    const hook = getHookLogic();
    const result = await hook({
      data: { id: 789 },
      req: createMockReq(mockPayload),
    });

    expect(result.displayName).toBe('DJ #789');
    expect(mockPayload.find).not.toHaveBeenCalled();
  });

  it('should generate fallback displayName for new DJ', async () => {
    const hook = getHookLogic();
    const result = await hook({
      data: {},
      req: createMockReq(mockPayload),
    });

    expect(result.displayName).toBe('DJ #New');
  });

  it('should handle person fetch error gracefully', async () => {
    (mockPayload.find as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB error'));

    const hook = getHookLogic();
    const result = await hook({
      data: { person: [1], id: 999 },
      req: createMockReq(mockPayload),
    });

    // Should still set displayName using fallback
    expect(result.displayName).toBe('DJ #999');
  });
});
