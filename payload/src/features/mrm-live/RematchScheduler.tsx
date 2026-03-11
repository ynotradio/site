import React, { useState } from 'react';

const DEFAULT_DURATION = 30;

// eslint-disable-next-line max-len
const WARN_CLS = 'match-controls-tab__action-btn match-controls-tab__action-btn--warning';
const DEFAULT_CLS = 'match-controls-tab__action-btn';

export interface RematchSchedulerProps {
  saving: boolean;
  onConfirm: (startISO: string, durationMin: number) => Promise<void>;
}

/** Inline date/time + duration picker for scheduling a rematch. */
export const RematchScheduler: React.FC<RematchSchedulerProps> = ({ saving, onConfirm }) => {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('14:00');
  const [duration, setDuration] = useState(DEFAULT_DURATION);

  if (!open) {
    return (
      <button type="button" className={WARN_CLS} onClick={() => setOpen(true)} disabled={saving}>
        🔄 Schedule Rematch
      </button>
    );
  }

  const canConfirm = startDate.length > 0 && startTime.length > 0;
  const handleSubmit = async () => {
    if (!canConfirm) return;
    const iso = new Date(`${startDate}T${startTime}`).toISOString();
    await onConfirm(iso, duration);
    setOpen(false);
  };

  return (
    <div className="match-controls-tab__rematch-form">
      <h5 className="match-controls-tab__rematch-title">Schedule Rematch</h5>
      <div className="match-controls-tab__rematch-fields">
        <label className="match-controls-tab__rematch-label">
          Date
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="match-controls-tab__rematch-input"
          />
        </label>
        <label className="match-controls-tab__rematch-label">
          Time
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="match-controls-tab__rematch-input"
          />
        </label>
        <label className="match-controls-tab__rematch-label">
          Duration (min)
          <input
            type="number"
            min={5}
            max={240}
            step={5}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="match-controls-tab__rematch-input"
          />
        </label>
      </div>
      <div className="match-controls-tab__rematch-actions">
        <button
          type="button"
          className={WARN_CLS}
          onClick={handleSubmit}
          disabled={saving || !canConfirm}
        >
          {saving ? 'Scheduling…' : 'Confirm Rematch'}
        </button>
        <button
          type="button"
          className={DEFAULT_CLS}
          onClick={() => setOpen(false)}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
