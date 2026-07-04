'use client';

import React from 'react';
import { EmptyState } from '../shared/EmptyState';
import type {
  Top11Contest,
  Top11ContestStats,
  Top11ContestStatus,
  Top11PickWinnerResult,
} from './types';
import './Top11ContestControlsTab.css';

export const NEXT_STATUSES: Record<Top11ContestStatus, Top11ContestStatus[]> = {
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

const STATUS_LABEL: Record<Top11ContestStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  closed: 'Closed',
  published: 'Published',
  archived: 'Archived',
};

const ADMIN_BASE = '/admin/collections';

const relatedCollectionLink = (slug: string, contestId: number): string => `${ADMIN_BASE}/${slug}?where[contest][equals]=${contestId}`;

export const formatWeekOf = (weekOf: string): string => {
  const date = new Date(weekOf);
  if (Number.isNaN(date.getTime())) return weekOf;
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
};

interface RelatedLinksProps {
  contestId: number;
}

export const RelatedLinks: React.FC<RelatedLinksProps> = ({ contestId }) => (
  <nav className="top11-controls-tab__related-links" aria-label="Related records">
    <a
      className="top11-controls-tab__related-link"
      href={relatedCollectionLink('top11-votes', contestId)}
    >
      🗳️ Votes
    </a>
    <a
      className="top11-controls-tab__related-link"
      href={relatedCollectionLink('top11-write-ins', contestId)}
    >
      ✍️ Write-ins
    </a>
    <a
      className="top11-controls-tab__related-link"
      href={relatedCollectionLink('top11-contestants', contestId)}
    >
      🎟️ Contestants
    </a>
    <a
      className="top11-controls-tab__related-link"
      href={relatedCollectionLink('top11-winner-draws', contestId)}
    >
      🏆 Winner Draws
    </a>
  </nav>
);

interface StatusCardProps {
  contest: Top11Contest;
  saving: boolean;
  onSetStatus: (status: Top11ContestStatus) => Promise<void>;
  onClone: () => Promise<void>;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  contest,
  saving,
  onSetStatus,
  onClone,
}) => {
  const availableTransitions = NEXT_STATUSES[contest.status];

  return (
    <div className="top11-controls-tab__card">
      <div className="top11-controls-tab__card-header">
        <div>
          <h4 className="top11-controls-tab__section-title">{formatWeekOf(contest.weekOf)}</h4>
          <span
            className={`top11-controls-tab__status-badge top11-controls-tab__status-badge--${contest.status}`}
          >
            {STATUS_LABEL[contest.status]}
          </span>
        </div>
      </div>

      <RelatedLinks contestId={contest.id} />

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
              className="top11-controls-tab__action-btn top11-controls-tab__action-btn--primary"
              disabled={saving}
              onClick={() => onSetStatus(nextStatus)}
            >
              {TRANSITION_LABEL[transitionKey] ?? `Set to ${nextStatus}`}
            </button>
          );
        })}
        <button
          type="button"
          className="top11-controls-tab__action-btn top11-controls-tab__action-btn--secondary"
          disabled={saving}
          onClick={onClone}
        >
          Clone as New Draft
        </button>
      </div>
    </div>
  );
};

interface ResultsCardProps {
  stats: Top11ContestStats | null;
}

export const ResultsCard: React.FC<ResultsCardProps> = ({ stats }) => (
  <div className="top11-controls-tab__card">
    <h4 className="top11-controls-tab__section-title">Results</h4>
    {stats ? (
      <div className="top11-controls-tab__stats">
        <dl className="top11-controls-tab__stat-grid">
          <div className="top11-controls-tab__stat">
            <dt>Total votes</dt>
            <dd>{stats.totalVotes}</dd>
          </div>
          <div className="top11-controls-tab__stat">
            <dt>Unique voters</dt>
            <dd>{stats.uniqueVoters}</dd>
          </div>
          <div className="top11-controls-tab__stat">
            <dt>Contestants entered</dt>
            <dd>{stats.contestants}</dd>
          </div>
          <div className="top11-controls-tab__stat">
            <dt>Newsletter opt-ins</dt>
            <dd>{stats.newsletterOptInContestants}</dd>
          </div>
          <div className="top11-controls-tab__stat">
            <dt>Write-ins</dt>
            <dd>{stats.writeInCount}</dd>
          </div>
        </dl>
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
                <td className="top11-controls-tab__ranking-order">{row.displayOrder}</td>
                <td>
                  <a
                    className="top11-controls-tab__song-link"
                    href={`${ADMIN_BASE}/songs/${row.song}`}
                  >
                    {row.songArtist && row.songTitle
                      ? `${row.songArtist} — ${row.songTitle}`
                      : (row.songTitle ?? `Song #${row.song}`)}
                  </a>
                </td>
                <td className="top11-controls-tab__ranking-votes">{row.votes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <EmptyState message="Stats are not available yet." />
    )}
  </div>
);

interface WriteInsCardProps {
  stats: Top11ContestStats | null;
}

export const WriteInsCard: React.FC<WriteInsCardProps> = ({ stats }) => (
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
              <td className="top11-controls-tab__ranking-votes">{row.count}</td>
              <td className="top11-controls-tab__ranking-votes">
                {row.hiddenCount > 0 ? row.hiddenCount : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <EmptyState message="No write-ins submitted yet." />
    )}
  </div>
);

interface WinnerDrawCardProps {
  saving: boolean;
  canPickWinner: boolean;
  lastWinner: Top11PickWinnerResult | null;
  onPickWinner: () => Promise<void>;
}

export const WinnerDrawCard: React.FC<WinnerDrawCardProps> = ({
  saving,
  canPickWinner,
  lastWinner,
  onPickWinner,
}) => (
  <div className="top11-controls-tab__card">
    <h4 className="top11-controls-tab__section-title">Winner Draw</h4>
    {lastWinner && (
      <div className="top11-controls-tab__winner-result">
        <span className="top11-controls-tab__winner-name">
          {`${lastWinner.winner.firstName} ${lastWinner.winner.lastName}`}
        </span>
        <span className="top11-controls-tab__winner-detail">{lastWinner.winner.email}</span>
        <span className="top11-controls-tab__winner-detail">
          {`Drawn from ${lastWinner.eligibleEntries} of ${lastWinner.totalEntries} eligible entries`}
          {lastWinner.excludePriorWinners ? ' (prior winners excluded)' : ''}
        </span>
      </div>
    )}
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
);
