'use client';

import React, { useCallback, useMemo } from 'react';
import { useField } from '@payloadcms/ui';
import './TimePickerField.css';

interface TimePickerFieldProps {
  path: string;
}

// Parse "HH:MM" or "HH:MM:SS" 24h string → { hours12, minutes, ampm }
function parseTime(value: string): { hours12: number; minutes: number; ampm: 'AM' | 'PM' } {
  const [hStr = '0', mStr = '0'] = (value || '').split(':');
  const h24 = parseInt(hStr, 10) || 0;
  const minutes = parseInt(mStr, 10) || 0;
  const ampm: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  const hours12 = h24 % 12 || 12;
  return { hours12, minutes, ampm };
}

// Convert back to "HH:MM" 24h
function toHHMM(hours12: number, minutes: number, ampm: 'AM' | 'PM'): string {
  let h24 = hours12 % 12;
  if (ampm === 'PM') h24 += 12;
  return `${String(h24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = [0, 15, 30, 45];

export const TimePickerField: React.FC<TimePickerFieldProps> = ({ path }) => {
  const { value, setValue } = useField<string>({ path });

  const { hours12, minutes, ampm } = useMemo(() => parseTime(value || ''), [value]);

  const handleChange = useCallback(
    (nextH: number, nextM: number, nextAP: 'AM' | 'PM') => {
      setValue(toHHMM(nextH, nextM, nextAP));
    },
    [setValue],
  );

  return (
    <div className="time-picker" role="group" aria-label="Time">
      <select
        className="time-picker__select time-picker__select--hour"
        value={hours12}
        aria-label="Hour"
        onChange={(e) => handleChange(Number(e.target.value), minutes, ampm)}
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="time-picker__colon" aria-hidden="true">
        :
      </span>
      <select
        className="time-picker__select time-picker__select--minute"
        value={minutes}
        aria-label="Minute"
        onChange={(e) => handleChange(hours12, Number(e.target.value), ampm)}
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {String(m).padStart(2, '0')}
          </option>
        ))}
      </select>
      <select
        className="time-picker__select time-picker__select--ampm"
        value={ampm}
        aria-label="AM or PM"
        onChange={(e) => handleChange(hours12, minutes, e.target.value as 'AM' | 'PM')}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
};

export default TimePickerField;
