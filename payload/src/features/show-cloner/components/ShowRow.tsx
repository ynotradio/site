'use client';

// Component for displaying a show row
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import type { ShowRowProps, Show } from '../types';
import './ShowRow.css';

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
    <div className="show-row">
      <span className="show-row__name">{displayName}</span>
      <span className="show-row__time">
        {startTimeFormatted} - {endTimeFormatted}
      </span>
    </div>
  );
};

export default ShowRow;
