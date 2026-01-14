'use client';

import React from 'react';
import type { DateGroup, Show } from '../types';
import { formatDateShort } from '../utils';
import { ShowRow } from './ShowRow';

interface SourceDateRangeSelectorProps {
  sourceStartDate: string;
  sourceEndDate: string;
  onSourceStartDateChange: (date: string) => void;
  onSourceEndDateChange: (date: string) => void;
  selectedRangeDateGroups: DateGroup[];
  selectedRangeShows: Show[];
}

export const SourceDateRangeSelector: React.FC<SourceDateRangeSelectorProps> = ({
  sourceStartDate,
  sourceEndDate,
  onSourceStartDateChange,
  onSourceEndDateChange,
  selectedRangeDateGroups,
  selectedRangeShows,
}) => (
  <div
    style={{
      padding: '16px',
      marginBottom: '16px',
      borderRadius: '8px',
      border: '1px solid #ddd',
      backgroundColor: '#fafafa',
    }}
  >
    <div
      style={{
        fontSize: '13px',
        fontWeight: 600,
        marginBottom: '12px',
        color: '#333',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
    >
      Source Date Range (copy from)
    </div>

    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
      <div style={{ flex: 1 }}>
        <label
          htmlFor="source-start-date"
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 500,
            marginBottom: '8px',
            color: '#555',
          }}
        >
          Start Date
        </label>
        <input
          id="source-start-date"
          type="date"
          value={sourceStartDate}
          onChange={(e) => onSourceStartDateChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '14px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            backgroundColor: '#fff',
            color: '#333',
            colorScheme: 'light',
          }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <label
          htmlFor="source-end-date"
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 500,
            marginBottom: '8px',
            color: '#555',
          }}
        >
          End Date
        </label>
        <input
          id="source-end-date"
          type="date"
          value={sourceEndDate}
          onChange={(e) => onSourceEndDateChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '14px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            backgroundColor: '#fff',
            color: '#333',
            colorScheme: 'light',
          }}
        />
      </div>
    </div>

    {selectedRangeDateGroups.length > 0 && (
      <div>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 500,
            marginBottom: '8px',
            color: '#333',
          }}
        >
          Shows in selected range ({selectedRangeShows.length} total):
        </div>
        <div
          style={{
            maxHeight: '300px',
            overflowY: 'auto',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            backgroundColor: '#fff',
          }}
        >
          {selectedRangeDateGroups.map((group) => (
            <div key={group.date}>
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#f5f5f5',
                  borderBottom: '1px solid #e0e0e0',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#555',
                }}
              >
                {group.dayName}, {formatDateShort(group.date)} ({group.shows.length} show
                {group.shows.length !== 1 ? 's' : ''})
              </div>
              <div style={{ padding: '4px 0' }}>
                {group.shows.map((show) => (
                  <ShowRow key={show.id} show={show} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {sourceStartDate && sourceEndDate && selectedRangeShows.length === 0 && (
      <div
        style={{
          padding: '12px',
          textAlign: 'center',
          color: '#666',
          fontSize: '14px',
        }}
      >
        No shows found in the selected date range.
      </div>
    )}
  </div>
);
