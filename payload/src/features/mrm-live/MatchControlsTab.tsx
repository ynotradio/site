'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Gutter, useDocumentInfo } from '@payloadcms/ui';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import { AdminBracketMatch } from '../mrm-shared/AdminBracketMatch';
import { AdminScoreboard } from '../mrm-shared/AdminScoreboard';
import { useMatchActions } from './useMatchActions';
import type { LiveMatch } from './types';
import {
  ROUND_LABELS,
  STATUS_LABELS,
  getMatchStatus,
  getVotePercent,
  getWinnerSlot,
  getTournamentId,
  getNextMatchId,
} from './matchControlsUtils';
import { BandPanel, NavLinks, ActionButtons } from './MatchControlsPanels';
import './MatchControlsTab.css';

const POLL_INTERVAL_MS = 5000;

interface MatchControlsPanelProps {
  match: LiveMatch;
  saving: boolean;
  error: string | null;
  successMessage: string | null;
  onManualVote: (bandKey: 'band1' | 'band2') => Promise<void>;
  onClose: () => Promise<void>;
  onExtend: () => Promise<void>;
}

const getBandObj = (band: LiveMatch['band1']) => (band && typeof band !== 'string' ? band : null);

const MatchControlsPanel: React.FC<MatchControlsPanelProps> = ({
  match,
  saving,
  error,
  successMessage,
  onManualVote,
  onClose,
  onExtend,
}) => {
  const status = getMatchStatus(match);
  const isTied = match.band1Votes === match.band2Votes && !match.winner;
  const canVote = status === 'live' || (status === 'overtime' && isTied);
  const total = match.band1Votes + match.band2Votes;
  const p1 = getVotePercent(match.band1Votes, total);
  const p2 = getVotePercent(match.band2Votes, total);
  const b1 = getBandObj(match.band1);
  const b2 = getBandObj(match.band2);

  return (
    <div className="match-controls-tab">
      {error && (
        <div className="match-controls-tab__alert match-controls-tab__alert--error">{error}</div>
      )}
      {successMessage && (
        <div className="match-controls-tab__alert match-controls-tab__alert--success">
          {successMessage}
        </div>
      )}

      <NavLinks tournamentId={getTournamentId(match)} nextMatchId={getNextMatchId(match)} />

      <div className="match-controls-tab__preview">
        <AdminBracketMatch
          band1={b1 ? { seed: b1.seed, name: b1.name, pct: `${p1}%` } : null}
          band2={b2 ? { seed: b2.seed, name: b2.name, pct: `${p2}%` } : null}
          winner={getWinnerSlot(match)}
          live={status === 'live'}
          matchLabel={`#${match.matchNumber}`}
          statusBadge={STATUS_LABELS[status]}
        />
      </div>

      <div className="match-controls-tab__scoreboard">
        <AdminScoreboard
          band1Pct={p1}
          band2Pct={p2}
          band1Label={`${match.band1Votes.toLocaleString()} (${p1}%)`}
          band2Label={`${match.band2Votes.toLocaleString()} (${p2}%)`}
        />
      </div>

      <div className="match-controls-tab__meta">
        <span className={`match-controls-tab__status match-controls-tab__status--${status}`}>
          {STATUS_LABELS[status]}
        </span>
        <span className="match-controls-tab__round">
          {ROUND_LABELS[match.round] ?? `Round ${match.round}`}
          {' · Match #'}
          {match.matchNumber}
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

      <ActionButtons
        saving={saving}
        canClose={status === 'overtime' && !isTied}
        canExtend={status === 'overtime' && isTied}
        onClose={onClose}
        onExtend={onExtend}
      />

      {match.sponsor && (
        <div className="match-controls-tab__sponsor">
          <strong>Sponsor:</strong> {match.sponsor}
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
      const res = await fetch(`/api/modern-rock-madness-matches/${matchId}?depth=2`);
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

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);
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

  if (loading) {
    return (
      <Gutter>
        <LoadingSpinner />
      </Gutter>
    );
  }

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
          <div className="match-controls-tab__alert match-controls-tab__alert--error">
            {fetchError}
          </div>
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
