import { useCallback, useState } from 'react';
import type { Top11ContestStatus, Top11PickWinnerResult } from './types';

interface ContestActions {
  saving: boolean;
  error: string | null;
  successMessage: string | null;
  lastWinner: Top11PickWinnerResult | null;
  handleSetStatus: (status: Top11ContestStatus) => Promise<void>;
  handleClone: () => Promise<void>;
  handlePickWinner: (excludePriorWinners?: boolean) => Promise<void>;
}

const STATUS_ENDPOINT: Record<Top11ContestStatus, string | null> = {
  draft: null,
  open: 'open',
  closed: 'close',
  published: 'publish',
  archived: 'archive',
};

const parseErrorMessage = async (res: Response, fallback: string): Promise<string> => {
  try {
    const body = await res.json();
    return body?.errors?.[0]?.message || fallback;
  } catch {
    return fallback;
  }
};

export const useContestActions = (
  contestId: number | undefined,
  onComplete: () => Promise<void>,
): ContestActions => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastWinner, setLastWinner] = useState<Top11PickWinnerResult | null>(null);

  const withSaving = useCallback(
    async (label: string, action: () => Promise<string>) => {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      try {
        const message = await action();
        setSuccessMessage(message);
        await onComplete();
      } catch (err) {
        setError(err instanceof Error ? err.message : `${label} failed. Please try again.`);
        // eslint-disable-next-line no-console
        console.error(`useContestActions ${label} error:`, err);
      } finally {
        setSaving(false);
      }
    },
    [onComplete],
  );

  const handleSetStatus = useCallback(
    async (status: Top11ContestStatus) => {
      if (!contestId) return;
      const endpoint = STATUS_ENDPOINT[status];
      if (!endpoint) return;

      await withSaving(`Set status to ${status}`, async () => {
        const res = await fetch(`/api/top11-contests/${contestId}/${endpoint}`, {
          method: 'POST',
        });
        if (!res.ok) {
          throw new Error(await parseErrorMessage(res, `Could not set status to ${status}.`));
        }
        return `Contest status set to ${status}.`;
      });
    },
    [contestId, withSaving],
  );

  const handleClone = useCallback(async () => {
    if (!contestId) return;
    await withSaving('Clone contest', async () => {
      const res = await fetch('/api/top11-contests/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceContestId: contestId }),
      });
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res, 'Could not clone this contest.'));
      }
      const body = await res.json();
      return `Cloned as new draft contest #${body?.id ?? '?'}.`;
    });
  }, [contestId, withSaving]);

  const handlePickWinner = useCallback(
    async (excludePriorWinners?: boolean) => {
      if (!contestId) return;
      await withSaving('Pick winner', async () => {
        const res = await fetch(`/api/top11-contests/${contestId}/pick-winner`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(excludePriorWinners === undefined ? {} : { excludePriorWinners }),
        });
        if (!res.ok) {
          throw new Error(await parseErrorMessage(res, 'Could not pick a winner.'));
        }
        const result: Top11PickWinnerResult = await res.json();
        setLastWinner(result);
        return `Winner picked: ${result.winner.firstName} ${result.winner.lastName}.`;
      });
    },
    [contestId, withSaving],
  );

  return {
    saving,
    error,
    successMessage,
    lastWinner,
    handleSetStatus,
    handleClone,
    handlePickWinner,
  };
};
