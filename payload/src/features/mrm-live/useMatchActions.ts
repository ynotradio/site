import { useState, useCallback } from 'react';
import type { LiveMatch } from './types';

const OVERTIME_MINUTES = 15;

interface MatchActions {
  saving: boolean;
  error: string | null;
  successMessage: string | null;
  handleManualVote: (bandKey: 'band1' | 'band2') => Promise<void>;
  handleCloseMatch: () => Promise<void>;
  handleExtendOvertime: () => Promise<void>;
}

const logEvent = async (matchId: string, eventType: string, snapshot: object) => {
  await fetch('/api/madness-match-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ match: matchId, eventType, snapshot }),
  });
};

export const useMatchActions = (
  match: LiveMatch | null,
  onComplete: () => Promise<void>,
): MatchActions => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const withSaving = useCallback(async (label: string, action: () => Promise<void>) => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await action();
      setSuccessMessage(`${label} succeeded.`);
      await onComplete();
    } catch (err) {
      setError(`${label} failed. Please try again.`);
      // eslint-disable-next-line no-console
      console.error(`useMatchActions ${label} error:`, err);
    } finally {
      setSaving(false);
    }
  }, [onComplete]);

  const handleManualVote = useCallback(async (bandKey: 'band1' | 'band2') => {
    if (!match) return;
    const votesField = bandKey === 'band1' ? 'band1Votes' : 'band2Votes';
    const newCount = match[votesField] + 1;
    await withSaving('Manual vote', async () => {
      const res = await fetch(`/api/madness-matches/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [votesField]: newCount }),
      });
      if (!res.ok) throw new Error('PATCH failed');
      await logEvent(match.id, 'admin_vote', {
        bandKey,
        band1Votes: match.band1Votes,
        band2Votes: match.band2Votes,
      });
    });
  }, [match, withSaving]);

  const handleCloseMatch = useCallback(async () => {
    if (!match) return;
    const { band1, band2 } = match;
    if (!band1 || !band2 || typeof band1 === 'string' || typeof band2 === 'string') return;
    await withSaving('Close match', async () => {
      if (match.band1Votes === match.band2Votes) throw new Error('Cannot close a tied match');
      const winnerId = match.band1Votes > match.band2Votes ? band1.id : band2.id;
      const res = await fetch(`/api/madness-matches/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner: winnerId }),
      });
      if (!res.ok) throw new Error('PATCH failed');
      await logEvent(match.id, 'match_closed', {
        band1Votes: match.band1Votes,
        band2Votes: match.band2Votes,
        winnerId,
      });
    });
  }, [match, withSaving]);

  const handleExtendOvertime = useCallback(async () => {
    if (!match) return;
    // Extend from the current endTime, not from now, so chained extensions accumulate correctly
    const newEnd = new Date(
      new Date(match.endTime).getTime() + OVERTIME_MINUTES * 60 * 1000,
    ).toISOString();
    await withSaving('Extend overtime', async () => {
      const res = await fetch(`/api/madness-matches/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endTime: newEnd }),
      });
      if (!res.ok) throw new Error('PATCH failed');
      await logEvent(match.id, 'overtime_extended', {
        previousEndTime: match.endTime,
        newEnd,
      });
    });
  }, [match, withSaving]);

  return {
    saving,
    error,
    successMessage,
    handleManualVote,
    handleCloseMatch,
    handleExtendOvertime,
  };
};
