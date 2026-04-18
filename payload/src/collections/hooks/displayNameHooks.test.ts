/**
 * Unit tests for collection displayName hooks
 *
 * Tests hooks for generating displayName fields across collections (DJs, Songs, Records).
 * These displayNames are used in relationship dropdowns and admin UI titles.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Payload } from 'payload';
import { generateDJDisplayName, generateMusicDisplayName } from './displayNameHooks';

// Helper to create a mock request object
const createMockReq = (payload: Partial<Payload>) => ({
  payload: payload as Payload,
});

describe('DJs displayName beforeChange hook', () => {
  let mockPayload: Partial<Payload>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPayload = {
      find: vi.fn(),
    };
  });

  it('should generate displayName from single person', async () => {
    (mockPayload.find as ReturnType<typeof vi.fn>).mockResolvedValue({
      docs: [{ id: 1, name: 'John Doe' }],
    });

    const result = await generateDJDisplayName({
      data: { person: [1] },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.displayName).toBe('John Doe');
    expect(mockPayload.find).toHaveBeenCalledWith({
      collection: 'people',
      where: { id: { in: [1] } },
      limit: 1,
    });
  });

  it('should generate displayName from multiple people', async () => {
    (mockPayload.find as ReturnType<typeof vi.fn>).mockResolvedValue({
      docs: [
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' },
      ],
    });

    const result = await generateDJDisplayName({
      data: { person: [1, 2] },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.displayName).toBe('John Doe, Jane Smith');
  });

  it('should handle person objects instead of IDs', async () => {
    (mockPayload.find as ReturnType<typeof vi.fn>).mockResolvedValue({
      docs: [{ id: 1, name: 'John Doe' }],
    });

    const result = await generateDJDisplayName({
      data: { person: [{ id: 1 }] },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.displayName).toBe('John Doe');
  });

  it('should generate fallback displayName when no person', async () => {
    const result = await generateDJDisplayName({
      data: { id: 123 },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.displayName).toBe('DJ #123');
    expect(mockPayload.find).not.toHaveBeenCalled();
  });

  it('should generate fallback displayName for new DJ', async () => {
    const result = await generateDJDisplayName({
      data: {},
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.displayName).toBe('DJ #New');
  });

  it('should use fallback displayName when person IDs are given but no docs returned', async () => {
    (mockPayload.find as ReturnType<typeof vi.fn>).mockResolvedValue({ docs: [] });

    const result = await generateDJDisplayName({
      data: { person: [999], id: 42 },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.displayName).toBe('DJ #42');
  });

  it('should handle person fetch error gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (mockPayload.find as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB error'));

    const result = await generateDJDisplayName({
      data: { person: [1] },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.displayName).toBe('DJ #New');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should not log error in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    (mockPayload.find as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB error'));

    await generateDJDisplayName({
      data: { person: [1] },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });
});

describe('Songs displayName beforeChange hook', () => {
  let mockPayload: Partial<Payload>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPayload = {
      findByID: vi.fn(),
    };
  });

  const songHook = generateMusicDisplayName('Song');

  it('should generate displayName with artist and title', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      name: 'The Beatles',
    });

    const result = await songHook({
      data: { artist: 1, title: 'Hey Jude' },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.displayName).toBe('The Beatles - Hey Jude');
  });

  it('should use populated artist name without additional query', async () => {
    const result = await songHook({
      data: { artist: { id: 1, name: 'The Beatles' }, title: 'Hey Jude' },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.displayName).toBe('The Beatles - Hey Jude');
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('should generate displayName with only title when no artist', async () => {
    const result = await songHook({
      data: { title: 'Untitled Song' },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.displayName).toBe('Untitled Song');
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('should generate fallback displayName when no title', async () => {
    const result = await songHook({
      data: { id: 123 },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.displayName).toBe('Song #123');
  });

  it('should generate fallback displayName for new song', async () => {
    const result = await songHook({
      data: {},
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.displayName).toBe('Song #New');
  });

  it('should use title-only displayName when artist ID lookup returns null', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await songHook({
      data: { artist: 999, title: 'Mystery Song' },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.displayName).toBe('Mystery Song');
  });

  it('should handle artist fetch error gracefully', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB error'));

    const result = await songHook({
      data: { artist: 1, title: 'Test Song' },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.displayName).toBe('Test Song');
  });
});

describe('Records displayName beforeChange hook', () => {
  let mockPayload: Partial<Payload>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPayload = {
      findByID: vi.fn(),
    };
  });

  const recordHook = generateMusicDisplayName('Record');

  it('should generate displayName with artist and title', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      name: 'Pink Floyd',
    });

    const result = await recordHook({
      data: { artist: 1, title: 'The Dark Side of the Moon' },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.displayName).toBe('Pink Floyd - The Dark Side of the Moon');
  });

  it('should use populated artist name without additional query', async () => {
    const result = await recordHook({
      data: { artist: { id: 1, name: 'Pink Floyd' }, title: 'The Dark Side of the Moon' },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.displayName).toBe('Pink Floyd - The Dark Side of the Moon');
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('should generate displayName with only title when no artist', async () => {
    const result = await recordHook({
      data: { title: 'Various Artists Compilation' },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.displayName).toBe('Various Artists Compilation');
    expect(mockPayload.findByID).not.toHaveBeenCalled();
  });

  it('should generate fallback displayName when no title', async () => {
    const result = await recordHook({
      data: { id: 456 },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.displayName).toBe('Record #456');
  });

  it('should generate fallback displayName for new record', async () => {
    const result = await recordHook({
      data: {},
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.displayName).toBe('Record #New');
  });

  it('should use title-only displayName when artist ID lookup returns null', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await recordHook({
      data: { artist: 999, title: 'Unknown Album' },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.displayName).toBe('Unknown Album');
  });

  it('should handle artist fetch error gracefully', async () => {
    (mockPayload.findByID as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB error'));

    const result = await recordHook({
      data: { artist: 1, title: 'Test Album' },
      req: createMockReq(mockPayload),
      operation: 'create',
    });

    expect(result.displayName).toBe('Test Album');
  });
});
