import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { Payload } from 'payload';

vi.mock('@payload-config', () => ({ default: {} }));
vi.mock('payload', () => ({ getPayload: vi.fn() }));

const getFollowUpQuestions = vi.fn();
vi.mock('../../../../payload/src/features/bug-report/server/triageWithClaude', () => ({
  getFollowUpQuestions: (...a: unknown[]) => getFollowUpQuestions(...a),
}));

const { POST } = await import('./route');

const mockAuth = vi.fn();
const mockPayload = { auth: mockAuth } as unknown as Payload;

const makeRequest = (body: unknown): NextRequest => new NextRequest('http://localhost/api/bug-report/triage', {
  method: 'POST',
  body: JSON.stringify(body),
  headers: { 'Content-Type': 'application/json' },
});

const validBody = { description: 'It broke', context: { url: 'x', logs: [] } };

beforeEach(async () => {
  vi.clearAllMocks();
  const { getPayload } = await import('payload');
  vi.mocked(getPayload).mockResolvedValue(mockPayload);
  mockAuth.mockResolvedValue({ user: { id: 1 } });
});

describe('POST /api/bug-report/triage', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ user: null });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
  });

  it('returns 400 when the body is missing fields', async () => {
    const res = await POST(makeRequest({ description: 'x' }));
    expect(res.status).toBe(400);
  });

  it('returns the follow-up questions', async () => {
    getFollowUpQuestions.mockResolvedValue(['Which page?', 'What error?']);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ questions: ['Which page?', 'What error?'] });
  });

  it('returns an empty list when triage yields nothing', async () => {
    getFollowUpQuestions.mockResolvedValue([]);
    const res = await POST(makeRequest(validBody));
    expect(await res.json()).toEqual({ questions: [] });
  });
});
