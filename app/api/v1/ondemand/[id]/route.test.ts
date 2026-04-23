import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { Payload } from 'payload';

vi.mock('@payload-config', () => ({ default: {} }));
vi.mock('payload', () => ({ getPayload: vi.fn() }));

const { GET, OPTIONS } = await import('./route');

const mockFindByID = vi.fn();
const mockPayload = { findByID: mockFindByID } as unknown as Payload;

beforeEach(async () => {
  vi.clearAllMocks();
  const { getPayload } = await import('payload');
  vi.mocked(getPayload).mockResolvedValue(mockPayload);
});

const makeRequest = (): NextRequest => new NextRequest('http://localhost/api/v1/ondemand/abc123');

const makeParams = (id: string): { params: Promise<{ id: string }> } => ({
  params: Promise.resolve({ id }),
});

describe('OPTIONS /api/v1/ondemand/[id]', () => {
  it('returns 204 with CORS headers', async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});

describe('GET /api/v1/ondemand/[id]', () => {
  it('returns a published document by id', async () => {
    const doc = { id: 'abc123', headline: 'My Show', _status: 'published' };
    mockFindByID.mockResolvedValue(doc);

    const res = await GET(makeRequest(), makeParams('abc123'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('abc123');
    expect(body.headline).toBe('My Show');
  });

  it('calls findByID with correct collection and id', async () => {
    mockFindByID.mockResolvedValue({ id: 'abc123', _status: 'published' });

    await GET(makeRequest(), makeParams('abc123'));

    expect(mockFindByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'ondemand',
        id: 'abc123',
        depth: 1,
      }),
    );
  });

  it('returns 404 when document is a draft', async () => {
    mockFindByID.mockResolvedValue({ id: 'abc123', _status: 'draft' });

    const res = await GET(makeRequest(), makeParams('abc123'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Not found');
  });

  it('returns 404 when document is null', async () => {
    mockFindByID.mockResolvedValue(null);

    const res = await GET(makeRequest(), makeParams('abc123'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Not found');
  });

  it('returns 404 when payload throws a not-found error', async () => {
    mockFindByID.mockRejectedValue(new Error('The requested resource was not found'));

    const res = await GET(makeRequest(), makeParams('missing'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Not found');
  });

  it('returns 500 on unexpected errors', async () => {
    mockFindByID.mockRejectedValue(new Error('DB timeout'));

    const res = await GET(makeRequest(), makeParams('abc123'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('DB timeout');
  });

  it('includes CORS header on successful response', async () => {
    mockFindByID.mockResolvedValue({ id: 'abc123', _status: 'published' });

    const res = await GET(makeRequest(), makeParams('abc123'));

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('includes CORS header on 404 response', async () => {
    mockFindByID.mockResolvedValue(null);

    const res = await GET(makeRequest(), makeParams('abc123'));

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('includes CORS header on 500 response', async () => {
    mockFindByID.mockRejectedValue(new Error('boom'));

    const res = await GET(makeRequest(), makeParams('abc123'));

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('includes cache-control header on successful response', async () => {
    mockFindByID.mockResolvedValue({ id: 'abc123', _status: 'published' });

    const res = await GET(makeRequest(), makeParams('abc123'));

    expect(res.headers.get('Cache-Control')).toContain('public');
  });
});
