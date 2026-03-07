'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Gutter, useStepNav } from '@payloadcms/ui';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import { useMatchActions } from './useMatchActions';
import type { LiveMatch, MatchApiResponse, MatchStatus } from './types';
import './LiveMatchClient.css';

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

interface MatchPanelProps {
  match: LiveMatch;
  status: MatchStatus;
  saving: boolean;
  canVote: boolean;
  canClose: boolean;
  canExtend: boolean;
  onManualVote: (bandKey: 'band1' | 'band2') => Promise<void>;
  onClose: () => Promise<void>;
  onExtend: () => Promise<void>;
}

const MatchPanel: React.FC<MatchPanelProps> = ({
  match,
  status,
  saving,
  canVote,
  canClose,
  canExtend,
  onManualVote,
  onClose,
  onExtend,
}) => (
  <div className="live-match-client__match">
    <div className="live-match-client__meta">
      <span className={`live-match-client__status live-match-client__status--${status}`}>
        {status === 'live' && '🔴 LIVE'}
        {status === 'upcoming' && '⏳ Upcoming'}
        {status === 'overtime' && '⏰ Overtime'}
        {status === 'closed' && '✅ Closed'}
      </span>
      <span className="live-match-client__round">
        Round {match.round} · Match #{match.matchNumber}
      </span>
      <a href={`/admin/collections/madness-matches/${match.id}`} className="live-match-client__edit-link">
        Edit Match →
      </a>
    </div>

    <div className="live-match-client__bands">
      {(['band1', 'band2'] as const).map((bandKey, i) => {
        const band = match[bandKey];
        const votes = bandKey === 'band1' ? match.band1Votes : match.band2Votes;
        const total = match.band1Votes + match.band2Votes;
        const pct = getVotePercent(votes, total);
        const won = isWinner(match, bandKey);
        const seed = getBandSeed(band);
        return (
          <div key={bandKey} className={`live-match-client__band ${won ? 'live-match-client__band--winner' : ''}`}>
            <div className="live-match-client__band-name">
              {seed !== null && <span className="live-match-client__seed">#{seed}</span>}
              {getBandName(band)}
              {won && <span className="live-match-client__crown"> 🏆</span>}
            </div>
            <div className="live-match-client__votes">
              <span className="live-match-client__vote-count">{votes.toLocaleString()}</span>
              <span className="live-match-client__vote-pct">{pct}%</span>
            </div>
            <div className="live-match-client__bar-track">
              <div className="live-match-client__bar-fill" style={{ width: `${pct}%` }} aria-label={`${pct}% of votes`} />
            </div>
            {canVote && (
              <button
                type="button"
                className="live-match-client__vote-btn"
                onClick={() => onManualVote(bandKey)}
                disabled={saving}
                aria-label={`Manual vote for ${getBandName(band)} (band ${i + 1})`}
              >
                {saving ? '…' : 'Manual Vote'}
              </button>
            )}
          </div>
        );
      })}
    </div>

    <div className="live-match-client__actions">
      {canClose && (
        <button type="button" className="live-match-client__action-btn live-match-client__action-btn--danger" onClick={onClose} disabled={saving}>
          {saving ? 'Closing…' : 'Close Match'}
        </button>
      )}
      {canExtend && (
        <button type="button" className="live-match-client__action-btn live-match-client__action-btn--warning" onClick={onExtend} disabled={saving}>
          {saving ? 'Extending…' : 'Extend Overtime (+15 min)'}
        </button>
      )}
    </div>

    {match.sponsor && (
      <div className="live-match-client__sponsor">
        <strong>Sponsor:</strong>
        {' '}
        {match.sponsor}
        {match.sponsorMessage && <p>{match.sponsorMessage}</p>}
      </div>
    )}

    <div className="live-match-client__times">
      <span>Start: {new Date(match.startTime).toLocaleString()}</span>
      <span>End: {new Date(match.endTime).toLocaleString()}</span>
    </div>
  </div>
);

export const LiveMatchClient: React.FC = () => {
  const [match, setMatch] = useState<LiveMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { setStepNav } = useStepNav();

  useEffect(() => {
    setStepNav([
      { label: 'Modern Rock Madness', url: '/admin/collections/madness-matches' },
      { label: 'Live Match' },
    ]);
  }, [setStepNav]);

  const fetchCurrentMatch = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      // depth=2 to populate nextMatch.band1/band2 for bracket progression
      const url = `/api/madness-matches?where[tournament.status][equals]=active&where[startTime][less_than_equal]=${encodeURIComponent(now)}&sort=-startTime&limit=1&depth=2`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch match');
      const data: MatchApiResponse = await res.json();
      setMatch(data.docs[0] ?? null);
      setFetchError(null);
    } catch (err) {
      setFetchError('Could not load match data. Is the API reachable?');
      // eslint-disable-next-line no-console
      console.error('LiveMatchClient fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCurrentMatch(); }, [fetchCurrentMatch]);
  useEffect(() => {
    const timer = setInterval(fetchCurrentMatch, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchCurrentMatch]);

  const {
    saving,
    error: actionError,
    successMessage,
    handleManualVote,
    handleCloseMatch,
    handleExtendOvertime,
  } = useMatchActions(match, fetchCurrentMatch);

  const error = fetchError ?? actionError;

  if (loading) return <Gutter><LoadingSpinner /></Gutter>;

  const status = match ? getMatchStatus(match) : null;
  const isTied = !!(match && match.band1Votes === match.band2Votes && !match.winner);

  return (
    <Gutter>
      <div className="live-match-client">
        <div className="live-match-client__header">
          <h1 className="live-match-client__title">Live Match</h1>
          <p className="live-match-client__description">
            Monitor vote counts and manage the current match in real time.
            Vote counts refresh every {POLL_INTERVAL_MS / 1000} seconds.
          </p>
        </div>

        {error && <div className="live-match-client__alert live-match-client__alert--error">{error}</div>}
        {successMessage && <div className="live-match-client__alert live-match-client__alert--success">{successMessage}</div>}

        {!match ? (
          <EmptyState message="No match has started yet for the active tournament." />
        ) : (
          <MatchPanel
            match={match}
            status={status ?? 'upcoming'}
            saving={saving}
            canVote={status === 'live' || (status === 'overtime' && isTied)}
            canClose={status === 'overtime' && !isTied}
            canExtend={status === 'overtime' && isTied}
            onManualVote={handleManualVote}
            onClose={handleCloseMatch}
            onExtend={handleExtendOvertime}
          />
        )}
      </div>
    </Gutter>
  );
};

export default LiveMatchClient;
