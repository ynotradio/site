import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { Payload } from 'payload';

vi.mock('@payload-config', () => ({ default: {} }));
vi.mock('payload', () => ({ getPayload: vi.fn() }));

const { GET, OPTIONS } = await import('./route');

const mockFind = vi.fn();
const mockPayload = { find: mockFind } as unknown as Payload;

beforeEach(async () => {
  vi.clearAllMocks();
  const { getPayload } = await import('payload');
  vi.mocked(getPayload).mockResolvedValue(mockPayload);
});

const makeRequest = (search = ''): NextRequest => new NextRequest(`http://localhost/api/v1/ondemand${search}`);

describe('OPTIONS /api/v1/ondemand', () => {
  it('returns 204 with CORS headers', async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});

describe('GET /api/v1/ondemand', () => {
  it('returns paginated published records with defaults', async () => {
    mockFind.mockResolvedValue({
      docs: [{ id: '1', headline: 'Test Show', _status: 'published' }],
      totalDocs: 1,
      totalPages: 1,
      page: 1,
    });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.docs).toHaveLength(1);
    expect(body.totalDocs).toBe(1);
    expect(body.totalPages).toBe(1);
    expect(body.page).toBe(1);
  });

  it('queries only published records', async () => {
    mockFind.mockResolvedValue({ docs: [], totalDocs: 0, totalPages: 0, page: 1 });

    await GET(makeRequest());

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'ondemand',
        where: expect.objectContaining({
          _status: { equals: 'published' },
        }),
      }),
    );
  });

  it('passes pagination params to payload.find', async () => {
    mockFind.mockResolvedValue({ docs: [], totalDocs: 0, totalPages: 0, page: 2 });

    await GET(makeRequest('?page=2&limit=5'));

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 5 }),
    );
  });

  it('filters by dj when ?dj param is provided', async () => {
    mockFind.mockResolvedValue({ docs: [], totalDocs: 0, totalPages: 0, page: 1 });

    await GET(makeRequest('?dj=abc123'));

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          djs: { in: ['abc123'] },
        }),
      }),
    );
  });

  it('does not include dj filter when ?dj param is absent', async () => {
    mockFind.mockResolvedValue({ docs: [], totalDocs: 0, totalPages: 0, page: 1 });

    await GET(makeRequest());

    const callArgs = mockFind.mock.calls[0][0];
    expect(callArgs.where).not.toHaveProperty('djs');
  });

  it('caps limit at 100', async () => {
    mockFind.mockResolvedValue({ docs: [], totalDocs: 0, totalPages: 0, page: 1 });

    await GET(makeRequest('?limit=9999'));

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100 }),
    );
  });

  it('uses depth 1', async () => {
    mockFind.mockResolvedValue({ docs: [], totalDocs: 0, totalPages: 0, page: 1 });

    await GET(makeRequest());

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({ depth: 1 }),
    );
  });

  it('sorts by date descending', async () => {
    mockFind.mockResolvedValue({ docs: [], totalDocs: 0, totalPages: 0, page: 1 });

    await GET(makeRequest());

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({ sort: '-date' }),
    );
  });

  it('returns CORS header on successful response', async () => {
    mockFind.mockResolvedValue({ docs: [], totalDocs: 0, totalPages: 0, page: 1 });

    const res = await GET(makeRequest());

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('returns 500 with error message when payload throws', async () => {
    mockFind.mockRejectedValue(new Error('DB connection failed'));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('DB connection failed');
  });

  it('returns 500 with CORS header on error', async () => {
    mockFind.mockRejectedValue(new Error('boom'));

    const res = await GET(makeRequest());

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('uses default limit of 20 when limit param is missing', async () => {
    mockFind.mockResolvedValue({ docs: [], totalDocs: 0, totalPages: 0, page: 1 });

    await GET(makeRequest());

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20 }),
    );
  });
});
