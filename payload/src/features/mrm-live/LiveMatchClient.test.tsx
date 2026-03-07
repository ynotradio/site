import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { LiveMatchClient } from './LiveMatchClient';

// Mock Payload UI
vi.mock('@payloadcms/ui', () => ({
  Gutter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="gutter">{children}</div>
  ),
  useStepNav: () => ({ setStepNav: vi.fn() }),
}));

vi.mock('../shared/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

vi.mock('../shared/EmptyState', () => ({
  EmptyState: ({ message }: { message: string }) => (
    <div data-testid="empty-state">{message}</div>
  ),
}));

const ACTIVE_MATCH = {
  id: 'match-1',
  matchNumber: 1,
  round: '1',
  band1Votes: 1200,
  band2Votes: 900,
  startTime: new Date(Date.now() - 60_000).toISOString(), // started 1 min ago
  endTime: new Date(Date.now() + 60_000).toISOString(), // ends in 1 min
  winner: null,
  showScore: true,
  band1: { id: 'b1', name: 'Radiohead', seed: 1, placement: 1 },
  band2: { id: 'b2', name: 'Nirvana', seed: 1, placement: 2 },
};

const OVERTIME_MATCH = {
  ...ACTIVE_MATCH,
  id: 'match-2',
  band1Votes: 1000,
  band2Votes: 1000,
  endTime: new Date(Date.now() - 60_000).toISOString(), // ended 1 min ago
};

const CLOSEABLE_MATCH = {
  ...ACTIVE_MATCH,
  id: 'match-3',
  band1Votes: 1500,
  band2Votes: 800,
  endTime: new Date(Date.now() - 60_000).toISOString(), // ended 1 min ago
};

const CLOSED_MATCH = {
  ...ACTIVE_MATCH,
  id: 'match-4',
  endTime: new Date(Date.now() - 120_000).toISOString(),
  winner: { id: 'b1', name: 'Radiohead', seed: 1, placement: 1 },
};

const mockFetch = (docs: object[]) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ docs, totalDocs: docs.length }),
  });
};

describe('LiveMatchClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading spinner initially', async () => {
    mockFetch([ACTIVE_MATCH]);
    render(<LiveMatchClient />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows empty state when no match is returned', async () => {
    mockFetch([]);
    render(<LiveMatchClient />);
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('renders band names for a live match', async () => {
    mockFetch([ACTIVE_MATCH]);
    render(<LiveMatchClient />);
    await waitFor(() => {
      expect(screen.getByText('Radiohead')).toBeInTheDocument();
      expect(screen.getByText('Nirvana')).toBeInTheDocument();
    });
  });

  it('shows LIVE status badge for an active match', async () => {
    mockFetch([ACTIVE_MATCH]);
    render(<LiveMatchClient />);
    await waitFor(() => {
      expect(screen.getByText(/🔴 LIVE/)).toBeInTheDocument();
    });
  });

  it('shows Manual Vote buttons when match is live', async () => {
    mockFetch([ACTIVE_MATCH]);
    render(<LiveMatchClient />);
    await waitFor(() => {
      const buttons = screen.getAllByText('Manual Vote');
      expect(buttons).toHaveLength(2);
    });
  });

  it('calls PATCH and event endpoints when Manual Vote is clicked', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
      callCount += 1;
      // First call: initial GET for current match
      if (callCount === 1 || !opts?.method || opts.method === 'GET') {
        return { ok: true, json: async () => ({ docs: [ACTIVE_MATCH], totalDocs: 1 }) };
      }
      // Subsequent calls: PATCH + event POST
      return { ok: true, json: async () => ({}) };
    });

    render(<LiveMatchClient />);
    await waitFor(() => screen.getAllByText('Manual Vote'));

    await act(async () => {
      fireEvent.click(screen.getAllByText('Manual Vote')[0]);
    });

    const { calls } = (global.fetch as ReturnType<typeof vi.fn>).mock;
    const patchCall = calls.find(
      ([url, opts]: [string, RequestInit]) => String(url).includes('/api/madness-matches/') && opts?.method === 'PATCH',
    );
    expect(patchCall).toBeDefined();
  });

  it('shows Overtime status badge and extend/vote buttons when tied and past end time', async () => {
    mockFetch([OVERTIME_MATCH]);
    render(<LiveMatchClient />);
    await waitFor(() => {
      expect(screen.getByText(/⏰ Overtime/)).toBeInTheDocument();
      expect(screen.getAllByText('Manual Vote')).toHaveLength(2);
      expect(screen.getByText(/Extend Overtime/)).toBeInTheDocument();
    });
  });

  it('shows Close Match button when match is past end time and not tied', async () => {
    mockFetch([CLOSEABLE_MATCH]);
    render(<LiveMatchClient />);
    await waitFor(() => {
      expect(screen.getByText('Close Match')).toBeInTheDocument();
    });
  });

  it('does not show action buttons for a closed match', async () => {
    mockFetch([CLOSED_MATCH]);
    render(<LiveMatchClient />);
    await waitFor(() => {
      expect(screen.queryByText('Close Match')).not.toBeInTheDocument();
      expect(screen.queryByText('Manual Vote')).not.toBeInTheDocument();
    });
  });

  it('shows winner crown on the winning band', async () => {
    mockFetch([CLOSED_MATCH]);
    render(<LiveMatchClient />);
    await waitFor(() => {
      expect(screen.getByText(/🏆/)).toBeInTheDocument();
    });
  });

  it('shows an error banner when the API call fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    render(<LiveMatchClient />);
    await waitFor(() => {
      expect(screen.getByText(/Could not load match data/)).toBeInTheDocument();
    });
  });

  it('shows sponsor information when present', async () => {
    const matchWithSponsor = { ...ACTIVE_MATCH, sponsor: 'Acme Corp', sponsorMessage: 'Best music!' };
    mockFetch([matchWithSponsor]);
    render(<LiveMatchClient />);
    await waitFor(() => {
      expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    });
  });

  it('re-fetches match data at the configured poll interval', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockFetch([ACTIVE_MATCH]);
    render(<LiveMatchClient />);
    await waitFor(() => screen.getByText('Radiohead'));

    const callsBefore = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    act(() => { vi.advanceTimersByTime(5001); });
    await waitFor(() => {
      expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(callsBefore);
    });
    vi.useRealTimers();
  });
});
