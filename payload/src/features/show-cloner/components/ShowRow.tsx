'use client';

// Component for displaying a show row
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

export const ShowRow = ({ show }: ShowRowProps) => {
  const displayName = getShowDisplayName(show);

  return (
    <div
      style={{
        padding: '8px 12px',
        margin: '4px 0',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span style={{ fontSize: '14px', fontWeight: 500 }}>
        {displayName}
      </span>
      <span style={{ fontSize: '13px', color: '#666' }}>
        {show.startTime} - {show.endTime}
      </span>
    </div>
  );
};

export default ShowRow;
