import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { MatchControlsTab } from './MatchControlsTab';

vi.mock('@payloadcms/ui', () => ({
  Gutter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="gutter">{children}</div>
  ),
  useDocumentInfo: vi.fn(),
}));

vi.mock('../shared/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

vi.mock('../shared/EmptyState', () => ({
  EmptyState: ({ message }: { message: string }) => <div data-testid="empty-state">{message}</div>,
}));

vi.mock('../mrm-shared/AdminBracketMatch', () => ({
  AdminBracketMatch: ({
    matchLabel,
    statusBadge,
  }: {
    matchLabel?: string;
    statusBadge?: string;
  }) => (
    <div data-testid="admin-bracket-match">
      {matchLabel && <span>{matchLabel}</span>}
      {statusBadge && <span>{statusBadge}</span>}
    </div>
  ),
}));

vi.mock('../mrm-shared/AdminScoreboard', () => ({
  AdminScoreboard: ({ band1Pct, band2Pct }: { band1Pct: number; band2Pct: number }) => (
    <div data-testid="admin-scoreboard">
      {band1Pct}% / {band2Pct}%
    </div>
  ),
}));

const { useDocumentInfo } = await import('@payloadcms/ui');

const LIVE_MATCH = {
  id: 'match-1',
  matchNumber: 7,
  round: '1',
  band1Votes: 1200,
  band2Votes: 900,
  startTime: new Date(Date.now() - 60_000).toISOString(),
  endTime: new Date(Date.now() + 60_000).toISOString(),
  winner: null,
  showScore: true,
  band1: { id: 'b1', name: 'Radiohead', seed: 1, placement: 1 },
  band2: { id: 'b2', name: 'Nirvana', seed: 2, placement: 2 },
};

const OVERTIME_TIED_MATCH = {
  ...LIVE_MATCH,
  id: 'match-2',
  band1Votes: 1000,
  band2Votes: 1000,
  endTime: new Date(Date.now() - 60_000).toISOString(),
};

const CLOSEABLE_MATCH = {
  ...LIVE_MATCH,
  id: 'match-3',
  band1Votes: 1500,
  band2Votes: 800,
  endTime: new Date(Date.now() - 60_000).toISOString(),
};

const CLOSED_MATCH = {
  ...LIVE_MATCH,
  id: 'match-4',
  endTime: new Date(Date.now() - 120_000).toISOString(),
  winner: { id: 'b1', name: 'Radiohead', seed: 1, placement: 1 },
};

const UPCOMING_MATCH = {
  ...LIVE_MATCH,
  id: 'match-5',
  startTime: new Date(Date.now() + 60_000).toISOString(),
  endTime: new Date(Date.now() + 120_000).toISOString(),
  band1Votes: 0,
  band2Votes: 0,
};

describe('MatchControlsTab', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows empty state when match has no id (unsaved)', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: {},
    } as ReturnType<typeof useDocumentInfo>);
    render(<MatchControlsTab />);
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toHaveTextContent(/Save this match first/);
    });
  });

  it('renders band names for a live match', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 'match-1' },
    } as ReturnType<typeof useDocumentInfo>);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => LIVE_MATCH,
    });
    render(<MatchControlsTab />);
    await waitFor(() => {
      expect(screen.getByText('Radiohead')).toBeInTheDocument();
      expect(screen.getByText('Nirvana')).toBeInTheDocument();
    });
  });

  it('shows LIVE status badge for an active match', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 'match-1' },
    } as ReturnType<typeof useDocumentInfo>);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => LIVE_MATCH,
    });
    render(<MatchControlsTab />);
    await waitFor(() => {
      expect(screen.getAllByText(/🔴 LIVE/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows enabled Manual Vote buttons when match is live', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 'match-1' },
    } as ReturnType<typeof useDocumentInfo>);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => LIVE_MATCH,
    });
    render(<MatchControlsTab />);
    await waitFor(() => {
      const buttons = screen.getAllByText('Manual Vote');
      expect(buttons).toHaveLength(2);
      buttons.forEach((btn) => expect(btn).not.toBeDisabled());
    });
  });

  it('shows disabled Manual Vote buttons for upcoming match', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 'match-5' },
    } as ReturnType<typeof useDocumentInfo>);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => UPCOMING_MATCH,
    });
    render(<MatchControlsTab />);
    await waitFor(() => {
      const buttons = screen.getAllByText('Manual Vote');
      expect(buttons).toHaveLength(2);
      buttons.forEach((btn) => expect(btn).toBeDisabled());
    });
  });

  it('shows disabled Manual Vote buttons for closed match', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 'match-4' },
    } as ReturnType<typeof useDocumentInfo>);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => CLOSED_MATCH,
    });
    render(<MatchControlsTab />);
    await waitFor(() => {
      const buttons = screen.getAllByText('Manual Vote');
      expect(buttons).toHaveLength(2);
      buttons.forEach((btn) => expect(btn).toBeDisabled());
    });
  });

  it('shows Overtime status badge and extend button when tied past end time', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 'match-2' },
    } as ReturnType<typeof useDocumentInfo>);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => OVERTIME_TIED_MATCH,
    });
    render(<MatchControlsTab />);
    await waitFor(() => {
      expect(screen.getAllByText(/⏰ Overtime/).length).toBeGreaterThanOrEqual(1);
      const extendBtn = screen.getByText(/Extend Overtime/);
      expect(extendBtn).not.toBeDisabled();
    });
  });

  it('shows enabled Close Match button when match is past end and not tied', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 'match-3' },
    } as ReturnType<typeof useDocumentInfo>);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => CLOSEABLE_MATCH,
    });
    render(<MatchControlsTab />);
    await waitFor(() => {
      const closeBtn = screen.getByText('Close Match');
      expect(closeBtn).not.toBeDisabled();
    });
  });

  it('shows disabled Close and Extend buttons for live match', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 'match-1' },
    } as ReturnType<typeof useDocumentInfo>);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => LIVE_MATCH,
    });
    render(<MatchControlsTab />);
    await waitFor(() => {
      expect(screen.getByText('Close Match')).toBeDisabled();
      expect(screen.getByText(/Extend Overtime/)).toBeDisabled();
    });
  });

  it('shows winner crown on winning band', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 'match-4' },
    } as ReturnType<typeof useDocumentInfo>);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => CLOSED_MATCH,
    });
    render(<MatchControlsTab />);
    await waitFor(() => {
      expect(screen.getByText(/🏆/)).toBeInTheDocument();
    });
  });

  it('shows error banner when API fails', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 'match-1' },
    } as ReturnType<typeof useDocumentInfo>);
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    render(<MatchControlsTab />);
    await waitFor(() => {
      expect(screen.getByText(/Could not load match data/)).toBeInTheDocument();
    });
  });

  it('fetches the specific match by ID', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 'specific-match-42' },
    } as ReturnType<typeof useDocumentInfo>);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...LIVE_MATCH, id: 'specific-match-42' }),
    });
    render(<MatchControlsTab />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('specific-match-42'));
    });
  });

  it('calls PATCH when Manual Vote is clicked on a live match', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 'match-1' },
    } as ReturnType<typeof useDocumentInfo>);
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      callCount += 1;
      if (callCount === 1 || !opts?.method || opts.method === 'GET') {
        return { ok: true, json: async () => LIVE_MATCH };
      }
      return { ok: true, json: async () => ({}) };
    });

    render(<MatchControlsTab />);
    await waitFor(() => screen.getAllByText('Manual Vote'));

    await act(async () => {
      fireEvent.click(screen.getAllByText('Manual Vote')[0]);
    });

    const { calls } = (global.fetch as ReturnType<typeof vi.fn>).mock;
    const patchCall = calls.find(
      ([url, opts]: [string, RequestInit]) => String(url).includes('/api/modern-rock-madness-matches/') && opts?.method === 'PATCH',
    );
    expect(patchCall).toBeDefined();
  });
});
