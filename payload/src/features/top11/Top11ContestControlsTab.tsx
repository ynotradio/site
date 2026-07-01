'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Gutter, useDocumentInfo } from '@payloadcms/ui';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import { useContestActions } from './useContestActions';
import {
  StatusCard,
  ResultsCard,
  WriteInsCard,
  WinnerDrawCard,
} from './Top11ContestControlsPanels';
import type {
  Top11Contest,
  Top11ContestStats,
  Top11ContestStatus,
  Top11PickWinnerResult,
} from './types';
import './Top11ContestControlsTab.css';

interface ContestControlsPanelProps {
  contest: Top11Contest;
  stats: Top11ContestStats | null;
  saving: boolean;
  error: string | null;
  successMessage: string | null;
  lastWinner: Top11PickWinnerResult | null;
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
  lastWinner,
  onSetStatus,
  onClone,
  onPickWinner,
}) => {
  const canPickWinner = contest.status === 'closed' || contest.status === 'published';

  return (
    <div className="top11-controls-tab">
      {error && (
        <div className="top11-controls-tab__alert top11-controls-tab__alert--error" role="alert">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="top11-controls-tab__alert top11-controls-tab__alert--success" role="status">
          {successMessage}
        </div>
      )}

      <StatusCard contest={contest} saving={saving} onSetStatus={onSetStatus} onClone={onClone} />
      <ResultsCard stats={stats} />
      <WriteInsCard stats={stats} />
      <WinnerDrawCard
        saving={saving}
        canPickWinner={canPickWinner}
        lastWinner={lastWinner}
        onPickWinner={onPickWinner}
      />
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
    lastWinner,
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
        lastWinner={lastWinner}
        onSetStatus={handleSetStatus}
        onClone={handleClone}
        onPickWinner={() => handlePickWinner()}
      />
    </Gutter>
  );
};

export default Top11ContestControlsTab;
