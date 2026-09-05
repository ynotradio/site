import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { Payload } from 'payload';

import { BugReportConfigError } from '../../../payload/src/features/bug-report/server/createGithubIssue';

vi.mock('@payload-config', () => ({ default: {} }));
vi.mock('payload', () => ({ getPayload: vi.fn() }));

const createGithubIssue = vi.fn();
const uploadScreenshot = vi.fn();
const composeIssue = vi.fn();

vi.mock('../../../payload/src/features/bug-report/server/createGithubIssue', async () => {
  const actual = await vi.importActual(
    '../../../payload/src/features/bug-report/server/createGithubIssue',
  );
  return { ...actual, createGithubIssue: (...a: unknown[]) => createGithubIssue(...a) };
});
vi.mock('../../../payload/src/features/bug-report/server/uploadScreenshot', () => ({
  uploadScreenshot: (...a: unknown[]) => uploadScreenshot(...a),
}));
vi.mock('../../../payload/src/features/bug-report/server/triageWithClaude', () => ({
  composeIssue: (...a: unknown[]) => composeIssue(...a),
}));

const { POST } = await import('./route');

const mockAuth = vi.fn();
const mockPayload = {
  auth: mockAuth,
  logger: { warn: vi.fn(), error: vi.fn() },
} as unknown as Payload;

const makeRequest = (body: unknown): NextRequest => new NextRequest('http://localhost/api/bug-report', {
  method: 'POST',
  body: JSON.stringify(body),
  headers: { 'Content-Type': 'application/json' },
});

const validBody = {
  description: 'It broke',
  answers: [],
  context: {
    url: 'https://admin/x',
    logs: [],
    viewport: { width: 1, height: 1 },
    screen: { width: 1, height: 1 },
  },
  screenshot: null,
};

beforeEach(async () => {
  vi.clearAllMocks();
  const { getPayload } = await import('payload');
  vi.mocked(getPayload).mockResolvedValue(mockPayload);
  mockAuth.mockResolvedValue({ user: { id: 7, email: 'josh@ynotradio.net' } });
  uploadScreenshot.mockResolvedValue(null);
  composeIssue.mockResolvedValue({ title: null, labels: ['bug'] });
});

describe('POST /api/bug-report', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ user: null });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid JSON', async () => {
    const req = new NextRequest('http://localhost/api/bug-report', {
      method: 'POST',
      body: 'not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when the description is empty', async () => {
    const res = await POST(makeRequest({ ...validBody, description: '   ' }));
    expect(res.status).toBe(400);
  });

  it('creates an issue and returns 201 with the url and number', async () => {
    createGithubIssue.mockResolvedValue({ url: 'https://github/issues/9', number: 9 });
    const res = await POST(makeRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toEqual({ url: 'https://github/issues/9', number: 9 });
    expect(createGithubIssue).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining('[Bug] It broke') }),
    );
  });

  it('attributes the reporter from the authenticated session', async () => {
    createGithubIssue.mockResolvedValue({ url: 'u', number: 1 });
    await POST(makeRequest(validBody));
    const issueArgs = createGithubIssue.mock.calls[0][0];
    expect(issueArgs.body).toContain('josh@ynotradio.net (id: 7)');
  });

  it('uploads a screenshot and embeds it in the issue', async () => {
    uploadScreenshot.mockResolvedValue('https://cdn/shot.png');
    createGithubIssue.mockResolvedValue({ url: 'u', number: 1 });
    await POST(makeRequest({ ...validBody, screenshot: 'data:image/png;base64,AAA' }));
    expect(uploadScreenshot).toHaveBeenCalledWith('data:image/png;base64,AAA');
    expect(createGithubIssue.mock.calls[0][0].body).toContain('https://cdn/shot.png');
  });

  it('returns 503 when bug reporting is not configured', async () => {
    createGithubIssue.mockRejectedValue(new BugReportConfigError('not configured'));
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('not configured');
  });

  it('returns 500 on unexpected failure', async () => {
    createGithubIssue.mockRejectedValue(new Error('GitHub down'));
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);
  });
});
