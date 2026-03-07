import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BracketClient } from './BracketClient';

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

const TOURNAMENT = {
  id: 't1',
  name: 'Modern Rock Madness 2025',
  year: 2025,
  status: 'active',
  startDate: '2025-03-01',
};

const makeMatch = (
  id: string,
  matchNumber: number,
  round: string,
  overrides: object = {},
) => ({
  id,
  matchNumber,
  round,
  band1Votes: 0,
  band2Votes: 0,
  startTime: new Date(Date.now() + 60_000).toISOString(),
  endTime: new Date(Date.now() + 120_000).toISOString(),
  winner: null,
  band1: { id: 'b1', name: 'Radiohead', seed: 1, placement: 1 },
  band2: { id: 'b2', name: 'Nirvana', seed: 1, placement: 2 },
  ...overrides,
});

const mockFetch = (tournamentDocs: object[], matchDocs: object[]) => {
  let callCount = 0;
  global.fetch = vi.fn().mockImplementation(async () => {
    callCount += 1;
    const docs = callCount === 1 ? tournamentDocs : matchDocs;
    return { ok: true, json: async () => ({ docs, totalDocs: docs.length }) };
  });
};

describe('BracketClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading spinner initially', () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ docs: [], totalDocs: 0 }),
    });
    render(<BracketClient />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows empty state when no active tournament', async () => {
    mockFetch([], []);
    render(<BracketClient />);
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('shows tournament name in the heading', async () => {
    mockFetch([TOURNAMENT], [makeMatch('m1', 1, '1')]);
    render(<BracketClient />);
    await waitFor(() => {
      expect(screen.getByText(/Modern Rock Madness 2025/)).toBeInTheDocument();
    });
  });

  it('renders round section heading', async () => {
    mockFetch([TOURNAMENT], [makeMatch('m1', 1, '1')]);
    render(<BracketClient />);
    await waitFor(() => {
      expect(screen.getByText('Round 1 (64→32)')).toBeInTheDocument();
    });
  });

  it('renders band names inside a match card', async () => {
    mockFetch([TOURNAMENT], [makeMatch('m1', 1, '1')]);
    render(<BracketClient />);
    await waitFor(() => {
      expect(screen.getByText(/#1 Radiohead/)).toBeInTheDocument();
      expect(screen.getByText(/#1 Nirvana/)).toBeInTheDocument();
    });
  });

  it('renders a link to edit the match', async () => {
    mockFetch([TOURNAMENT], [makeMatch('m1', 1, '1')]);
    render(<BracketClient />);
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /Match 1/ });
      expect(link).toHaveAttribute('href', '/admin/collections/modern-rock-madness-matches/m1');
    });
  });

  it('groups matches by round correctly', async () => {
    const matches = [
      makeMatch('m1', 1, '1'),
      makeMatch('m2', 2, '1'),
      makeMatch('m3', 33, '2'),
    ];
    mockFetch([TOURNAMENT], matches);
    render(<BracketClient />);
    await waitFor(() => {
      expect(screen.getByText('Round 1 (64→32)')).toBeInTheDocument();
      expect(screen.getByText('Round 2 (32→16)')).toBeInTheDocument();
    });
  });

  it('shows winner trophy on winning band', async () => {
    const closedMatch = makeMatch('m1', 1, '1', {
      band1Votes: 2000,
      band2Votes: 900,
      startTime: new Date(Date.now() - 120_000).toISOString(),
      endTime: new Date(Date.now() - 60_000).toISOString(),
      winner: { id: 'b1', name: 'Radiohead', seed: 1, placement: 1 },
    });
    mockFetch([TOURNAMENT], [closedMatch]);
    render(<BracketClient />);
    await waitFor(() => {
      expect(screen.getByText(/🏆/)).toBeInTheDocument();
    });
  });

  it('shows error banner when API fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    render(<BracketClient />);
    await waitFor(() => {
      expect(screen.getByText(/Could not load bracket data/)).toBeInTheDocument();
    });
  });
});
