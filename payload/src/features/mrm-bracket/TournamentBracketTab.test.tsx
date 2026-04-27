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
  EmptyState: ({ message }: { message: string }) => <div data-testid="empty-state">{message}</div>,
}));

vi.mock('./BracketTree', () => ({
  BracketTree: ({ matches }: { matches: { id: string; matchNumber: number }[] }) => (
    <div data-testid="bracket-tree">
      {matches.map((m) => (
        <div key={m.id} data-testid="bracket-match" data-match={m.matchNumber}>
          Match #{m.matchNumber}
        </div>
      ))}
    </div>
  ),
}));

const { useDocumentInfo } = await import('@payloadcms/ui');

const makeMatch = (id: string, matchNumber: number, round: string, overrides: object = {}) => ({
  id,
  matchNumber,
  round,
  region: 1,
  band1Votes: 0,
  band2Votes: 0,
  startTime: new Date(Date.now() + 60_000).toISOString(),
  endTime: new Date(Date.now() + 120_000).toISOString(),
  winner: null,
  band1: { id: 'b1', name: 'Radiohead', seed: 1, placement: 1 },
  band2: { id: 'b2', name: 'Nirvana', seed: 2, placement: 2 },
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

  it('renders BracketTree with all matches', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 't1', name: 'MRM 2025' },
    } as ReturnType<typeof useDocumentInfo>);
    const matches = [makeMatch('m1', 1, '1'), makeMatch('m2', 2, '1'), makeMatch('m3', 33, '2')];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ docs: matches, totalDocs: matches.length }),
    });
    render(<TournamentBracketTab />);
    await waitFor(() => {
      expect(screen.getByTestId('bracket-tree')).toBeInTheDocument();
      expect(screen.getAllByTestId('bracket-match')).toHaveLength(3);
    });
  });

  it('passes matches to BracketTree', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 't1', name: 'MRM 2025' },
    } as ReturnType<typeof useDocumentInfo>);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ docs: [makeMatch('m1', 7, '1')], totalDocs: 1 }),
    });
    render(<TournamentBracketTab />);
    await waitFor(() => {
      expect(screen.getByText('Match #7')).toBeInTheDocument();
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

  it('shows error banner when API returns non-ok response', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 't1', name: 'MRM 2025' },
    } as ReturnType<typeof useDocumentInfo>);
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
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
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('tournament-42'));
    });
  });

  it('renders navigation links', async () => {
    vi.mocked(useDocumentInfo).mockReturnValue({
      data: { id: 't1', name: 'MRM 2025' },
    } as ReturnType<typeof useDocumentInfo>);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ docs: [], totalDocs: 0 }),
    });
    render(<TournamentBracketTab />);
    await waitFor(() => {
      expect(screen.getByText(/All Matches/)).toHaveAttribute(
        'href',
        '/admin/collections/modern-rock-madness-matches',
      );
    });
  });
});
