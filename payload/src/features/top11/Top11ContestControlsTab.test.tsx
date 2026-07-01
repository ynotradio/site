import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Top11ContestControlsTab } from './Top11ContestControlsTab';

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

const { useDocumentInfo } = await import('@payloadcms/ui');

const CONTEST = {
  id: 1,
  title: 'Week of July 6',
  status: 'open',
  weekOf: '2026-07-06T00:00:00.000Z',
};

const STATS = {
  contestId: 1,
  status: 'open',
  totalVotes: 42,
  uniqueVoters: 40,
  contestants: 12,
  newsletterOptInContestants: 5,
  writeInCount: 3,
  rankedWriteIns: [
    { text: 'Free Bird', count: 2, hiddenCount: 0 },
    { text: 'Stairway to Heaven', count: 1, hiddenCount: 1 },
  ],
  rankedSongs: [
    { song: 1, displayOrder: 1, votes: 30 },
    { song: 2, displayOrder: 2, votes: 12 },
  ],
};

const mockFetchSequence = (contest: object, statsOk = true) => {
  global.fetch = vi.fn().mockImplementation(async (url: string) => {
    if (String(url).endsWith('/stats')) {
      return statsOk
        ? { ok: true, json: async () => STATS }
        : { ok: false, json: async () => ({ errors: [] }) };
    }
    return { ok: true, json: async () => contest };
  });
};

describe('Top11ContestControlsTab', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows empty state when contest has no id (unsaved)', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: {},
    } as ReturnType<typeof useDocumentInfo>);
    render(<Top11ContestControlsTab />);
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toHaveTextContent(/Save this contest first/);
    });
  });

  it('renders current status and stats for an open contest', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 1 },
    } as ReturnType<typeof useDocumentInfo>);
    mockFetchSequence(CONTEST);
    render(<Top11ContestControlsTab />);
    await waitFor(() => {
      expect(screen.getByText('Status: open')).toBeInTheDocument();
      expect(screen.getByText('Total votes: 42')).toBeInTheDocument();
    });
  });

  it('only shows the transition allowed for the current status', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 1 },
    } as ReturnType<typeof useDocumentInfo>);
    mockFetchSequence(CONTEST);
    render(<Top11ContestControlsTab />);
    await waitFor(() => {
      expect(screen.getByText('Close Voting')).toBeInTheDocument();
      expect(screen.queryByText('Open Voting')).not.toBeInTheDocument();
      expect(screen.queryByText('Reopen Voting')).not.toBeInTheDocument();
    });
  });

  it('disables Pick Winner while voting is open', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 1 },
    } as ReturnType<typeof useDocumentInfo>);
    mockFetchSequence(CONTEST);
    render(<Top11ContestControlsTab />);
    await waitFor(() => {
      expect(screen.getByText('Pick Winner')).toBeDisabled();
    });
  });

  it('enables Pick Winner once voting is closed', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 1 },
    } as ReturnType<typeof useDocumentInfo>);
    mockFetchSequence({ ...CONTEST, status: 'closed' });
    render(<Top11ContestControlsTab />);
    await waitFor(() => {
      expect(screen.getByText('Pick Winner')).not.toBeDisabled();
      expect(screen.getByText('Reopen Voting')).toBeInTheDocument();
    });
  });

  it('shows no-transitions hint for an archived contest', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 1 },
    } as ReturnType<typeof useDocumentInfo>);
    mockFetchSequence({ ...CONTEST, status: 'archived' });
    render(<Top11ContestControlsTab />);
    await waitFor(() => {
      expect(screen.getByText('No further transitions available.')).toBeInTheDocument();
    });
  });

  it('renders write-in text grouped with counts, sorted by popularity', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 1 },
    } as ReturnType<typeof useDocumentInfo>);
    mockFetchSequence(CONTEST);
    render(<Top11ContestControlsTab />);
    await waitFor(() => {
      expect(screen.getByText('Free Bird')).toBeInTheDocument();
      expect(screen.getByText('Stairway to Heaven')).toBeInTheDocument();
    });
  });

  it('shows the hidden count for moderated write-ins', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 1 },
    } as ReturnType<typeof useDocumentInfo>);
    mockFetchSequence(CONTEST);
    render(<Top11ContestControlsTab />);
    const row = await screen.findByText('Stairway to Heaven');
    await waitFor(() => {
      expect(row.closest('tr')).toHaveTextContent('1');
    });
  });

  it('shows empty state when there are no write-ins', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 1 },
    } as ReturnType<typeof useDocumentInfo>);
    mockFetchSequence(CONTEST);
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (String(url).endsWith('/stats')) {
        return { ok: true, json: async () => ({ ...STATS, rankedWriteIns: [] }) };
      }
      return { ok: true, json: async () => CONTEST };
    });
    render(<Top11ContestControlsTab />);
    await waitFor(() => {
      expect(screen.getByText('No write-ins submitted yet.')).toBeInTheDocument();
    });
  });

  it('calls the open endpoint when Close Voting is clicked from open status', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 1 },
    } as ReturnType<typeof useDocumentInfo>);
    let closeCalled = false;
    global.fetch = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      const u = String(url);
      if (u.endsWith('/stats')) return { ok: true, json: async () => STATS };
      if (u.endsWith('/close') && opts?.method === 'POST') {
        closeCalled = true;
        return { ok: true, json: async () => ({ ...CONTEST, status: 'closed' }) };
      }
      return { ok: true, json: async () => CONTEST };
    });
    render(<Top11ContestControlsTab />);
    const button = await screen.findByText('Close Voting');
    button.click();
    await waitFor(() => {
      expect(closeCalled).toBe(true);
    });
  });
});
