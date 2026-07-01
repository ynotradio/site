'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Gutter, useDocumentInfo } from '@payloadcms/ui';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import { useContestActions } from './useContestActions';
import type { Top11Contest, Top11ContestStats, Top11ContestStatus } from './types';
import './Top11ContestControlsTab.css';

const NEXT_STATUSES: Record<Top11ContestStatus, Top11ContestStatus[]> = {
  draft: ['open'],
  open: ['closed'],
  closed: ['open', 'published'],
  published: ['archived'],
  archived: [],
};

// Labels are keyed by "from status -> to status" since the same target
// status can mean different things depending on where the contest is
// coming from (e.g. closed -> open is "Reopen", draft -> open is "Open").
const TRANSITION_LABEL: Record<string, string> = {
  'draft->open': 'Open Voting',
  'open->closed': 'Close Voting',
  'closed->open': 'Reopen Voting',
  'closed->published': 'Publish Results',
  'published->archived': 'Archive',
};

interface ContestControlsPanelProps {
  contest: Top11Contest;
  stats: Top11ContestStats | null;
  saving: boolean;
  error: string | null;
  successMessage: string | null;
  onSetStatus: (status: Top11ContestStatus) => Promise<void>;
  onClone: () => Promise<void>;
  onPickWinner: () => Promise<void>;
}

const ContestControlsPanel: React.FC<ContestControlsPanelProps> = ({
  contest,
  stats,
  saving,
  error,
  successMessage,
  onSetStatus,
  onClone,
  onPickWinner,
}) => {
  const availableTransitions = NEXT_STATUSES[contest.status];
  const canPickWinner = contest.status === 'closed' || contest.status === 'published';

  return (
    <div className="top11-controls-tab">
      {error && (
        <div className="top11-controls-tab__alert top11-controls-tab__alert--error">{error}</div>
      )}
      {successMessage && (
        <div className="top11-controls-tab__alert top11-controls-tab__alert--success">
          {successMessage}
        </div>
      )}

      <div className="top11-controls-tab__card">
        <h4 className="top11-controls-tab__section-title">{`Status: ${contest.status}`}</h4>
        <div className="top11-controls-tab__actions">
          {availableTransitions.length === 0 && (
            <span className="top11-controls-tab__hint">No further transitions available.</span>
          )}
          {availableTransitions.map((nextStatus) => {
            const transitionKey = `${contest.status}->${nextStatus}`;
            return (
              <button
                key={nextStatus}
                type="button"
                className="top11-controls-tab__action-btn"
                disabled={saving}
                onClick={() => onSetStatus(nextStatus)}
              >
                {TRANSITION_LABEL[transitionKey] ?? `Set to ${nextStatus}`}
              </button>
            );
          })}
          <button
            type="button"
            className="top11-controls-tab__action-btn"
            disabled={saving}
            onClick={onClone}
          >
            Clone as New Draft
          </button>
        </div>
      </div>

      <div className="top11-controls-tab__card">
        <h4 className="top11-controls-tab__section-title">Results</h4>
        {stats ? (
          <div className="top11-controls-tab__stats">
            <ul className="top11-controls-tab__stat-list">
              <li>{`Total votes: ${stats.totalVotes}`}</li>
              <li>{`Unique voters: ${stats.uniqueVoters}`}</li>
              <li>{`Contestants entered: ${stats.contestants}`}</li>
              <li>{`Newsletter opt-ins: ${stats.newsletterOptInContestants}`}</li>
              <li>{`Write-ins: ${stats.writeInCount}`}</li>
            </ul>
            <table className="top11-controls-tab__ranking">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Song</th>
                  <th>Votes</th>
                </tr>
              </thead>
              <tbody>
                {stats.rankedSongs.map((row) => (
                  <tr key={row.song}>
                    <td>{row.displayOrder}</td>
                    <td>{row.song}</td>
                    <td>{row.votes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Stats are not available yet." />
        )}
      </div>

      <div className="top11-controls-tab__card">
        <h4 className="top11-controls-tab__section-title">Write-Ins</h4>
        {stats && stats.rankedWriteIns.length > 0 ? (
          <table className="top11-controls-tab__ranking">
            <thead>
              <tr>
                <th>Song</th>
                <th>Count</th>
                <th>Hidden</th>
              </tr>
            </thead>
            <tbody>
              {stats.rankedWriteIns.map((row) => (
                <tr key={row.text}>
                  <td>{row.text}</td>
                  <td>{row.count}</td>
                  <td>{row.hiddenCount > 0 ? row.hiddenCount : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState message="No write-ins submitted yet." />
        )}
      </div>

      <div className="top11-controls-tab__card">
        <h4 className="top11-controls-tab__section-title">Winner Draw</h4>
        <button
          type="button"
          className="top11-controls-tab__action-btn top11-controls-tab__action-btn--warning"
          disabled={saving || !canPickWinner}
          onClick={onPickWinner}
        >
          {saving ? 'Picking…' : 'Pick Winner'}
        </button>
        {!canPickWinner && (
          <p className="top11-controls-tab__hint">
            Voting must be closed (or the contest published) before picking a winner.
          </p>
        )}
      </div>
    </div>
  );
};

export const Top11ContestControlsTab: React.FC = () => {
  const { data } = useDocumentInfo();
  const contestId = data?.id as number | undefined;

  const [contest, setContest] = useState<Top11Contest | null>(null);
  const [stats, setStats] = useState<Top11ContestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchContest = useCallback(async () => {
    if (!contestId) {
      setLoading(false);
      return;
    }
    try {
      const contestRes = await fetch(`/api/top11-contests/${contestId}?depth=0`);
      if (!contestRes.ok) throw new Error('Failed to fetch contest');
      const doc: Top11Contest = await contestRes.json();
      setContest(doc);
      setFetchError(null);

      const statsRes = await fetch(`/api/top11-contests/${contestId}/stats`);
      setStats(statsRes.ok ? await statsRes.json() : null);
    } catch (err) {
      setFetchError('Could not load contest data.');
      // eslint-disable-next-line no-console
      console.error('Top11ContestControlsTab fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  useEffect(() => {
    fetchContest();
  }, [fetchContest]);

  const {
    saving,
    error: actionError,
    successMessage,
    handleSetStatus,
    handleClone,
    handlePickWinner,
  } = useContestActions(contestId, fetchContest);

  if (loading) {
    return (
      <Gutter>
        <LoadingSpinner />
      </Gutter>
    );
  }

  if (!contestId) {
    return (
      <Gutter>
        <EmptyState message="Save this contest first to use controls." />
      </Gutter>
    );
  }

  if (!contest) {
    return (
      <Gutter>
        {fetchError ? (
          <div className="top11-controls-tab__alert top11-controls-tab__alert--error">
            {fetchError}
          </div>
        ) : (
          <EmptyState message="Contest data could not be loaded." />
        )}
      </Gutter>
    );
  }

  return (
    <Gutter>
      <ContestControlsPanel
        contest={contest}
        stats={stats}
        saving={saving}
        error={fetchError ?? actionError}
        successMessage={successMessage}
        onSetStatus={handleSetStatus}
        onClone={handleClone}
        onPickWinner={() => handlePickWinner()}
      />
    </Gutter>
  );
};

export default Top11ContestControlsTab;
