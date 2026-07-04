import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  StatusCard,
  ResultsCard,
  WriteInsCard,
  WinnerDrawCard,
  formatWeekOf,
} from './Top11ContestControlsPanels';

vi.mock('../shared/EmptyState', () => ({
  EmptyState: ({ message }: { message: string }) => <div data-testid="empty-state">{message}</div>,
}));

const CONTEST = {
  id: 1,
  status: 'closed' as const,
  weekOf: '2026-06-25T00:00:00.000Z',
};

const STATS = {
  contestId: 1,
  status: 'closed' as const,
  totalVotes: 120,
  uniqueVoters: 118,
  contestants: 4,
  newsletterOptInContestants: 3,
  writeInCount: 2,
  rankedWriteIns: [{ text: 'Wet Leg - Catch These Fists', count: 2, hiddenCount: 0 }],
  rankedSongs: [
    {
      song: 5527,
      songTitle: 'Chance to Bleed',
      songArtist: 'Kurt Vile',
      displayOrder: 1,
      votes: 23,
    },
  ],
};

describe('formatWeekOf', () => {
  it('formats a valid ISO date as a readable string', () => {
    expect(formatWeekOf('2026-06-25T00:00:00.000Z')).toBe('Thu, Jun 25, 2026');
  });

  it('falls back to the raw string for an invalid date', () => {
    expect(formatWeekOf('not-a-date')).toBe('not-a-date');
  });
});

describe('StatusCard', () => {
  it('renders the formatted week and status badge', () => {
    render(<StatusCard contest={CONTEST} saving={false} onSetStatus={vi.fn()} onClone={vi.fn()} />);
    expect(screen.getByText('Thu, Jun 25, 2026')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('renders related-record links scoped to the contest', () => {
    render(<StatusCard contest={CONTEST} saving={false} onSetStatus={vi.fn()} onClone={vi.fn()} />);
    const votesLink = screen.getByText('🗳️ Votes').closest('a');
    expect(votesLink).toHaveAttribute(
      'href',
      '/admin/collections/top11-votes?where[contest][equals]=1',
    );
  });

  it('shows only the transitions valid for the current status', () => {
    render(<StatusCard contest={CONTEST} saving={false} onSetStatus={vi.fn()} onClone={vi.fn()} />);
    expect(screen.getByText('Reopen Voting')).toBeInTheDocument();
    expect(screen.getByText('Publish Results')).toBeInTheDocument();
    expect(screen.queryByText('Close Voting')).not.toBeInTheDocument();
  });
});

describe('ResultsCard', () => {
  it('renders stat totals and ranked songs with artist/title', () => {
    render(<ResultsCard stats={STATS} />);
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('Kurt Vile — Chance to Bleed')).toBeInTheDocument();
  });

  it('links each song to its admin edit page', () => {
    render(<ResultsCard stats={STATS} />);
    const link = screen.getByText('Kurt Vile — Chance to Bleed').closest('a');
    expect(link).toHaveAttribute('href', '/admin/collections/songs/5527');
  });

  it('shows an empty state when stats are unavailable', () => {
    render(<ResultsCard stats={null} />);
    expect(screen.getByTestId('empty-state')).toHaveTextContent('Stats are not available yet.');
  });
});

describe('WriteInsCard', () => {
  it('renders grouped write-ins', () => {
    render(<WriteInsCard stats={STATS} />);
    expect(screen.getByText('Wet Leg - Catch These Fists')).toBeInTheDocument();
  });

  it('shows an empty state when there are no write-ins', () => {
    render(<WriteInsCard stats={{ ...STATS, rankedWriteIns: [] }} />);
    expect(screen.getByTestId('empty-state')).toHaveTextContent('No write-ins submitted yet.');
  });
});

describe('WinnerDrawCard', () => {
  it('renders the last winner result when present', () => {
    render(
      <WinnerDrawCard
        saving={false}
        canPickWinner
        lastWinner={{
          winner: {
            id: 1,
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
          },
          drawLogId: 1,
          totalEntries: 4,
          eligibleEntries: 3,
          excludePriorWinners: true,
        }}
        onPickWinner={vi.fn()}
      />,
    );
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText(/Drawn from 3 of 4 eligible entries/)).toBeInTheDocument();
  });

  it('disables Pick Winner and shows a hint when not eligible', () => {
    render(
      <WinnerDrawCard
        saving={false}
        canPickWinner={false}
        lastWinner={null}
        onPickWinner={vi.fn()}
      />,
    );
    expect(screen.getByText('Pick Winner')).toBeDisabled();
    expect(screen.getByText(/Voting must be closed/)).toBeInTheDocument();
  });
});
