import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { LiveMatch, MrmGroupSummary } from './types';
import {
  NavLinks,
  MatchCardHeader,
  MatchCardBody,
  ActionButtons,
  AdminLinks,
} from './MatchControlsPanels';

vi.mock('./RematchScheduler', () => ({
  RematchScheduler: ({ saving, onConfirm }: { saving: boolean; onConfirm: () => void }) => (
    <button type="button" data-testid="rematch-scheduler" disabled={saving} onClick={onConfirm}>
      Mock Rematch
    </button>
  ),
}));

const PAST = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
const FUTURE = (min: number) => new Date(Date.now() + min * 60_000).toISOString();

const BAND1: MrmGroupSummary = {
  id: 'b1',
  name: 'Radiohead',
  seed: 1,
  placement: 1,
};
const BAND2: MrmGroupSummary = {
  id: 'b2',
  name: 'Nirvana',
  seed: 2,
  placement: 2,
};

const makeLiveMatch = (overrides: Partial<LiveMatch> = {}): LiveMatch => ({
  id: 'match-1',
  matchNumber: 7,
  round: '1',
  band1: BAND1,
  band2: BAND2,
  band1Votes: 1200,
  band2Votes: 900,
  startTime: PAST(30),
  endTime: FUTURE(30),
  winner: null,
  showScore: true,
  ...overrides,
});

/* ─── NavLinks ──────────────────────────────────────────────────── */

describe('NavLinks', () => {
  it('renders previous match link when previousMatchId is provided', () => {
    render(<NavLinks tournamentId={null} previousMatchId="prev-1" nextMatchId={null} />);
    const link = screen.getByText('← Previous Match');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining('prev-1'));
  });

  it('renders next match link when nextMatchId is provided', () => {
    render(<NavLinks tournamentId={null} previousMatchId={null} nextMatchId="next-1" />);
    const link = screen.getByText('Next Match →');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining('next-1'));
  });

  it('renders tournament bracket link when tournamentId is provided', () => {
    render(<NavLinks tournamentId="t-1" previousMatchId={null} nextMatchId={null} />);
    const link = screen.getByText('Tournament Bracket');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining('t-1'));
  });

  it('renders all three links when all IDs are provided', () => {
    render(<NavLinks tournamentId="t-1" previousMatchId="prev-1" nextMatchId="next-1" />);
    expect(screen.getByText('← Previous Match')).toBeInTheDocument();
    expect(screen.getByText('Tournament Bracket')).toBeInTheDocument();
    expect(screen.getByText('Next Match →')).toBeInTheDocument();
  });

  it('renders no links when all IDs are null', () => {
    const { container } = render(
      <NavLinks tournamentId={null} previousMatchId={null} nextMatchId={null} />,
    );
    expect(container.querySelectorAll('a')).toHaveLength(0);
  });
});

/* ─── MatchCardHeader ───────────────────────────────────────────── */

