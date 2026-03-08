import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TournamentBracketTab } from './TournamentBracketTab';

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
  EmptyState: ({ message }: { message: string }) => (
    <div data-testid="empty-state">{message}</div>
  ),
}));

const { useDocumentInfo } = await import('@payloadcms/ui');

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

describe('TournamentBracketTab', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows empty state when tournament has no id (unsaved)', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: {},
    } as ReturnType<typeof useDocumentInfo>);
    render(<TournamentBracketTab />);
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toHaveTextContent(/Save this tournament first/);
    });
  });

  it('shows empty state when no matches found', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 't1', name: 'MRM 2025' },
    } as ReturnType<typeof useDocumentInfo>);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ docs: [], totalDocs: 0 }),
    });
    render(<TournamentBracketTab />);
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toHaveTextContent(/No matches found/);
    });
  });

  it('renders matches grouped by round', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 't1', name: 'MRM 2025' },
    } as ReturnType<typeof useDocumentInfo>);
    const matches = [
      makeMatch('m1', 1, '1'),
      makeMatch('m2', 2, '1'),
      makeMatch('m3', 33, '2'),
    ];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ docs: matches, totalDocs: matches.length }),
    });
    render(<TournamentBracketTab />);
    await waitFor(() => {
      expect(screen.getByText('Round 1 (64→32)')).toBeInTheDocument();
      expect(screen.getByText('Round 2 (32→16)')).toBeInTheDocument();
    });
  });

  it('renders band names inside match cards', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 't1', name: 'MRM 2025' },
    } as ReturnType<typeof useDocumentInfo>);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ docs: [makeMatch('m1', 1, '1')], totalDocs: 1 }),
    });
    render(<TournamentBracketTab />);
    await waitFor(() => {
      expect(screen.getByText(/#1 Radiohead/)).toBeInTheDocument();
      expect(screen.getByText(/#1 Nirvana/)).toBeInTheDocument();
    });
  });

  it('renders match links to edit individual matches', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 't1', name: 'MRM 2025' },
    } as ReturnType<typeof useDocumentInfo>);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ docs: [makeMatch('m1', 1, '1')], totalDocs: 1 }),
    });
    render(<TournamentBracketTab />);
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /Match 1/ });
      expect(link).toHaveAttribute('href', '/admin/collections/modern-rock-madness-matches/m1');
    });
  });

  it('shows winner trophy on winning band', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 't1', name: 'MRM 2025' },
    } as ReturnType<typeof useDocumentInfo>);
    const closedMatch = makeMatch('m1', 1, '1', {
      band1Votes: 2000,
      band2Votes: 900,
      startTime: new Date(Date.now() - 120_000).toISOString(),
      endTime: new Date(Date.now() - 60_000).toISOString(),
      winner: { id: 'b1', name: 'Radiohead', seed: 1, placement: 1 },
    });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ docs: [closedMatch], totalDocs: 1 }),
    });
    render(<TournamentBracketTab />);
    await waitFor(() => {
      expect(screen.getByText(/🏆/)).toBeInTheDocument();
    });
  });

  it('shows error banner when API fails', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 't1', name: 'MRM 2025' },
    } as ReturnType<typeof useDocumentInfo>);
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    render(<TournamentBracketTab />);
    await waitFor(() => {
      expect(screen.getByText(/Could not load bracket data/)).toBeInTheDocument();
    });
  });

  it('fetches matches for the specific tournament ID', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 'tournament-42', name: 'MRM 2025' },
    } as ReturnType<typeof useDocumentInfo>);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ docs: [], totalDocs: 0 }),
    });
    render(<TournamentBracketTab />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('tournament-42'),
      );
    });
  });
});
