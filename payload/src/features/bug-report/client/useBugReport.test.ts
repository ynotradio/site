import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

import type { BugReportContext } from '../types';

const fakeContext: BugReportContext = {
  url: 'https://admin/x',
  pathname: '/x',
  referrer: '',
  userAgent: 'Test',
  platform: '',
  language: 'en',
  viewport: { width: 1, height: 1 },
  screen: { width: 1, height: 1 },
  timestamp: '2026-08-24T12:00:00.000Z',
  appVersion: null,
  logs: [],
};

vi.mock('./captureContext', () => ({ captureContext: () => fakeContext }));
const captureScreenshot = vi.fn();
vi.mock('./captureScreenshot', () => ({
  captureScreenshot: (...a: unknown[]) => captureScreenshot(...a),
}));

const { useBugReport } = await import('./useBugReport');

describe('useBugReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('skips the triage call when AI is gated off (default)', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useBugReport());
    act(() => result.current.setDescription('It broke'));
    await act(async () => {
      await result.current.continueToFollowUps();
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.step).toBe('questions');
    expect(result.current.questions).toEqual([]);
  });

  it('fetches follow-up questions and advances to the questions step', async () => {
    vi.stubEnv('NEXT_PUBLIC_BUG_REPORT_AI_ENABLED', 'true');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ questions: ['Which page?'] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useBugReport());
    act(() => result.current.setDescription('It broke'));
    await act(async () => {
      await result.current.continueToFollowUps();
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/bug-report/triage', expect.any(Object));
    expect(result.current.step).toBe('questions');
    expect(result.current.questions).toEqual(['Which page?']);
  });

  it('advances with no questions when triage fails', async () => {
    vi.stubEnv('NEXT_PUBLIC_BUG_REPORT_AI_ENABLED', 'true');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const { result } = renderHook(() => useBugReport());
    act(() => result.current.setDescription('It broke'));
    await act(async () => {
      await result.current.continueToFollowUps();
    });
    expect(result.current.step).toBe('questions');
    expect(result.current.questions).toEqual([]);
  });

  it('does nothing when the description is empty', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useBugReport());
    await act(async () => {
      await result.current.continueToFollowUps();
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.step).toBe('describe');
  });

  it('submits the report and stores the resulting issue', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://github/issues/3', number: 3 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useBugReport());
    act(() => result.current.setDescription('It broke'));
    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => expect(result.current.step).toBe('success'));
    expect(result.current.result).toEqual({ url: 'https://github/issues/3', number: 3 });
    const submitBody = JSON.parse(fetchMock.mock.calls.at(-1)![1].body);
    expect(submitBody.description).toBe('It broke');
    expect(submitBody.context).toEqual(fakeContext);
  });

  it('does not submit when the description is empty', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useBugReport());
    await act(async () => {
      await result.current.submit();
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.step).toBe('describe');
  });

  it('moves to the error step when the network throws during submit', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const { result } = renderHook(() => useBugReport());
    act(() => result.current.setDescription('x'));
    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.step).toBe('error');
    expect(result.current.error).toBe('offline');
  });

  it('surfaces a server error message', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'Not configured' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useBugReport());
    act(() => result.current.setDescription('x'));
    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.step).toBe('error');
    expect(result.current.error).toBe('Not configured');
  });

  it('captures and removes a screenshot', async () => {
    captureScreenshot.mockResolvedValue('data:image/png;base64,AAA');
    const { result } = renderHook(() => useBugReport());

    await act(async () => {
      await result.current.takeScreenshot();
    });
    expect(result.current.screenshot).toBe('data:image/png;base64,AAA');

    act(() => result.current.removeScreenshot());
    expect(result.current.screenshot).toBeNull();
  });

  it('records follow-up answers and resets state', () => {
    const { result } = renderHook(() => useBugReport());
    act(() => result.current.setAnswer('Which page?', 'Shows'));
    expect(result.current.answers['Which page?']).toBe('Shows');

    act(() => result.current.setDescription('text'));
    act(() => result.current.reset());
    expect(result.current.description).toBe('');
    expect(result.current.answers).toEqual({});
    expect(result.current.step).toBe('describe');
  });
});
