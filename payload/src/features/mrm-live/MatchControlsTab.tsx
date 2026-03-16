'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Gutter, useDocumentInfo } from '@payloadcms/ui';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import { AdminScoreboard } from '../mrm-shared/AdminScoreboard';
import { useMatchActions } from './useMatchActions';
import type { LiveMatch } from './types';
import {
  getMatchStatus,
  getVotePercent,
  getTournamentId,
  getNextMatchId,
} from './matchControlsUtils';
import {
  NavLinks,
  MatchCardHeader,
  MatchCardBody,
  ActionButtons,
  AdminLinks,
} from './MatchControlsPanels';
import './MatchControlsTab.css';

const POLL_INTERVAL_MS = 5000;

interface MatchControlsPanelProps {
  match: LiveMatch;
  previousMatchId: string | null;
  saving: boolean;
  error: string | null;
  successMessage: string | null;
  onManualVote: (bandKey: 'band1' | 'band2') => Promise<void>;
  onClose: () => Promise<void>;
  onExtend: () => Promise<void>;
  onToggleShowScore: () => Promise<void>;
  onRematch: (startISO: string, durationMin: number) => Promise<void>;
}

const MatchControlsPanel: React.FC<MatchControlsPanelProps> = ({
  match,
  previousMatchId,
  saving,
  error,
  successMessage,
  onManualVote,
  onClose,
  onExtend,
  onToggleShowScore,
  onRematch,
}) => {
  const status = getMatchStatus(match);
  const total = match.band1Votes + match.band2Votes;
  const isTied = match.band1Votes === match.band2Votes && !match.winner;
  const p1 = getVotePercent(match.band1Votes, total);
  const p2 = getVotePercent(match.band2Votes, total);

  return (
    <div className="match-controls-tab">
      <NavLinks
        tournamentId={getTournamentId(match)}
        previousMatchId={previousMatchId}
        nextMatchId={getNextMatchId(match)}
      />

      {error && (
        <div className="match-controls-tab__alert match-controls-tab__alert--error">{error}</div>
      )}
      {successMessage && (
        <div className="match-controls-tab__alert match-controls-tab__alert--success">
          {successMessage}
        </div>
      )}

      <div className="match-controls-tab__card">
        <MatchCardHeader match={match} status={status} />
        <MatchCardBody match={match} saving={saving} onManualVote={onManualVote} />
        <div className="match-controls-tab__scoreboard">
          <AdminScoreboard
            band1Pct={p1}
            band2Pct={p2}
            band1Label={`${match.band1Votes.toLocaleString()} (${p1}%)`}
            band2Label={`${match.band2Votes.toLocaleString()} (${p2}%)`}
          />
        </div>
      </div>

      <div className="match-controls-tab__admin-section">
        <h4 className="match-controls-tab__section-title">Admin Actions</h4>
        <ActionButtons
          saving={saving}
          showScore={match.showScore}
          canClose={status === 'overtime' && !isTied}
          canExtend={status === 'overtime' && isTied}
          onClose={onClose}
          onExtend={onExtend}
          onToggleShowScore={onToggleShowScore}
          onRematch={onRematch}
        />
        <AdminLinks match={match} />
      </div>

      <div className="match-controls-tab__details">
        <div className="match-controls-tab__times">
          <span>{`Start: ${new Date(match.startTime).toLocaleString()}`}</span>
          <span>{`End: ${new Date(match.endTime).toLocaleString()}`}</span>
        </div>
        {match.sponsor && (
          <div className="match-controls-tab__sponsor">
            <strong>Sponsor:</strong> {match.sponsor}
            {match.sponsorMessage && <p>{match.sponsorMessage}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export const MatchControlsTab: React.FC = () => {
  const { data } = useDocumentInfo();
  const matchId = data?.id as string | undefined;

  const [match, setMatch] = useState<LiveMatch | null>(null);
  const [previousMatchId, setPreviousMatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchMatch = useCallback(async () => {
    if (!matchId) {
      setLoading(false);
      return;
    }
    try {
      const base = '/api/modern-rock-madness-matches';
      const res = await fetch(`${base}/${matchId}?depth=2`);
      if (!res.ok) throw new Error('Failed to fetch');
      const doc: LiveMatch = await res.json();
      setMatch(doc);
      setFetchError(null);

      // Fetch previous match (matchNumber - 1 in same tournament)
      const tId = getTournamentId(doc);
      const prevNum = doc.matchNumber - 1;
      if (tId && prevNum >= 1) {
        const qs = `where[tournament][equals]=${tId}`
          + `&where[matchNumber][equals]=${prevNum}`
          + '&limit=1&depth=0';
        const prevRes = await fetch(`${base}?${qs}`);
        if (prevRes.ok) {
          const prevData = await prevRes.json();
          const prev = prevData?.docs?.[0];
          setPreviousMatchId(prev ? String(prev.id) : null);
        }
      } else {
        setPreviousMatchId(null);
      }
    } catch (err) {
      setFetchError('Could not load match data.');
      // eslint-disable-next-line no-console
      console.error('MatchControlsTab fetch:', err);
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
    handleToggleShowScore,
    handleScheduleRematch,
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
        previousMatchId={previousMatchId}
        saving={saving}
        error={fetchError ?? actionError}
        successMessage={successMessage}
        onManualVote={handleManualVote}
        onClose={handleCloseMatch}
        onExtend={handleExtendOvertime}
        onToggleShowScore={handleToggleShowScore}
        onRematch={handleScheduleRematch}
      />
    </Gutter>
  );
};

export default MatchControlsTab;
