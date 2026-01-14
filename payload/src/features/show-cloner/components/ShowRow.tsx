'use client';

// Component for displaying a show row
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import type { ShowRowProps, Show } from '../types';

// Helper to get display name for a show
const getShowDisplayName = (show: Pick<Show, 'name' | 'hostName'>): string => {
  if (show.name && show.hostName) {
    return `${show.name} w/ ${show.hostName}`;
  }
  if (show.hostName) {
    return show.hostName;
  }
  if (show.name) {
    return show.name;
  }
  return 'Untitled Show';
};

// Helper to convert 24-hour time (HH:MM:SS) to 12-hour AM/PM format
const formatTimeAmPm = (time: string): string => {
  if (!time) return '';
  const [hoursStr, minutesStr] = time.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr || '00';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert 0 to 12 for midnight
  return `${hours}:${minutes} ${ampm}`;
};

export const ShowRow = ({ show }: ShowRowProps) => {
  const displayName = getShowDisplayName(show);
  const startTimeFormatted = formatTimeAmPm(show.startTime);
  const endTimeFormatted = formatTimeAmPm(show.endTime);

  return (
    <div
      style={{
        padding: '8px 12px',
        margin: '4px 8px',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>{displayName}</span>
      <span style={{ fontSize: '13px', color: '#666' }}>
        {startTimeFormatted} - {endTimeFormatted}
      </span>
    </div>
  );
};

export default ShowRow;
