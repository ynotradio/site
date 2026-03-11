import React from 'react';
import type { LiveMatch } from './types';
import {
  TOURNAMENT_EDIT_BASE,
  MATCH_EDIT_BASE,
  LIVE_DASHBOARD_URL,
  getVotePercent,
  getBandName,
  getBandSeed,
  isWinner,
} from './matchControlsUtils';

export interface BandPanelProps {
  match: LiveMatch;
  bandKey: 'band1' | 'band2';
  bandIndex: number;
  total: number;
  canVote: boolean;
  saving: boolean;
  onManualVote: (bandKey: 'band1' | 'band2') => Promise<void>;
}

export const BandPanel: React.FC<BandPanelProps> = ({
  match,
  bandKey,
  bandIndex,
  total,
  canVote,
  saving,
  onManualVote,
}) => {
  const band = match[bandKey];
  const votes = bandKey === 'band1' ? match.band1Votes : match.band2Votes;
  const pct = getVotePercent(votes, total);
  const won = isWinner(match, bandKey);
  const seed = getBandSeed(band);
  return (
    <div className={`match-controls-tab__band ${won ? 'match-controls-tab__band--winner' : ''}`}>
      <div className="match-controls-tab__band-name">
        {seed !== null && <span className="match-controls-tab__seed">#{seed}</span>}
        {getBandName(band)}
        {won && <span className="match-controls-tab__crown"> 🏆</span>}
      </div>
      <div className="match-controls-tab__votes">
        <span className="match-controls-tab__vote-count">{votes.toLocaleString()}</span>
        <span className="match-controls-tab__vote-pct">{pct}%</span>
      </div>
      <button
        type="button"
        className="match-controls-tab__vote-btn"
        onClick={() => onManualVote(bandKey)}
        disabled={saving || !canVote}
        aria-label={`Manual vote for ${getBandName(band)} (band ${bandIndex + 1})`}
      >
        {saving ? '…' : 'Manual Vote'}
      </button>
    </div>
  );
};

export interface NavLinksProps {
  tournamentId: string | null;
  nextMatchId: string | null;
}

export const NavLinks: React.FC<NavLinksProps> = ({ tournamentId, nextMatchId }) => (
  <nav className="match-controls-tab__nav">
    {tournamentId && (
      <a
        href={`${TOURNAMENT_EDIT_BASE}/${tournamentId}/bracket`}
        className="match-controls-tab__nav-link"
      >
        ← Tournament Bracket
      </a>
    )}
    <a href={LIVE_DASHBOARD_URL} className="match-controls-tab__nav-link">
      📡 Live Dashboard
    </a>
    {nextMatchId && (
      <a href={`${MATCH_EDIT_BASE}/${nextMatchId}`} className="match-controls-tab__nav-link">
        Next Match →
      </a>
    )}
  </nav>
);

export interface ActionButtonsProps {
  saving: boolean;
  canClose: boolean;
  canExtend: boolean;
  onClose: () => Promise<void>;
  onExtend: () => Promise<void>;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  saving,
  canClose,
  canExtend,
  onClose,
  onExtend,
}) => (
  <div className="match-controls-tab__actions">
    <button
      type="button"
      className="match-controls-tab__action-btn match-controls-tab__action-btn--danger"
      onClick={onClose}
      disabled={saving || !canClose}
    >
      {saving ? 'Closing…' : 'Close Match'}
    </button>
    <button
      type="button"
      className="match-controls-tab__action-btn match-controls-tab__action-btn--warning"
      onClick={onExtend}
      disabled={saving || !canExtend}
    >
      {saving ? 'Extending…' : 'Extend Overtime (+15 min)'}
    </button>
  </div>
);
