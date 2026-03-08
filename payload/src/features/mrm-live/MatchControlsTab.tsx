'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Gutter, useDocumentInfo } from '@payloadcms/ui';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import { useMatchActions } from './useMatchActions';
import type { LiveMatch, MatchStatus } from './types';
import './MatchControlsTab.css';

const POLL_INTERVAL_MS = 5000;

const getMatchStatus = (match: LiveMatch): MatchStatus => {
  const now = Date.now();
  const start = new Date(match.startTime).getTime();
  const end = new Date(match.endTime).getTime();
  if (now < start) return 'upcoming';
  if (now <= end) return 'live';
  if (!match.winner) return 'overtime';
  return 'closed';
};

const getVotePercent = (votes: number, total: number): number => {
  if (total === 0) return 50;
  return Math.round((votes / total) * 100);
};

const getBandName = (band: LiveMatch['band1']): string => {
  if (!band) return '(TBD)';
  return typeof band === 'string' ? band : band.name;
};

const getBandSeed = (band: LiveMatch['band1']): number | null => {
  if (!band || typeof band === 'string') return null;
  return band.seed;
};

const isWinner = (match: LiveMatch, bandKey: 'band1' | 'band2'): boolean => {
  if (!match.winner) return false;
  const band = match[bandKey];
  if (!band || typeof band === 'string') return false;
  const winnerId = typeof match.winner === 'string' ? match.winner : match.winner.id;
  return band.id === winnerId;
};

interface BandPanelProps {
  match: LiveMatch;
  bandKey: 'band1' | 'band2';
  bandIndex: number;
  total: number;
  canVote: boolean;
  saving: boolean;
  onManualVote: (bandKey: 'band1' | 'band2') => Promise<void>;
}

const BandPanel: React.FC<BandPanelProps> = ({
  match, bandKey, bandIndex, total, canVote, saving, onManualVote,
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
      <div className="match-controls-tab__bar-track">
        <div className="match-controls-tab__bar-fill" style={{ width: `${pct}%` }} aria-label={`${pct}% of votes`} />
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

const STATUS_LABELS: Record<MatchStatus, string> = {
  live: '🔴 LIVE',
  upcoming: '⏳ Upcoming',
  overtime: '⏰ Overtime',
  closed: '✅ Closed',
};

interface MatchControlsPanelProps {
  match: LiveMatch;
  saving: boolean;
  error: string | null;
  successMessage: string | null;
  onManualVote: (bandKey: 'band1' | 'band2') => Promise<void>;
  onClose: () => Promise<void>;
  onExtend: () => Promise<void>;
}

const MatchControlsPanel: React.FC<MatchControlsPanelProps> = ({
  match, saving, error, successMessage, onManualVote, onClose, onExtend,
}) => {
  const status = getMatchStatus(match);
  const isTied = match.band1Votes === match.band2Votes && !match.winner;

  const canVote = status === 'live' || (status === 'overtime' && isTied);
  const canClose = status === 'overtime' && !isTied;
  const canExtend = status === 'overtime' && isTied;
  const total = match.band1Votes + match.band2Votes;

  return (
    <div className="match-controls-tab">
      {error && <div className="match-controls-tab__alert match-controls-tab__alert--error">{error}</div>}
      {successMessage && <div className="match-controls-tab__alert match-controls-tab__alert--success">{successMessage}</div>}

      <div className="match-controls-tab__meta">
        <span className={`match-controls-tab__status match-controls-tab__status--${status}`}>
          {STATUS_LABELS[status]}
        </span>
        <span className="match-controls-tab__round">
          Round {match.round} · Match #{match.matchNumber}
        </span>
      </div>

      <div className="match-controls-tab__bands">
        {(['band1', 'band2'] as const).map((bandKey, i) => (
          <BandPanel
            key={bandKey}
            match={match}
            bandKey={bandKey}
            bandIndex={i}
            total={total}
            canVote={canVote}
            saving={saving}
            onManualVote={onManualVote}
          />
        ))}
      </div>

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

      {match.sponsor && (
        <div className="match-controls-tab__sponsor">
          <strong>Sponsor:</strong>
          {' '}
          {match.sponsor}
          {match.sponsorMessage && <p>{match.sponsorMessage}</p>}
        </div>
      )}

      <div className="match-controls-tab__times">
        <span>Start: {new Date(match.startTime).toLocaleString()}</span>
        <span>End: {new Date(match.endTime).toLocaleString()}</span>
      </div>
    </div>
  );
};

export const MatchControlsTab: React.FC = () => {
  const { data } = useDocumentInfo();
  const matchId = data?.id as string | undefined;

  const [match, setMatch] = useState<LiveMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchMatch = useCallback(async () => {
    if (!matchId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/modern-rock-madness-matches/${matchId}?depth=2`,
      );
      if (!res.ok) throw new Error('Failed to fetch match');
      const doc: LiveMatch = await res.json();
      setMatch(doc);
      setFetchError(null);
    } catch (err) {
      setFetchError('Could not load match data.');
      // eslint-disable-next-line no-console
      console.error('MatchControlsTab fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => { fetchMatch(); }, [fetchMatch]);
  useEffect(() => {
    if (!matchId) return undefined;
    const timer = setInterval(fetchMatch, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [matchId, fetchMatch]);

  const {
    saving,
    error: actionError,
    successMessage,
    handleManualVote,
    handleCloseMatch,
    handleExtendOvertime,
  } = useMatchActions(match, fetchMatch);

  if (loading) return <Gutter><LoadingSpinner /></Gutter>;

  if (!matchId) {
    return (
      <Gutter>
        <EmptyState message="Save this match first to use controls." />
      </Gutter>
    );
  }

  if (!match) {
    return (
      <Gutter>
        {fetchError ? (
          <div className="match-controls-tab__alert match-controls-tab__alert--error">{fetchError}</div>
        ) : (
          <EmptyState message="Match data could not be loaded." />
        )}
      </Gutter>
    );
  }

  return (
    <Gutter>
      <MatchControlsPanel
        match={match}
        saving={saving}
        error={fetchError ?? actionError}
        successMessage={successMessage}
        onManualVote={handleManualVote}
        onClose={handleCloseMatch}
        onExtend={handleExtendOvertime}
      />
    </Gutter>
  );
};

export default MatchControlsTab;