describe('MatchCardHeader', () => {
  it('renders round label and match number', () => {
    const match = makeLiveMatch({ round: '3', matchNumber: 12 });
    render(<MatchCardHeader match={match} status="live" />);
    expect(screen.getByText(/Swell 16/)).toBeInTheDocument();
    expect(screen.getByText(/Match #12/)).toBeInTheDocument();
  });

  it('falls back to generic round label for unknown rounds', () => {
    const match = makeLiveMatch({ round: '99', matchNumber: 1 });
    render(<MatchCardHeader match={match} status="live" />);
    expect(screen.getByText(/Round 99/)).toBeInTheDocument();
  });

  it('renders status label for live status', () => {
    render(<MatchCardHeader match={makeLiveMatch()} status="live" />);
    expect(screen.getByText('🔴 LIVE')).toBeInTheDocument();
  });

  it('renders status label for upcoming status', () => {
    render(<MatchCardHeader match={makeLiveMatch()} status="upcoming" />);
    expect(screen.getByText('⏳ Upcoming')).toBeInTheDocument();
  });

  it('renders status label for overtime status', () => {
    render(<MatchCardHeader match={makeLiveMatch()} status="overtime" />);
    expect(screen.getByText('⏰ Overtime')).toBeInTheDocument();
  });

  it('renders status label for closed status', () => {
    render(<MatchCardHeader match={makeLiveMatch()} status="closed" />);
    expect(screen.getByText('✅ Closed')).toBeInTheDocument();
  });

  it('applies status-specific CSS class', () => {
    const { container } = render(<MatchCardHeader match={makeLiveMatch()} status="overtime" />);
    expect(container.querySelector('.match-controls-tab__status--overtime')).toBeInTheDocument();
  });
});

/* ─── MatchCardBody ─────────────────────────────────────────────── */

describe('MatchCardBody', () => {
  const onManualVote = vi.fn().mockResolvedValue(undefined);

  it('renders both band names', () => {
    render(<MatchCardBody match={makeLiveMatch()} saving={false} onManualVote={onManualVote} />);
    expect(screen.getByText('Radiohead')).toBeInTheDocument();
    expect(screen.getByText('Nirvana')).toBeInTheDocument();
  });

  it('renders seed numbers', () => {
    render(<MatchCardBody match={makeLiveMatch()} saving={false} onManualVote={onManualVote} />);
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('renders vote counts', () => {
    render(<MatchCardBody match={makeLiveMatch()} saving={false} onManualVote={onManualVote} />);
    expect(screen.getByText('1,200')).toBeInTheDocument();
    expect(screen.getByText('900')).toBeInTheDocument();
  });

  it('renders vote percentages', () => {
    render(<MatchCardBody match={makeLiveMatch()} saving={false} onManualVote={onManualVote} />);
    expect(screen.getByText('57%')).toBeInTheDocument();
    expect(screen.getByText('43%')).toBeInTheDocument();
  });

  it('renders Manual Vote buttons for both bands', () => {
    render(<MatchCardBody match={makeLiveMatch()} saving={false} onManualVote={onManualVote} />);
    const buttons = screen.getAllByText('Manual Vote');
    expect(buttons).toHaveLength(2);
  });

  it('disables vote buttons when saving', () => {
    render(<MatchCardBody match={makeLiveMatch()} saving onManualVote={onManualVote} />);
    const buttons = screen.getAllByRole('button', { name: /manual vote/i });
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('shows ellipsis text on buttons when saving', () => {
    render(<MatchCardBody match={makeLiveMatch()} saving onManualVote={onManualVote} />);
    const buttons = screen.getAllByText('…');
    expect(buttons).toHaveLength(2);
  });

  it('calls onManualVote with band1 when first button is clicked', () => {
    render(<MatchCardBody match={makeLiveMatch()} saving={false} onManualVote={onManualVote} />);
    fireEvent.click(screen.getByLabelText('Manual vote for Radiohead'));
    expect(onManualVote).toHaveBeenCalledWith('band1');
  });

  it('calls onManualVote with band2 when second button is clicked', () => {
    render(<MatchCardBody match={makeLiveMatch()} saving={false} onManualVote={onManualVote} />);
    fireEvent.click(screen.getByLabelText('Manual vote for Nirvana'));
    expect(onManualVote).toHaveBeenCalledWith('band2');
  });

  it('renders crown emoji for the winning band', () => {
    const match = makeLiveMatch({
      endTime: PAST(30),
      winner: BAND1,
    });
    render(<MatchCardBody match={match} saving={false} onManualVote={onManualVote} />);
    expect(screen.getByText(/🏆/)).toBeInTheDocument();
  });

  it('applies loser class to the losing band', () => {
    const match = makeLiveMatch({
      endTime: PAST(30),
      winner: BAND1,
    });
    const { container } = render(
      <MatchCardBody match={match} saving={false} onManualVote={onManualVote} />,
    );
    expect(container.querySelector('.match-controls-tab__band-col--loser')).toBeInTheDocument();
  });

  it('renders TBD when band is null', () => {
    const match = makeLiveMatch({ band1: null, band2: null });
    render(<MatchCardBody match={match} saving={false} onManualVote={onManualVote} />);
    const tbds = screen.getAllByText('(TBD)');
    expect(tbds).toHaveLength(2);
  });

  it('renders placeholder image when band has no image', () => {
    render(<MatchCardBody match={makeLiveMatch()} saving={false} onManualVote={onManualVote} />);
    expect(screen.getByLabelText('Radiohead placeholder')).toBeInTheDocument();
    expect(screen.getByLabelText('Nirvana placeholder')).toBeInTheDocument();
  });

  it('renders band image when band has an image URL', () => {
    const band1WithImage = { ...BAND1, image: { url: 'https://example.com/radiohead.jpg' } };
    const match = makeLiveMatch({ band1: band1WithImage as any });
    render(<MatchCardBody match={match} saving={false} onManualVote={onManualVote} />);
    const img = screen.getByRole('img', { name: 'Radiohead' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/radiohead.jpg');
    expect(screen.queryByLabelText('Radiohead placeholder')).not.toBeInTheDocument();
  });

  it('renders 50%/50% when both bands have zero votes', () => {
    const match = makeLiveMatch({ band1Votes: 0, band2Votes: 0 });
    render(<MatchCardBody match={match} saving={false} onManualVote={onManualVote} />);
    const fiftyPcts = screen.getAllByText('50%');
    expect(fiftyPcts).toHaveLength(2);
  });
});

/* ─── ActionButtons ─────────────────────────────────────────────── */

describe('ActionButtons', () => {
  const defaultProps = {
    saving: false,
    showScore: true,
    canClose: true,
    canExtend: true,
    onClose: vi.fn().mockResolvedValue(undefined),
    onExtend: vi.fn().mockResolvedValue(undefined),
    onToggleShowScore: vi.fn().mockResolvedValue(undefined),
    onRematch: vi.fn().mockResolvedValue(undefined),
  };

  it('renders Close Match button', () => {
    render(<ActionButtons {...defaultProps} />);
    expect(screen.getByText('Close Match')).toBeInTheDocument();
  });

  it('renders Extend Overtime button', () => {
    render(<ActionButtons {...defaultProps} />);
    expect(screen.getByText('Extend Overtime (+15 min)')).toBeInTheDocument();
  });

  it('renders Hide Scores button when showScore is true', () => {
    render(<ActionButtons {...defaultProps} showScore />);
    expect(screen.getByText('🙈 Hide Scores')).toBeInTheDocument();
  });

  it('renders Show Scores button when showScore is false', () => {
    render(<ActionButtons {...defaultProps} showScore={false} />);
    expect(screen.getByText('👁️ Show Scores')).toBeInTheDocument();
  });

  it('disables Close Match when canClose is false', () => {
    render(<ActionButtons {...defaultProps} canClose={false} />);
    expect(screen.getByText('Close Match')).toBeDisabled();
  });

  it('disables Extend when canExtend is false', () => {
    render(<ActionButtons {...defaultProps} canExtend={false} />);
    expect(screen.getByText('Extend Overtime (+15 min)')).toBeDisabled();
  });

  it('disables all buttons and shows saving text when saving', () => {
    render(<ActionButtons {...defaultProps} saving />);
    expect(screen.getByText('Closing…')).toBeDisabled();
    expect(screen.getByText('Extending…')).toBeDisabled();
    expect(screen.getByText('🙈 Hide Scores')).toBeDisabled();
  });

  it('calls onClose when Close Match is clicked', () => {
    render(<ActionButtons {...defaultProps} />);
    fireEvent.click(screen.getByText('Close Match'));
    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it('calls onExtend when Extend is clicked', () => {
    render(<ActionButtons {...defaultProps} />);
    fireEvent.click(screen.getByText('Extend Overtime (+15 min)'));
    expect(defaultProps.onExtend).toHaveBeenCalledOnce();
  });

  it('calls onToggleShowScore when toggle button is clicked', () => {
    render(<ActionButtons {...defaultProps} />);
    fireEvent.click(screen.getByText('🙈 Hide Scores'));
    expect(defaultProps.onToggleShowScore).toHaveBeenCalledOnce();
  });

  it('renders the RematchScheduler', () => {
    render(<ActionButtons {...defaultProps} />);
    expect(screen.getByTestId('rematch-scheduler')).toBeInTheDocument();
  });
});

/* ─── AdminLinks ────────────────────────────────────────────────── */

describe('AdminLinks', () => {
  it('renders Votes and Events links for any match', () => {
    render(<AdminLinks match={makeLiveMatch()} />);
    expect(screen.getByText('📊 Votes')).toBeInTheDocument();
    expect(screen.getByText('📋 Events')).toBeInTheDocument();
  });

  it('renders group links for both bands', () => {
    render(<AdminLinks match={makeLiveMatch()} />);
    expect(screen.getByText('🎵 Radiohead')).toBeInTheDocument();
    expect(screen.getByText('🎵 Nirvana')).toBeInTheDocument();
  });

  it('renders Votes and Events links with match ID in URL', () => {
    render(<AdminLinks match={makeLiveMatch()} />);
    expect(screen.getByText('📊 Votes')).toHaveAttribute(
      'href',
      expect.stringContaining('match-1'),
    );
    expect(screen.getByText('📋 Events')).toHaveAttribute(
      'href',
      expect.stringContaining('match-1'),
    );
  });

  it('renders group links with band IDs in URLs', () => {
    render(<AdminLinks match={makeLiveMatch()} />);
    expect(screen.getByText('🎵 Radiohead')).toHaveAttribute('href', expect.stringContaining('b1'));
    expect(screen.getByText('🎵 Nirvana')).toHaveAttribute('href', expect.stringContaining('b2'));
  });

  it('omits band group links when bands are null', () => {
    const match = makeLiveMatch({ band1: null, band2: null });
    render(<AdminLinks match={match} />);
    expect(screen.getByText('📊 Votes')).toBeInTheDocument();
    expect(screen.getByText('📋 Events')).toBeInTheDocument();
    expect(screen.queryByText(/🎵/)).not.toBeInTheDocument();
  });

  it('renders only one band link when one band is null', () => {
    const match = makeLiveMatch({ band2: null });
    render(<AdminLinks match={match} />);
    expect(screen.getByText('🎵 Radiohead')).toBeInTheDocument();
    expect(screen.queryByText('🎵 Nirvana')).not.toBeInTheDocument();
  });
});
