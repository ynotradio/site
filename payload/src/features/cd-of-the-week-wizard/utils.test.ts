import { describe, it, expect, vi, beforeEach } from 'vitest';
import { textToLexical, createRecord, createCdOfTheWeek } from './utils';

describe('textToLexical', () => {
  it('wraps a single line in a paragraph node', () => {
    const result = textToLexical('Hello world');
    expect(result.root.children).toHaveLength(1);
    expect(result.root.children[0].type).toBe('paragraph');
    expect(result.root.children[0].children[0].text).toBe('Hello world');
  });

  it('creates one paragraph per non-empty line', () => {
    const result = textToLexical('Line one\nLine two\nLine three');
    expect(result.root.children).toHaveLength(3);
    expect(result.root.children[1].children[0].text).toBe('Line two');
  });

  it('skips blank lines', () => {
    const result = textToLexical('First\n\nSecond');
    expect(result.root.children).toHaveLength(2);
  });

  it('trims whitespace from each line', () => {
    const result = textToLexical('  trimmed  ');
    expect(result.root.children[0].children[0].text).toBe('trimmed');
  });

  it('returns correct root structure', () => {
    const result = textToLexical('test');
    expect(result.root.type).toBe('root');
    expect(result.root.version).toBe(1);
    expect(result.root.direction).toBe('ltr');
  });
});

describe('createRecord', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('posts to /api/records with required fields', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ doc: { id: 99 } }),
    });

    await createRecord('OK Computer', 5, '', '');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/records',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"title":"OK Computer"'),
      }),
    );
  });

  it('includes optional fields when provided', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ doc: { id: 1 } }),
    });

    await createRecord('Kid A', 5, 'Parlophone', '2000-10-02');

    const body = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(body.label).toBe('Parlophone');
    expect(body.releaseDate).toBe('2000-10-02');
  });

  it('omits empty optional fields', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ doc: { id: 1 } }),
    });

    await createRecord('Kid A', 5, '', '');

    const body = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(body.label).toBeUndefined();
    expect(body.releaseDate).toBeUndefined();
  });

  it('returns the record id from doc.id', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ doc: { id: 42 } }),
    });

    const id = await createRecord('Album', 1, '', '');
    expect(id).toBe(42);
  });

  it('throws on non-ok response', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ errors: [{ message: 'Duplicate slug' }] }),
    });

    await expect(createRecord('Album', 1, '', '')).rejects.toThrow('Duplicate slug');
  });
});

describe('createCdOfTheWeek', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('posts to /api/cdoftheweek with required fields', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ doc: { id: 7 } }),
    });

    await createCdOfTheWeek(99, '2024-01-15', 'Great album.', null);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/cdoftheweek',
      expect.objectContaining({ method: 'POST' }),
    );
    const body = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(body.record).toBe(99);
    expect(body.date).toBe('2024-01-15');
  });

  it('includes reviewer when provided', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ doc: { id: 7 } }),
    });

    await createCdOfTheWeek(1, '2024-01-15', 'Text', 10);

    const body = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(body.reviewer).toBe(10);
  });

  it('omits reviewer when null', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ doc: { id: 7 } }),
    });

    await createCdOfTheWeek(1, '2024-01-15', 'Text', null);

    const body = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(body.reviewer).toBeUndefined();
  });

  it('returns the cdoftheweek id', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ doc: { id: 77 } }),
    });

    const id = await createCdOfTheWeek(1, '2024-01-15', 'Text', null);
    expect(id).toBe(77);
  });

  it('throws on non-ok response', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ errors: [{ message: 'Validation failed' }] }),
    });

    await expect(createCdOfTheWeek(1, '2024-01-15', 'Text', null)).rejects.toThrow(
      'Validation failed',
    );
  });
});
