import React from 'react';
import type { LiveMatch, MatchStatus } from './types';
import { RematchScheduler } from './RematchScheduler';
import {
  TOURNAMENT_EDIT_BASE,
  MATCH_EDIT_BASE,
  ROUND_LABELS,
  STATUS_LABELS,
  getVotePercent,
  getBandName,
  getBandSeed,
  getBandImageUrl,
  getBandId,
  isWinner,
  getCenterDisplay,
  getVotesUrl,
  getEventsUrl,
  getGroupUrl,
} from './matchControlsUtils';

const NAV_CLS = 'match-controls-tab__nav-link';
const LINK_CLS = 'match-controls-tab__admin-link';

export interface NavLinksProps {
  tournamentId: string | null;
  previousMatchId: string | null;
  nextMatchId: string | null;
}

export const NavLinks: React.FC<NavLinksProps> = ({
  tournamentId,
  previousMatchId,
  nextMatchId,
}) => (
  <nav className="match-controls-tab__nav">
    {previousMatchId && (
      <a href={`${MATCH_EDIT_BASE}/${previousMatchId}/controls`} className={NAV_CLS}>
        ← Previous Match
      </a>
    )}
    {tournamentId && (
      <a href={`${TOURNAMENT_EDIT_BASE}/${tournamentId}/bracket`} className={NAV_CLS}>
        Tournament Bracket
      </a>
    )}
    {nextMatchId && (
      <a href={`${MATCH_EDIT_BASE}/${nextMatchId}/controls`} className={NAV_CLS}>
        Next Match →
      </a>
    )}
  </nav>
);

export interface MatchCardHeaderProps {
  match: LiveMatch;
  status: MatchStatus;
}

export const MatchCardHeader: React.FC<MatchCardHeaderProps> = ({ match, status }) => {
  const statusCls = `match-controls-tab__status match-controls-tab__status--${status}`;
  return (
    <div className="match-controls-tab__card-header">
      <span className="match-controls-tab__round">
        {ROUND_LABELS[match.round] ?? `Round ${match.round}`}
        {' · Match #'}
        {match.matchNumber}
      </span>
      <span className={statusCls}>{STATUS_LABELS[status]}</span>
    </div>
  );
};

interface BandColumnProps {
  match: LiveMatch;
  bandKey: 'band1' | 'band2';
  total: number;
  saving: boolean;
  onManualVote: (bandKey: 'band1' | 'band2') => Promise<void>;
}

const BandColumn: React.FC<BandColumnProps> = ({
  match, bandKey, total, saving, onManualVote,
}) => {
  const band = match[bandKey];
  const votes = bandKey === 'band1' ? match.band1Votes : match.band2Votes;
  const pct = getVotePercent(votes, total);
  const won = isWinner(match, bandKey);
  const lost = Boolean(match.winner) && !won;
  const seed = getBandSeed(band);
  const imgUrl = getBandImageUrl(band);
  const name = getBandName(band);
  const loserCls = 'match-controls-tab__band-col--loser';
  const colCls = lost ? `match-controls-tab__band-col ${loserCls}` : 'match-controls-tab__band-col';

  return (
    <div className={colCls}>
      <div className="match-controls-tab__band-name">
        {seed !== null && <span className="match-controls-tab__seed">#{seed}</span>}
        {name}
        {won && <span className="match-controls-tab__crown"> 🏆</span>}
      </div>
      {imgUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imgUrl} alt={name} className="match-controls-tab__band-img" />
      ) : (
        <div
          className="match-controls-tab__band-img-placeholder"
          aria-label={`${name} placeholder`}
        >
          🎸
        </div>
      )}
      <div className="match-controls-tab__band-votes">
        <span className="match-controls-tab__vote-count">{votes.toLocaleString()}</span>
        <span className="match-controls-tab__vote-pct">{pct}%</span>
      </div>
      <button
        type="button"
        className="match-controls-tab__vote-btn"
        onClick={() => onManualVote(bandKey)}
        disabled={saving}
        aria-label={`Manual vote for ${name}`}
      >
        {saving ? '…' : 'Manual Vote'}
      </button>
    </div>
  );
};

