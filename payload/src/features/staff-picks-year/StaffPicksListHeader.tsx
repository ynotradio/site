'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import '../shared/ToolLinkPill.css';

interface StartYearResult {
  fromYear?: number;
  toYear?: number;
  created?: number;
  skipped?: number;
  error?: string;
}

const describe = (result: StartYearResult): string => {
  if (result.error) return result.error;
  const skipped = result.skipped ? ` (${result.skipped} already there)` : '';
  return `Added ${result.created} staff from ${result.fromYear} to ${result.toYear}${skipped}. Open each one to enter their picks.`;
};

/**
 * Button above the Staff Picks list that starts this year's records from
 * last year's staff, so editors don't overwrite last year's picks.
 */
export const StaffPicksListHeader: React.FC = () => {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const year = new Date().getFullYear();

  const start = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/year-end-staff-picks/start-year', {
        method: 'POST',
        credentials: 'include',
      });
      setMessage(describe(await res.json()));
      router.refresh();
    } catch {
      setMessage('Could not start the new year. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tool-link-pill-row">
      {message && (
        <span role="status" style={{ marginRight: 12 }}>
          {message}
        </span>
      )}
      <button type="button" className="tool-link-pill" onClick={start} disabled={busy}>
        {busy ? 'Starting…' : `Start ${year} picks from last year's staff`}
      </button>
    </div>
  );
};

export default StaffPicksListHeader;
