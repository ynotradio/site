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
  handleToggleShowScore: () => Promise<void>;
  handleScheduleRematch: (startISO: string, durationMin: number) => Promise<void>;
}

const logEvent = async (matchId: string, eventType: string, snapshot: object) => {
  await fetch('/api/modern-rock-madness-match-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ match: matchId, eventType, snapshot }),
  });
};

const patchMatch = async (id: string, data: Record<string, unknown>): Promise<void> => {
  const res = await fetch(`/api/modern-rock-madness-matches/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('PATCH failed');
};

export const useMatchActions = (
  match: LiveMatch | null,
  onComplete: () => Promise<void>,
): MatchActions => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const withSaving = useCallback(
    async (label: string, action: () => Promise<void>) => {
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
    },
    [onComplete],
  );

  const handleManualVote = useCallback(
    async (bandKey: 'band1' | 'band2') => {
      if (!match) return;
      const votesField = bandKey === 'band1' ? 'band1Votes' : 'band2Votes';
      const newCount = match[votesField] + 1;
      await withSaving('Manual vote', async () => {
        await patchMatch(match.id, { [votesField]: newCount });
        await logEvent(match.id, 'admin_vote', {
          bandKey,
          band1Votes: match.band1Votes,
          band2Votes: match.band2Votes,
        });
      });
    },
    [match, withSaving],
  );

  const handleCloseMatch = useCallback(async () => {
    if (!match) return;
    const { band1, band2 } = match;
    if (!band1 || !band2 || typeof band1 === 'string' || typeof band2 === 'string') return;
    await withSaving('Close match', async () => {
      if (match.band1Votes === match.band2Votes) throw new Error('Cannot close a tied match');
      const winnerId = match.band1Votes > match.band2Votes ? band1.id : band2.id;

      // Close the match: set winner and enable public score display
      await patchMatch(match.id, { winner: winnerId, showScore: true });

      // Bracket progression: advance winner to the open slot in the next match
      const nextMatchRef = match.nextMatch;
      if (nextMatchRef && typeof nextMatchRef !== 'string') {
        let openSlot: 'band1' | 'band2' | null = null;
        if (!nextMatchRef.band1) {
          openSlot = 'band1';
        } else if (!nextMatchRef.band2) {
          openSlot = 'band2';
        }
        if (openSlot) {
          const advRes = await fetch(`/api/modern-rock-madness-matches/${nextMatchRef.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [openSlot]: winnerId }),
          });
          if (!advRes.ok) {
            // eslint-disable-next-line no-console
            console.error(
              `Bracket progression PATCH failed for nextMatch ${nextMatchRef.id}: HTTP ${advRes.status}`,
            );
          }
        }
      }

      await logEvent(match.id, 'match_closed', {
        band1Votes: match.band1Votes,
        band2Votes: match.band2Votes,
        winnerId,
        nextMatchId: nextMatchRef && typeof nextMatchRef !== 'string' ? nextMatchRef.id : null,
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
      await patchMatch(match.id, { endTime: newEnd });
      await logEvent(match.id, 'overtime_extended', {
        previousEndTime: match.endTime,
        newEnd,
      });
    });
  }, [match, withSaving]);

  const handleToggleShowScore = useCallback(async () => {
    if (!match) return;
    const newVal = !match.showScore;
    await withSaving(newVal ? 'Show scores' : 'Hide scores', async () => {
      await patchMatch(match.id, { showScore: newVal });
      await logEvent(match.id, 'toggle_show_score', {
        showScore: newVal,
      });
    });
  }, [match, withSaving]);

  const handleScheduleRematch = useCallback(
    async (startISO: string, durationMin: number) => {
      if (!match) return;
      const start = new Date(startISO);
      const end = new Date(start.getTime() + durationMin * 60 * 1000);
      await withSaving('Schedule rematch', async () => {
        await patchMatch(match.id, {
          band1Votes: 0,
          band2Votes: 0,
          winner: null,
          showScore: false,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        });
        await logEvent(match.id, 'rematch_scheduled', {
          previousWinner: match.winner,
          previousBand1Votes: match.band1Votes,
          previousBand2Votes: match.band2Votes,
          newStartTime: start.toISOString(),
          newEndTime: end.toISOString(),
        });
      });
    },
    [match, withSaving],
  );

  return {
    saving,
    error,
    successMessage,
    handleManualVote,
    handleCloseMatch,
    handleExtendOvertime,
    handleToggleShowScore,
    handleScheduleRematch,
  };
};