const CenterColumn: React.FC<{ match: LiveMatch }> = ({ match }) => {
  const display = getCenterDisplay(match);
  const base = 'match-controls-tab__timer';
  const mod = display.type !== 'countdown' ? ` ${base}--${display.type}` : '';
  return (
    <div className="match-controls-tab__center-col">
      <span className={`${base}${mod}`}>{display.text}</span>
    </div>
  );
};

export interface MatchCardBodyProps {
  match: LiveMatch;
  saving: boolean;
  onManualVote: (bandKey: 'band1' | 'band2') => Promise<void>;
}

export const MatchCardBody: React.FC<MatchCardBodyProps> = ({ match, saving, onManualVote }) => {
  const total = match.band1Votes + match.band2Votes;
  return (
    <div className="match-controls-tab__card-body">
      <BandColumn
        match={match}
        bandKey="band1"
        total={total}
        saving={saving}
        onManualVote={onManualVote}
      />
      <CenterColumn match={match} />
      <BandColumn
        match={match}
        bandKey="band2"
        total={total}
        saving={saving}
        onManualVote={onManualVote}
      />
    </div>
  );
};

export interface ActionButtonsProps {
  saving: boolean;
  showScore: boolean;
  canClose: boolean;
  canExtend: boolean;
  onClose: () => Promise<void>;
  onExtend: () => Promise<void>;
  onToggleShowScore: () => Promise<void>;
  onRematch: (startISO: string, durationMin: number) => Promise<void>;
}

// eslint-disable-next-line max-len
const DANGER_CLS = 'match-controls-tab__action-btn match-controls-tab__action-btn--danger';
// eslint-disable-next-line max-len
const WARN_CLS = 'match-controls-tab__action-btn match-controls-tab__action-btn--warning';
const DEFAULT_CLS = 'match-controls-tab__action-btn';

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  saving,
  showScore,
  canClose,
  canExtend,
  onClose,
  onExtend,
  onToggleShowScore,
  onRematch,
}) => (
  <div className="match-controls-tab__actions">
    <button type="button" className={DANGER_CLS} onClick={onClose} disabled={saving || !canClose}>
      {saving ? 'Closing…' : 'Close Match'}
    </button>
    <button type="button" className={WARN_CLS} onClick={onExtend} disabled={saving || !canExtend}>
      {saving ? 'Extending…' : 'Extend Overtime (+15 min)'}
    </button>
    <button type="button" className={DEFAULT_CLS} onClick={onToggleShowScore} disabled={saving}>
      {showScore ? '🙈 Hide Scores' : '👁️ Show Scores'}
    </button>
    <RematchScheduler saving={saving} onConfirm={onRematch} />
  </div>
);

interface AdminLink {
  href: string;
  label: string;
}

const buildAdminLinks = (match: LiveMatch): AdminLink[] => {
  const b1 = getBandId(match.band1);
  const b2 = getBandId(match.band2);
  const links: AdminLink[] = [
    { href: getVotesUrl(String(match.id)), label: '📊 Votes' },
    { href: getEventsUrl(String(match.id)), label: '📋 Events' },
  ];
  if (b1) links.push({ href: getGroupUrl(b1), label: `🎵 ${getBandName(match.band1)}` });
  if (b2) links.push({ href: getGroupUrl(b2), label: `🎵 ${getBandName(match.band2)}` });
  return links;
};

export const AdminLinks: React.FC<{ match: LiveMatch }> = ({ match }) => (
  <div className="match-controls-tab__admin-links">
    {buildAdminLinks(match).map((link) => (
      <a key={link.href} href={link.href} className={LINK_CLS}>
        {link.label}
      </a>
    ))}
  </div>
);
