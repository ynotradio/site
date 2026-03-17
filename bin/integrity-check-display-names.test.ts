import { describe, it, expect, vi, type Mock } from 'vitest';
import {
  computeDJDisplayName,
  computeMusicDisplayName,
} from './integrity-check-display-names-utils';

// ---------------------------------------------------------------------------
// Minimal Payload mock factory
// ---------------------------------------------------------------------------

function mockPayload(
  overrides: {
    find?: Mock;
    findByID?: Mock;
  } = {},
) {
  return {
    find: overrides.find ?? vi.fn(),
    findByID: overrides.findByID ?? vi.fn(),
  } as unknown as Parameters<typeof computeDJDisplayName>[0];
}

// ---------------------------------------------------------------------------
// computeDJDisplayName
// ---------------------------------------------------------------------------

describe('computeDJDisplayName', () => {
  it('joins multiple person names with commas', async () => {
    const payload = mockPayload({
      find: vi.fn().mockResolvedValue({
        docs: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      }),
    });

    const result = await computeDJDisplayName(payload, {
      id: 10,
      person: [{ id: 1 }, { id: 2 }],
    });

    expect(result).toBe('Alice, Bob');
  });

  it('handles person array with raw IDs', async () => {
    const payload = mockPayload({
      find: vi.fn().mockResolvedValue({
        docs: [{ id: 5, name: 'Charlie' }],
      }),
    });

    const result = await computeDJDisplayName(payload, {
      id: 20,
      person: [5],
    });

    expect(result).toBe('Charlie');
  });

  it('returns fallback when person array is empty', async () => {
    const payload = mockPayload();
    const result = await computeDJDisplayName(payload, { id: 30, person: [] });
    expect(result).toBe('DJ #30');
  });

  it('returns fallback when person is undefined', async () => {
    const payload = mockPayload();
    const result = await computeDJDisplayName(payload, { id: 40 });
    expect(result).toBe('DJ #40');
  });

  it('returns fallback when find throws', async () => {
    const payload = mockPayload({
      find: vi.fn().mockRejectedValue(new Error('DB error')),
    });
    const result = await computeDJDisplayName(payload, { id: 50, person: [1] });
    expect(result).toBe('DJ #50');
  });

  it('returns fallback when find returns no docs', async () => {
    const payload = mockPayload({
      find: vi.fn().mockResolvedValue({ docs: [] }),
    });
    const result = await computeDJDisplayName(payload, { id: 60, person: [999] });
    expect(result).toBe('DJ #60');
  });

  it('uses "New" when doc has no id', async () => {
    const payload = mockPayload();
    const result = await computeDJDisplayName(payload, { person: [] });
    expect(result).toBe('DJ #New');
  });
});

// ---------------------------------------------------------------------------
// computeMusicDisplayName
// ---------------------------------------------------------------------------

describe('computeMusicDisplayName', () => {
  it('returns "Artist - Title" when artist object is populated', async () => {
    const payload = mockPayload();
    const result = await computeMusicDisplayName(
      payload,
      { id: 1, artist: { id: 10, name: 'The Beatles' }, title: 'Hey Jude' },
      'Song',
    );
    expect(result).toBe('The Beatles - Hey Jude');
  });

  it('resolves artist by ID when artist is a raw number', async () => {
    const payload = mockPayload({
      findByID: vi.fn().mockResolvedValue({ id: 10, name: 'Radiohead' }),
    });
    const result = await computeMusicDisplayName(
      payload,
      { id: 2, artist: 10, title: 'Creep' },
      'Song',
    );
    expect(result).toBe('Radiohead - Creep');
    expect(payload.findByID).toHaveBeenCalledWith({
      collection: 'artists',
      id: 10,
    });
  });

  it('resolves artist by ID when artist is object without name', async () => {
    const payload = mockPayload({
      findByID: vi.fn().mockResolvedValue({ id: 10, name: 'Nirvana' }),
    });
    const result = await computeMusicDisplayName(
      payload,
      { id: 3, artist: { id: 10 }, title: 'Smells Like Teen Spirit' },
      'Song',
    );
    expect(result).toBe('Nirvana - Smells Like Teen Spirit');
  });

  it('falls back to title when artist lookup fails', async () => {
    const payload = mockPayload({
      findByID: vi.fn().mockRejectedValue(new Error('not found')),
    });
    const result = await computeMusicDisplayName(
      payload,
      { id: 4, artist: 999, title: 'Unknown Song' },
      'Song',
    );
    expect(result).toBe('Unknown Song');
  });

  it('falls back to title when artist is null', async () => {
    const payload = mockPayload();
    const result = await computeMusicDisplayName(
      payload,
      { id: 5, artist: null, title: 'Solo Track' },
      'Record',
    );
    expect(result).toBe('Solo Track');
  });

  it('falls back to "Record #id" when both artist and title missing', async () => {
    const payload = mockPayload();
    const result = await computeMusicDisplayName(payload, { id: 6 }, 'Record');
    expect(result).toBe('Record #6');
  });

  it('falls back to "Song #id" when both artist and title missing', async () => {
    const payload = mockPayload();
    const result = await computeMusicDisplayName(payload, { id: 7 }, 'Song');
    expect(result).toBe('Song #7');
  });

  it('uses "New" when doc has no id and no title', async () => {
    const payload = mockPayload();
    const result = await computeMusicDisplayName(payload, {}, 'Song');
    expect(result).toBe('Song #New');
  });

  it('returns title only when artist has empty name', async () => {
    const payload = mockPayload();
    const result = await computeMusicDisplayName(
      payload,
      { id: 8, artist: { id: 10, name: '' }, title: 'Instrumental' },
      'Song',
    );
    expect(result).toBe('Instrumental');
  });
});
