import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { BugReportContext } from './types';

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

vi.mock('./client/captureContext', () => ({ captureContext: () => fakeContext }));
const captureScreenshot = vi.fn();
vi.mock('./client/captureScreenshot', () => ({
  captureScreenshot: (...a: unknown[]) => captureScreenshot(...a),
}));

const { BugReportWidget } = await import('./BugReportWidget');

const typeDescription = (value: string): void => {
  fireEvent.change(screen.getByLabelText('What went wrong?'), { target: { value } });
};

describe('BugReportWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('opens the dialog from the launcher button', () => {
    render(<BugReportWidget />);
    fireEvent.click(screen.getByRole('button', { name: 'Report a bug' }));
    expect(screen.getByRole('heading', { name: 'Report a bug' })).toBeInTheDocument();
  });

  it('walks through describe → AI questions → success', async () => {
    vi.stubEnv('NEXT_PUBLIC_BUG_REPORT_AI_ENABLED', 'true');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ questions: ['Which page?'] }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://github/issues/5', number: 5 }),
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<BugReportWidget defaultOpen />);
    typeDescription('Save fails');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(screen.getByText('Which page?')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Submit report' }));

    await waitFor(() => expect(screen.getByText(/your report was filed/i)).toBeInTheDocument());
    const link = screen.getByRole('link', { name: /View issue #5/ });
    expect(link).toHaveAttribute('href', 'https://github/issues/5');
  });

  it('shows a server error and allows retry', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: 'Bug reporting is not configured' }),
      }),
    );

    render(<BugReportWidget defaultOpen />);
    typeDescription('x');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Submit report' }));

    expect(await screen.findByText(/not configured/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('captures a screenshot and previews it', async () => {
    captureScreenshot.mockResolvedValue('data:image/png;base64,AAA');
    render(<BugReportWidget defaultOpen />);

    fireEvent.click(screen.getByRole('button', { name: /Attach screenshot/ }));
    await waitFor(() => expect(screen.getByAltText('Captured screenshot')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(screen.queryByAltText('Captured screenshot')).not.toBeInTheDocument();
  });

  it('annotates a captured screenshot and returns to the form', async () => {
    captureScreenshot.mockResolvedValue('data:image/png;base64,AAA');
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,OUT');

    render(<BugReportWidget defaultOpen />);
    fireEvent.click(screen.getByRole('button', { name: /Attach screenshot/ }));
    await waitFor(() => expect(screen.getByAltText('Captured screenshot')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Annotate/ }));
    expect(screen.getByRole('heading', { name: 'Annotate screenshot' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Save annotation' }));

    // Back on the describe step with the annotated image swapped in.
    await waitFor(() => expect(screen.getByLabelText('What went wrong?')).toBeInTheDocument());
    expect(screen.getByAltText('Captured screenshot')).toHaveAttribute(
      'src',
      'data:image/png;base64,OUT',
    );
  });

  it('cancels annotation without changing the screenshot', async () => {
    captureScreenshot.mockResolvedValue('data:image/png;base64,AAA');
    render(<BugReportWidget defaultOpen />);
    fireEvent.click(screen.getByRole('button', { name: /Attach screenshot/ }));
    await waitFor(() => expect(screen.getByAltText('Captured screenshot')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Annotate/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByLabelText('What went wrong?')).toBeInTheDocument();
    expect(screen.getByAltText('Captured screenshot')).toHaveAttribute(
      'src',
      'data:image/png;base64,AAA',
    );
  });

  it('disables Continue until a description is entered', () => {
    render(<BugReportWidget defaultOpen />);
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('closes the dialog when Cancel is clicked', () => {
    render(<BugReportWidget defaultOpen />);
    expect(screen.getByRole('heading', { name: 'Report a bug' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByLabelText('What went wrong?')).toHaveValue('');
  });

  it('skips questions and files directly when AI is gated off (default)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://github/issues/8', number: 8 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<BugReportWidget defaultOpen />);
    typeDescription('Broken thing');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // No triage round-trip; goes straight to the ready-to-file step.
    expect(await screen.findByText(/ready to file this report/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Submit report' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument());
    // Only the submit call happened — never the triage endpoint.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/bug-report');
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByRole('button', { name: 'Report a bug' })).toBeInTheDocument();
  });
});
